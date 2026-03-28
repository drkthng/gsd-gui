use std::path::Path;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Child;
use tokio::sync::mpsc;

// ---------------------------------------------------------------------------
// Windows Job Object — ensures the child process is killed when the Tauri
// parent exits for ANY reason (crash, force-kill, Task Manager).
//
// kill_on_drop(true) only works on clean Rust drop. A Job Object with
// JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE is enforced by the OS kernel — the child
// is killed as soon as the last handle to the job is closed, even mid-crash.
// ---------------------------------------------------------------------------

#[cfg(windows)]
mod job_object {
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW,
        JobObjectExtendedLimitInformation, QueryInformationJobObject,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    use windows_sys::Win32::System::Threading::{OpenProcess, PROCESS_ALL_ACCESS};

    /// A wrapper that holds a Windows Job Object handle.
    /// When this struct is dropped, the handle is closed, which triggers
    /// JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE and kills all assigned processes.
    pub struct JobObject(HANDLE);

    unsafe impl Send for JobObject {}
    unsafe impl Sync for JobObject {}

    impl Drop for JobObject {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe { CloseHandle(self.0) };
            }
        }
    }

    /// Create a Job Object and assign the given child process PID to it.
    /// The job has JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE set so all assigned
    /// processes are killed when the job handle is closed (parent exits).
    pub fn assign_child_to_job(pid: u32) -> Option<JobObject> {
        unsafe {
            // Create an unnamed job object
            let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
            if job.is_null() {
                return None;
            }

            // Query current limits then add KILL_ON_JOB_CLOSE
            let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
            let ok = QueryInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &mut info as *mut _ as *mut _,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                std::ptr::null_mut(),
            );
            if ok == 0 {
                CloseHandle(job);
                return None;
            }

            info.BasicLimitInformation.LimitFlags |= JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

            let ok = SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &info as *const _ as *const _,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            if ok == 0 {
                CloseHandle(job);
                return None;
            }

            // Open the child process handle
            let proc = OpenProcess(PROCESS_ALL_ACCESS, 0, pid);
            if proc.is_null() {
                CloseHandle(job);
                return None;
            }

            let ok = AssignProcessToJobObject(job, proc);
            CloseHandle(proc);

            if ok == 0 {
                CloseHandle(job);
                return None;
            }

            Some(JobObject(job))
        }
    }
}

use crate::gsd_resolve::build_gsd_command;
use crate::gsd_rpc::{serialize_command, JsonlFramer, RpcCommand};

// Tauri v2 requires Emitter trait for .emit() on AppHandle
#[allow(unused_imports)]
use tauri::Emitter;

/// Manages a running `gsd --mode rpc` child process.
///
/// Communicates via JSONL over stdin/stdout. Spawns background tasks to read
/// stdout (emitting Tauri events per line) and monitor process exit.
pub struct GsdProcess {
    child: Option<Child>,
    stdin_tx: Option<mpsc::Sender<String>>,
    shutdown_tx: Option<mpsc::Sender<()>>,
    /// Windows only: Job Object that kills the child if the parent exits for any reason.
    #[cfg(windows)]
    _job: Option<job_object::JobObject>,
}

/// Payload emitted as a `gsd-event` Tauri event for each JSONL line from stdout.
#[derive(Clone, serde::Serialize)]
pub struct GsdEventPayload {
    pub raw: String,
    pub timestamp: u64,
}

/// Payload emitted as `gsd-process-exit`.
#[derive(Clone, serde::Serialize)]
pub struct GsdExitPayload {
    pub code: Option<i32>,
    pub timestamp: u64,
}

/// Payload emitted as `gsd-process-error`.
#[derive(Clone, serde::Serialize)]
pub struct GsdErrorPayload {
    pub message: String,
    pub timestamp: u64,
}

pub fn unix_timestamp_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

