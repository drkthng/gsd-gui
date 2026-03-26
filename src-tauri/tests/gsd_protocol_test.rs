//! Integration tests for GSD binary discovery → spawn → JSONL exchange → response parsing.
//!
//! These tests spawn the real `gsd --mode rpc` process and exercise the JSONL protocol.
//! They skip gracefully when the `gsd` binary is not installed (CI environments).

use std::path::PathBuf;

use gsd_gui_lib::gsd_resolve::{resolve_gsd_binary, build_gsd_command};
use gsd_gui_lib::gsd_rpc::*;

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::time::{timeout, Duration};

/// Helper: wraps resolve_gsd_binary() into an Option for skip-friendly tests.
fn find_gsd() -> Option<PathBuf> {
    resolve_gsd_binary().ok()
}

// ---------------------------------------------------------------------------
// Test 1: binary discovery
// ---------------------------------------------------------------------------

#[tokio::test]
async fn test_binary_discovery_finds_gsd() {
    match resolve_gsd_binary() {
        Ok(path) => {
            println!("Resolved gsd binary at: {}", path.display());
            assert!(path.exists(), "Resolved path should exist on disk");
        }
        Err(msg) => {
            println!("SKIP: gsd binary not installed — {}", msg);
        }
    }
}

// ---------------------------------------------------------------------------
// Test 2: spawn + get_state (happy path)
// ---------------------------------------------------------------------------

#[tokio::test]
async fn test_spawn_and_get_state() {
    let gsd_bin = match find_gsd() {
        Some(p) => p,
        None => {
            println!("SKIP: gsd not installed");
            return;
        }
    };

    // Wrap the entire test in a timeout to prevent hangs
    let result = timeout(Duration::from_secs(30), async {
        let tmpdir = tempfile::tempdir().expect("failed to create tempdir");
        let project_path = tmpdir.path().to_str().unwrap();

        let mut cmd = build_gsd_command(&gsd_bin, project_path);
        cmd.stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true);

        // On Windows, prevent a console window from appearing
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn().expect("failed to spawn gsd process");

        let stdout = child.stdout.take().expect("failed to capture stdout");
        let mut stdin = child.stdin.take().expect("failed to capture stdin");
        let mut reader = BufReader::new(stdout).lines();

        // Phase 1: Read startup events — expect ExtensionUiRequest and/or ExtensionsReady
        let mut saw_extensions_ready = false;
        let mut startup_events: Vec<RpcEvent> = Vec::new();

        let startup_deadline = Duration::from_secs(20);
        let startup_result = timeout(startup_deadline, async {
            while let Some(line) = reader.next_line().await.expect("IO error reading stdout") {
                let event = match parse_event(&line) {
                    Ok(evt) => evt,
                    Err(e) => {
                        eprintln!("Failed to parse JSONL line: {line} — error: {e}");
                        continue;
                    }
                };

                eprintln!("Startup event: {:?}", event);
                startup_events.push(event.clone());

                if matches!(event, RpcEvent::ExtensionsReady { .. }) {
                    saw_extensions_ready = true;
                    break;
                }
            }
        })
        .await;

        assert!(
            startup_result.is_ok(),
            "Timed out waiting for ExtensionsReady. Got {} events: {:?}",
            startup_events.len(),
            startup_events
        );
        assert!(
            saw_extensions_ready,
            "Expected ExtensionsReady in startup sequence"
        );

        // Phase 2: Send get_state command
        let cmd_str =
            serialize_command(&RpcCommand::GetState).expect("failed to serialize get_state");
        stdin
            .write_all(cmd_str.as_bytes())
            .await
            .expect("failed to write get_state to stdin");
        stdin.flush().await.expect("failed to flush stdin");

        // Phase 3: Read until we get a Response for get_state
        let mut got_response = false;
        let response_deadline = Duration::from_secs(10);
        let response_result = timeout(response_deadline, async {
            while let Some(line) = reader.next_line().await.expect("IO error reading stdout") {
                let event = match parse_event(&line) {
                    Ok(evt) => evt,
                    Err(e) => {
                        eprintln!("Failed to parse line: {line} — error: {e}");
                        continue;
                    }
                };

                eprintln!("Response-phase event: {:?}", event);

                if let RpcEvent::Response {
                    command,
                    success,
                    data,
                    error,
                } = &event
                {
                    if command == "get_state" {
                        assert!(success, "get_state should succeed, error: {:?}", error);
                        assert!(data.is_some(), "get_state response should include data");
                        got_response = true;
                        break;
                    }
                }
            }
        })
        .await;

        assert!(
            response_result.is_ok(),
            "Timed out waiting for get_state response"
        );
        assert!(got_response, "Expected Response with command=get_state");

        // Cleanup: kill the child process
        child.kill().await.expect("failed to kill gsd process");
    })
    .await;

    assert!(result.is_ok(), "Test exceeded 30s overall timeout");
}

