/// gsd_init — one-shot `gsd init <path>` invocation.
///
/// Resolves the GSD binary via [`gsd_resolve::resolve_gsd_binary`], then
/// spawns `gsd init <path>` as a synchronous child process (not the RPC
/// long-running process). Returns `Ok(())` on exit code 0 or
/// `Err(stderr_output)` on any failure.

use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::gsd_resolve::resolve_gsd_binary;

/// Run `gsd init <path>` as a blocking one-shot child process.
///
/// The binary resolution follows the same 3-tier chain as the RPC session:
/// `GSD_BIN_PATH` env var → `which gsd` → common npm global locations.
pub fn run_gsd_init(path: &str) -> Result<(), String> {
    let binary = resolve_gsd_binary()?;

    let ext = binary
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // Mirror build_gsd_command extension handling but using std::process::Command
    // (synchronous) instead of tokio::process::Command.
    let mut cmd = if ext == "js" || ext == "mjs" {
        let mut c = Command::new("node");
        c.arg(&binary);
        c
    } else if ext == "cmd" || ext == "bat" {
        let mut c = Command::new("cmd.exe");
        c.args(["/c", binary.to_str().unwrap_or_default()]);
        c
    } else {
        Command::new(&binary)
    };

    // Validate the target path exists; gsd init expects a valid directory.
    if !Path::new(path).exists() {
        // Attempt to create it; gsd init may not create the directory itself.
        std::fs::create_dir_all(path)
            .map_err(|e| format!("Cannot create project directory '{}': {}", path, e))?;
    }

    cmd.arg("init").arg(path);

    // On Windows, prevent a console window from flashing up
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to spawn gsd init: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let combined = if stderr.is_empty() { stdout } else { stderr };
        Err(format!(
            "gsd init failed (exit {:?}): {}",
            output.status.code(),
            combined.trim()
        ))
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_gsd_init_invalid_path_does_not_panic() {
        // We can't actually run gsd in CI without the binary, so we verify
        // that missing binary returns an Err, not a panic.
        // If gsd IS available this may succeed or fail depending on the path.
        let result = run_gsd_init("/tmp/gsd_init_test_nonexistent_dir_xyz");
        // Either Ok (gsd found and succeeded) or Err (binary not found or
        // init failed) — either is acceptable; no panics.
        let _ = result;
    }
}