impl GsdProcess {
    /// Spawn a `gsd --mode rpc` child process.
    ///
    /// - `binary_path`: resolved path to the gsd binary
    /// - `project_path`: working directory / project root to pass as `--project`
    /// - `app_handle`: Tauri app handle for emitting events
    ///
    /// On success, background tasks read stdout (emitting `gsd-event` per JSONL line)
    /// and monitor process exit (emitting `gsd-process-exit`).
    pub async fn spawn(
        binary_path: &Path,
        project_path: &str,
        app_handle: tauri::AppHandle,
    ) -> Result<Self, String> {
        let mut cmd = build_gsd_command(binary_path, project_path);
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

        let mut child = cmd
            .spawn()
            .map_err(|e| {
                let msg = format!(
                    "Failed to spawn gsd process at '{}': {}",
                    binary_path.display(),
                    e
                );
                // Emit error event (best-effort)
                let _ = app_handle.emit(
                    "gsd-process-error",
                    GsdErrorPayload {
                        message: msg.clone(),
                        timestamp: unix_timestamp_ms(),
                    },
                );
                msg
            })?;

        // Take stdout for the reader task
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to capture child stdout".to_string())?;

        // Take stdin — we'll write to it via a channel to allow shared access
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to capture child stdin".to_string())?;

        // Capture PID now (before child is moved into the struct) for the Windows Job Object
        #[cfg(windows)]
        let child_pid = child.id();

        // Shutdown signal channel
        let (shutdown_tx, _shutdown_rx) = mpsc::channel::<()>(1);

        // Stdin writer channel — serialized commands are sent here, a task writes them
        let (stdin_tx, mut stdin_rx) = mpsc::channel::<String>(64);

        // Spawn stdin writer task
        tokio::spawn(async move {
            let mut stdin = stdin;
            while let Some(line) = stdin_rx.recv().await {
                if stdin.write_all(line.as_bytes()).await.is_err() {
                    break;
                }
                if stdin.flush().await.is_err() {
                    break;
                }
            }
        });

        // Spawn stdout reader task
        let app_handle_stdout = app_handle.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout);
            let mut framer = JsonlFramer::new();
            let mut buf = vec![0u8; 4096];