// ---------------------------------------------------------------------------
// Test 3: send malformed/invalid JSON — validate error handling
// ---------------------------------------------------------------------------

#[tokio::test]
async fn test_spawn_and_send_invalid_json() {
    let gsd_bin = match find_gsd() {
        Some(p) => p,
        None => {
            println!("SKIP: gsd not installed");
            return;
        }
    };

    let result = timeout(Duration::from_secs(30), async {
        let tmpdir = tempfile::tempdir().expect("failed to create tempdir");
        let project_path = tmpdir.path().to_str().unwrap();

        let mut cmd = build_gsd_command(&gsd_bin, project_path);
        cmd.stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true);

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000);
        }

        let mut child = cmd.spawn().expect("failed to spawn gsd process");

        let stdout = child.stdout.take().expect("failed to capture stdout");
        let mut stdin = child.stdin.take().expect("failed to capture stdin");
        let mut reader = BufReader::new(stdout).lines();

        // Wait for extensions_ready before sending commands
        let startup_deadline = Duration::from_secs(20);
        let startup_result = timeout(startup_deadline, async {
            while let Some(line) = reader.next_line().await.expect("IO error reading stdout") {
                if let Ok(RpcEvent::ExtensionsReady { .. }) = parse_event(&line) {
                    break;
                }
            }
        })
        .await;

        assert!(
            startup_result.is_ok(),
            "Timed out waiting for ExtensionsReady"
        );

        // Send malformed JSON — not a valid RPC command
        stdin
            .write_all(b"{\"type\":\"nonexistent_command\"}\n")
            .await
            .expect("failed to write malformed command");
        stdin.flush().await.expect("failed to flush stdin");

        // Read response — we should get either an error response or the process
        // continues without crashing. The key assertion is that our parse_event
        // can handle whatever the backend sends back.
        let response_deadline = Duration::from_secs(5);
        let response_result = timeout(response_deadline, async {
            while let Some(line) = reader.next_line().await.expect("IO error reading stdout") {
                let event = parse_event(&line);
                eprintln!("After malformed send: {:?}", event);

                // If we get a Response with success: false, that's the expected error path
                if let Ok(RpcEvent::Response { success: false, .. }) = &event {
                    return true;
                }
                // If we get an Error event, also valid
                if let Ok(RpcEvent::Error { .. }) = &event {
                    return true;
                }
            }
            false
        })
        .await;

        // The process may not reply to an unknown command type, or it may reply
        // with an error. Both are acceptable behaviors. The important thing is:
        // 1. The process didn't crash (we can still interact with it)
        // 2. Our parse_event handled whatever came back

        // Verify process is still alive by sending a valid get_state
        let cmd_str =
            serialize_command(&RpcCommand::GetState).expect("failed to serialize get_state");
        stdin
            .write_all(cmd_str.as_bytes())
            .await
            .expect("failed to write get_state");
        stdin.flush().await.expect("failed to flush stdin");

        let recovery_deadline = Duration::from_secs(10);
        let mut recovered = false;
        let recovery_result = timeout(recovery_deadline, async {
            while let Some(line) = reader.next_line().await.expect("IO error reading stdout") {
                if let Ok(RpcEvent::Response {
                    command, success, ..
                }) = parse_event(&line)
                {
                    if command == "get_state" && success {
                        recovered = true;
                        break;
                    }
                }
            }
        })
        .await;

        assert!(
            recovery_result.is_ok() && recovered,
            "Process should still respond after receiving malformed input"
        );

        // If response_result timed out, it means the process silently ignored
        // the malformed command — that's fine, we verified recovery above.
        if let Ok(got_error) = response_result {
            if got_error {
                eprintln!("Backend returned an error response for malformed command — good");
            } else {
                eprintln!("Backend silently ignored malformed command — acceptable");
            }
        } else {
            eprintln!("No response to malformed command within 5s — process ignored it");
        }

        child.kill().await.expect("failed to kill gsd process");
    })
    .await;

    assert!(result.is_ok(), "Test exceeded 30s overall timeout");
}
