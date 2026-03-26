use std::path::{Path, PathBuf};
use tokio::process::Command;

/// Resolve the `gsd` binary through a 3-tier resolution chain:
///
/// 1. `GSD_BIN_PATH` env var — if set and the file exists, use it.
/// 2. `which` crate — finds `gsd` on the system PATH.
/// 3. Common npm global install locations (platform-specific).
///
/// Returns the resolved path or a descriptive error listing what was checked.
pub fn resolve_gsd_binary() -> Result<PathBuf, String> {
    // Tier 1: explicit env var
    if let Ok(env_path) = std::env::var("GSD_BIN_PATH") {
        let p = PathBuf::from(&env_path);
        if p.exists() {
            return Ok(p);
        }
        // env var set but file missing — fall through, don't fail immediately
    }

    // Tier 2: which
    if let Ok(p) = which::which("gsd") {
        return Ok(p);
    }

    // Tier 3: common npm global paths
    let candidates = npm_global_candidates();
    for candidate in &candidates {
        if candidate.exists() {
            return Ok(candidate.clone());
        }
    }

    // Nothing found — build a helpful error
    let mut msg = String::from("Could not find the `gsd` binary. Checked:\n");
    msg.push_str("  1. GSD_BIN_PATH env var");
    if let Ok(v) = std::env::var("GSD_BIN_PATH") {
        msg.push_str(&format!(" (set to '{}', file not found)", v));
    } else {
        msg.push_str(" (not set)");
    }
    msg.push('\n');
    msg.push_str("  2. System PATH via `which`\n");
    msg.push_str("  3. Common npm global paths:\n");
    for c in &candidates {
        msg.push_str(&format!("     - {}\n", c.display()));
    }
    msg.push_str("\nInstall gsd globally (`npm i -g gsd-pi`) or set GSD_BIN_PATH.");
    Err(msg)
}

/// Build a `tokio::process::Command` that correctly spawns `gsd --mode rpc`.
///
/// On Windows, `resolve_gsd_binary()` often returns a `.js` file (the npm
/// package entry point) or a `.cmd` wrapper — neither is directly executable
/// via `Command::new()`. This function detects the extension and spawns via
/// `node <file>` or `cmd /c <file>` as appropriate.
///
/// On non-Windows / native binaries, it uses the resolved path directly.
pub fn build_gsd_command(binary_path: &Path, project_path: &str) -> Command {
    let ext = binary_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let mut cmd = if ext == "js" || ext == "mjs" {
        // Spawn via node directly — works cross-platform and avoids
        // cmd.exe process-tree issues on Windows
        let mut c = Command::new("node");
        c.arg(binary_path);
        c
    } else if ext == "cmd" || ext == "bat" {
        // Windows batch wrapper
        let mut c = Command::new("cmd.exe");
        c.args(["/c", binary_path.to_str().unwrap_or_default()]);
        c
    } else {
        // Native binary or Unix shell script — use directly
        Command::new(binary_path)
    };

    cmd.args(["--mode", "rpc", "--project", project_path]);
    cmd
}