            loop {
                use tokio::io::AsyncReadExt;
                match reader.read(&mut buf).await {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        framer.push(&buf[..n]);
                        while let Some(line) = framer.next_line() {
                            let _ = app_handle_stdout.emit(
                                "gsd-event",
                                GsdEventPayload {
                                    raw: line,
                                    timestamp: unix_timestamp_ms(),
                                },
                            );
                        }
                    }
                    Err(_) => break,
                }
            }
        });

        // Spawn stderr drain task — consume stderr to prevent pipe buffer deadlocks
        let stderr = child.stderr.take();
        tokio::spawn(async move {
            if let Some(stderr) = stderr {
                let mut lines = BufReader::new(stderr).lines();
                while let Ok(Some(_line)) = lines.next_line().await {
                    // stderr lines are consumed but not emitted — they're debug output
                }
            }
        });

        Ok(GsdProcess {
            child: Some(child),
            stdin_tx: Some(stdin_tx),
            shutdown_tx: Some(shutdown_tx),
            #[cfg(windows)]
            _job: child_pid.and_then(job_object::assign_child_to_job),
        })
    }

    /// Spawn from an already-created Child process (used for testing).
    #[cfg(test)]
    pub fn from_child(mut child: Child) -> Self {
        let stdin = child.stdin.take();
        let (stdin_tx, mut stdin_rx) = mpsc::channel::<String>(64);
        let (shutdown_tx, _shutdown_rx) = mpsc::channel::<()>(1);

        // Spawn stdin writer if we have stdin
        if let Some(stdin_handle) = stdin {
            tokio::spawn(async move {
                let mut stdin_handle = stdin_handle;
                while let Some(line) = stdin_rx.recv().await {
                    if stdin_handle.write_all(line.as_bytes()).await.is_err() {
                        break;
                    }
                    if stdin_handle.flush().await.is_err() {
                        break;
                    }
                }
            });
        }

        GsdProcess {
            child: Some(child),
            stdin_tx: Some(stdin_tx),
            shutdown_tx: Some(shutdown_tx),
            #[cfg(windows)]
            _job: None, // test helper — no job object needed
        }
    }

    /// Send an RPC command to the child's stdin as JSONL.
    pub async fn send_command(&self, cmd: &RpcCommand) -> Result<(), String> {
        let tx = self
            .stdin_tx
            .as_ref()
            .ok_or_else(|| "Process stdin is not available (process stopped or not started)".to_string())?;

        let line = serialize_command(cmd).map_err(|e| format!("Failed to serialize command: {}", e))?;

        tx.send(line)
            .await
            .map_err(|_| "Failed to write to process stdin (process may have exited)".to_string())
    }

    /// Stop the child process.
    ///
    /// On Windows: sends kill signal directly (no SIGTERM).
    /// On Unix: sends SIGTERM, waits up to 5s, then SIGKILL.
    pub async fn stop(&mut self) -> Result<(), String> {
        // Drop stdin channel to close the pipe
        self.stdin_tx.take();
        self.shutdown_tx.take();

        if let Some(mut child) = self.child.take() {
            #[cfg(unix)]
            {
                // Try SIGTERM first
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                if let Some(pid) = child.id() {
                    let _ = kill(Pid::from_raw(pid as i32), Signal::SIGTERM);
                    // Wait up to 5 seconds for graceful exit
                    match tokio::time::timeout(
                        std::time::Duration::from_secs(5),
                        child.wait(),
                    )
                    .await
                    {
                        Ok(_) => return Ok(()),
                        Err(_) => {
                            // Timeout — force kill
                            let _ = child.kill().await;
                        }
                    }
                } else {
                    let _ = child.kill().await;
                }
            }

            #[cfg(not(unix))]
            {
                // Windows: no SIGTERM, use kill() directly
                let _ = child.kill().await;
            }

            // Wait for process to fully exit (with timeout)
            let _ = tokio::time::timeout(
                std::time::Duration::from_secs(3),
                child.wait(),
            )
            .await;

            Ok(())
        } else {
            Ok(()) // Already stopped
        }
    }

    /// Check if the child process is still running.
    pub fn is_running(&mut self) -> bool {
        if let Some(child) = self.child.as_mut() {
            // try_wait returns Ok(Some(status)) if exited, Ok(None) if still running
            match child.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited — clean up
                    self.child.take();
                    false
                }
                Ok(None) => true,
                Err(_) => false,
            }
        } else {
            false
        }
    }

    /// Wait for the child process to exit and emit the exit event.
    /// Called internally; exposed for testing.
    pub async fn wait_for_exit(&mut self, app_handle: Option<&tauri::AppHandle>) -> Option<i32> {
        if let Some(child) = self.child.as_mut() {
            match child.wait().await {
                Ok(status) => {
                    let code = status.code();
                    if let Some(handle) = app_handle {
                        let _ = handle.emit(
                            "gsd-process-exit",
                            GsdExitPayload {
                                code,
                                timestamp: unix_timestamp_ms(),
                            },
                        );
                    }
                    code
                }
                Err(e) => {
                    if let Some(handle) = app_handle {
                        let _ = handle.emit(
                            "gsd-process-error",
                            GsdErrorPayload {
                                message: format!("Error waiting for process exit: {}", e),
                                timestamp: unix_timestamp_ms(),
                            },
                        );
                    }
                    None
                }
            }
        } else {
            None
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::process::Command;

    /// Helper: spawn a long-running cross-platform child process with piped stdin/stdout.
    /// On Windows we use `cmd /c "findstr ."` which echoes stdin lines.
    /// On Unix we use `cat`.
    async fn spawn_echo_child() -> Child {
        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(["/C", "findstr", "."])
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .expect("failed to spawn findstr")
        }
        #[cfg(not(target_os = "windows"))]
        {
            Command::new("cat")
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .expect("failed to spawn cat")
        }
    }

    /// Helper: spawn a process that exits immediately.
    async fn spawn_short_child() -> Child {
        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(["/C", "echo done"])
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .expect("failed to spawn cmd")
        }
        #[cfg(not(target_os = "windows"))]
        {
            Command::new("echo")
                .arg("done")
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .kill_on_drop(true)
                .spawn()
                .expect("failed to spawn echo")
        }
    }

    #[tokio::test]
    async fn test_spawn_and_is_running() {
        let child = spawn_echo_child().await;
        let mut proc = GsdProcess::from_child(child);
        assert!(proc.is_running(), "Process should be running after spawn");
    }

    #[tokio::test]
    async fn test_send_command_writes_to_stdin() {
        let child = spawn_echo_child().await;
        let proc = GsdProcess::from_child(child);

        let cmd = crate::gsd_rpc::RpcCommand::GetState;
        let result = proc.send_command(&cmd).await;
        assert!(result.is_ok(), "send_command should succeed: {:?}", result);
    }

    #[tokio::test]
    async fn test_stop_kills_process() {
        let child = spawn_echo_child().await;
        let mut proc = GsdProcess::from_child(child);
        assert!(proc.is_running());

        let result = proc.stop().await;
        assert!(result.is_ok(), "stop should succeed: {:?}", result);

        // Give OS a moment to reap
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        assert!(!proc.is_running(), "Process should not be running after stop");
    }

    #[tokio::test]
    async fn test_send_to_stopped_process_errors() {
        let child = spawn_echo_child().await;
        let mut proc = GsdProcess::from_child(child);
        proc.stop().await.unwrap();

        let cmd = crate::gsd_rpc::RpcCommand::Abort;
        let result = proc.send_command(&cmd).await;
        assert!(result.is_err(), "send_command to stopped process should error");
    }

    #[tokio::test]
    async fn test_is_running_false_after_process_exits() {
        let child = spawn_short_child().await;
        let mut proc = GsdProcess::from_child(child);

        // Wait for the short-lived process to exit
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        assert!(
            !proc.is_running(),
            "Process should not be running after it exits naturally"
        );
    }

    #[tokio::test]
    async fn test_stop_already_stopped_is_ok() {
        let child = spawn_echo_child().await;
        let mut proc = GsdProcess::from_child(child);
        proc.stop().await.unwrap();
        // Second stop should not error
        let result = proc.stop().await;
        assert!(result.is_ok(), "Stopping an already-stopped process should be Ok");
    }
}
