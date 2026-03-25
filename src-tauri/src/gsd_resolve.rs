use std::path::PathBuf;

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
}