/// Platform-specific common npm global install locations.
fn npm_global_candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            paths.push(PathBuf::from(appdata).join("npm").join("gsd.cmd"));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        paths.push(PathBuf::from("/usr/local/bin/gsd"));
        if let Ok(home) = std::env::var("HOME") {
            paths.push(PathBuf::from(home).join(".npm-global").join("bin").join("gsd"));
        }
    }

    paths
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_resolve_from_env_var() {
        // Create a temp file to act as the "gsd" binary
        let dir = std::env::temp_dir().join("gsd_resolve_test");
        std::fs::create_dir_all(&dir).unwrap();
        let bin = dir.join("gsd_fake_bin");
        let mut f = std::fs::File::create(&bin).unwrap();
        f.write_all(b"fake").unwrap();

        // Set env var and resolve
        std::env::set_var("GSD_BIN_PATH", bin.to_str().unwrap());
        let result = resolve_gsd_binary();
        // Clean up env
        std::env::remove_var("GSD_BIN_PATH");

        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        assert_eq!(result.unwrap(), bin);

        // Clean up
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_resolve_env_var_missing_file() {
        // Point env var to a nonexistent path — should fall through
        std::env::set_var("GSD_BIN_PATH", "/nonexistent/gsd_binary_xyz");
        let result = resolve_gsd_binary();
        std::env::remove_var("GSD_BIN_PATH");

        // It will either find gsd on PATH/npm or return an error — both are valid.
        // The key assertion: it did NOT return Ok with the nonexistent path.
        if let Ok(p) = &result {
            assert_ne!(
                p,
                &PathBuf::from("/nonexistent/gsd_binary_xyz"),
                "Should not return a nonexistent path"
            );
        }
    }

    #[test]
    fn test_resolve_returns_error_when_not_found() {
        // Remove env var, override PATH so `which` won't find anything,
        // and override APPDATA so npm global path doesn't resolve either.
        let orig_path = std::env::var("PATH").unwrap_or_default();
        let orig_appdata = std::env::var("APPDATA").unwrap_or_default();
        std::env::remove_var("GSD_BIN_PATH");
        std::env::set_var("PATH", "");
        std::env::set_var("APPDATA", std::env::temp_dir().join("gsd_resolve_empty"));

        let result = resolve_gsd_binary();

        std::env::set_var("PATH", &orig_path);
        std::env::set_var("APPDATA", &orig_appdata);

        assert!(result.is_err(), "Expected Err, got: {:?}", result);
        let msg = result.unwrap_err();
        assert!(
            msg.contains("Could not find"),
            "Error should be descriptive: {}",
            msg
        );
        assert!(
            msg.contains("GSD_BIN_PATH"),
            "Error should mention GSD_BIN_PATH: {}",
            msg
        );
    }

    // -----------------------------------------------------------------------
    // build_gsd_command tests
    // -----------------------------------------------------------------------

    /// Helper: extract the program and args from a Command using Debug repr.
    /// tokio::process::Command doesn't expose a getter for program/args,
    /// so we inspect the Debug output.
    fn cmd_debug(cmd: &Command) -> String {
        format!("{:?}", cmd)
    }

    #[test]
    fn test_build_gsd_command_js_uses_node() {
        let path = Path::new("/fake/gsd-cli.js");
        let cmd = build_gsd_command(path, "/my/project");
        let dbg = cmd_debug(&cmd);
        assert!(
            dbg.contains("node"),
            "JS file should spawn via node, got: {}",
            dbg
        );
        assert!(
            dbg.contains("gsd-cli.js"),
            "Should pass the .js path as arg, got: {}",
            dbg
        );
        assert!(
            dbg.contains("--mode") && dbg.contains("rpc"),
            "Should include --mode rpc args, got: {}",
            dbg
        );
        assert!(
            dbg.contains("/my/project"),
            "Should include project path, got: {}",
            dbg
        );
    }

    #[test]
    fn test_build_gsd_command_mjs_uses_node() {
        let path = Path::new("/fake/gsd-cli.mjs");
        let cmd = build_gsd_command(path, "/proj");
        let dbg = cmd_debug(&cmd);
        assert!(
            dbg.contains("node"),
            ".mjs file should also spawn via node, got: {}",
            dbg
        );
    }

    #[test]
    fn test_build_gsd_command_cmd_uses_cmd_exe() {
        let path = Path::new("C:\\Users\\me\\AppData\\Roaming\\npm\\gsd.cmd");
        let cmd = build_gsd_command(path, "D:\\project");
        let dbg = cmd_debug(&cmd);
        assert!(
            dbg.contains("cmd.exe") || dbg.contains("cmd"),
            ".cmd file should spawn via cmd.exe, got: {}",
            dbg
        );
        assert!(
            dbg.contains("/c"),
            "Should pass /c flag, got: {}",
            dbg
        );
    }

    #[test]
    fn test_build_gsd_command_exe_direct() {
        let path = Path::new("/usr/local/bin/gsd");
        let cmd = build_gsd_command(path, "/proj");
        let dbg = cmd_debug(&cmd);
        // Should NOT spawn via node or cmd.exe
        assert!(
            !dbg.starts_with("\"node") && !dbg.contains("cmd.exe"),
            "No-extension binary should spawn directly, got: {}",
            dbg
        );
        assert!(
            dbg.contains("gsd"),
            "Should reference the binary path, got: {}",
            dbg
        );
    }

    #[test]
    fn test_build_gsd_command_native_exe() {
        let path = Path::new("C:\\gsd\\gsd.exe");
        let cmd = build_gsd_command(path, "D:\\project");
        let dbg = cmd_debug(&cmd);
        assert!(
            !dbg.contains("node"),
            ".exe file should spawn directly, not via node, got: {}",
            dbg
        );
        assert!(
            !dbg.contains("cmd.exe"),
            ".exe file should spawn directly, not via cmd.exe, got: {}",
            dbg
        );
    }
}
