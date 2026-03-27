use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::AppHandle;
use tauri::Emitter;
use tokio::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::gsd_resolve::resolve_gsd_binary;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/// Version info returned by `check_gsd_version`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GsdVersionInfo {
    /// Currently installed version string (e.g. "1.2.3"), or empty on failure.
    pub installed: String,
    /// Latest version on npm registry (e.g. "1.3.0"), or empty on failure.
    pub latest: String,
    /// True when latest > installed (semver comparison).
    pub update_available: bool,
    /// Changelog URL for the latest release.
    pub changelog_url: String,
}

/// Progress event emitted during `upgrade_gsd`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GsdUpgradeProgress {
    pub phase: String, // "running" | "success" | "error"
    pub message: String,
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

/// Parse a semver string "major.minor.patch[-pre]" into a comparable tuple.
/// Returns `(0, 0, 0)` on any parse failure.
pub fn parse_semver(version: &str) -> (u64, u64, u64) {
    // Strip leading 'v' or whitespace, then take only the numeric portion
    let v = version.trim().trim_start_matches('v');
    // Drop any pre-release suffix after '-'
    let core = v.split('-').next().unwrap_or(v);
    let parts: Vec<&str> = core.split('.').collect();
    let major = parts.first().and_then(|s| s.parse().ok()).unwrap_or(0);
    let minor = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
    let patch = parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
    (major, minor, patch)
}

/// Returns true when `latest` is strictly greater than `installed`.
pub fn is_newer(installed: &str, latest: &str) -> bool {
    parse_semver(latest) > parse_semver(installed)
}

// ---------------------------------------------------------------------------
// npm path resolution
// ---------------------------------------------------------------------------

/// Resolve the npm (or npm.cmd on Windows) executable path from the parent
/// directory of the resolved gsd binary.
///
/// Strategy:
/// 1. Walk up from `gsd_binary.parent()` looking for `npm` / `npm.cmd`.
/// 2. Fall back to `which npm` / `which npm.cmd`.
/// 3. Fall back to bare `npm` (rely on PATH at exec time).
pub fn resolve_npm_cmd() -> String {
    // Try to derive npm location from gsd binary location
    if let Ok(gsd_bin) = resolve_gsd_binary() {
        if let Some(bin_dir) = gsd_bin.parent() {
            #[cfg(target_os = "windows")]
            {
                let candidate = bin_dir.join("npm.cmd");
                if candidate.exists() {
                    return candidate.to_string_lossy().into_owned();
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                let candidate = bin_dir.join("npm");
                if candidate.exists() {
                    return candidate.to_string_lossy().into_owned();
                }
            }
        }
    }

    // Fall back to which
    #[cfg(target_os = "windows")]
    {
        if let Ok(p) = which::which("npm.cmd") {
            return p.to_string_lossy().into_owned();
        }
        if let Ok(p) = which::which("npm") {
            return p.to_string_lossy().into_owned();
        }
        "npm.cmd".to_string()
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(p) = which::which("npm") {
            return p.to_string_lossy().into_owned();
        }
        "npm".to_string()
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Check the installed vs. latest gsd-pi version.
///
/// Runs two probes concurrently with a 10-second overall timeout:
/// - `gsd --version` (via resolved binary) → installed version
/// - `npm show gsd-pi version` → latest version on registry
///
/// On any error or timeout, returns `Ok` with `update_available = false`
/// so the caller is never blocked.
#[tauri::command]
pub async fn check_gsd_version() -> Result<GsdVersionInfo, String> {
    let no_update = GsdVersionInfo {
        installed: String::new(),
        latest: String::new(),
        update_available: false,
        changelog_url: "https://www.npmjs.com/package/gsd-pi".to_string(),
    };

    let result = tokio::time::timeout(Duration::from_secs(10), async {
        // --- probe 1: installed version ---
        let installed = get_installed_version().await;

        // --- probe 2: latest version from npm registry ---
        let latest = get_latest_npm_version().await;

        (installed, latest)
    })
    .await;

    match result {
        Err(_elapsed) => {
            // Timed out — non-blocking, return no-update
            Ok(no_update)
        }
        Ok((installed, latest)) => {
            let update_available =
                !installed.is_empty() && !latest.is_empty() && is_newer(&installed, &latest);

            Ok(GsdVersionInfo {
                changelog_url: format!("https://www.npmjs.com/package/gsd-pi/v/{}", latest),
                installed,
                latest,
                update_available,
            })
        }
    }
}

/// Run `gsd --version` and extract the version string.
async fn get_installed_version() -> String {
    let binary = match resolve_gsd_binary() {
        Ok(b) => b,
        Err(_) => return String::new(),
    };

    let ext = binary
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let output = if ext == "js" || ext == "mjs" {
        let mut c = Command::new("node");
        c.arg(&binary).arg("--version");
        #[cfg(windows)] c.creation_flags(0x08000000);
        c.output().await
    } else if ext == "cmd" || ext == "bat" {
        let mut c = Command::new("cmd.exe");
        c.args(["/c", binary.to_str().unwrap_or_default(), "--version"]);
        #[cfg(windows)] c.creation_flags(0x08000000);
        c.output().await
    } else {
        let mut c = Command::new(&binary);
        c.arg("--version");
        #[cfg(windows)] c.creation_flags(0x08000000);
        c.output().await
    };

    match output {
        Ok(out) if out.status.success() => {
            let raw = String::from_utf8_lossy(&out.stdout);
            extract_version_from_output(&raw)
        }
        _ => String::new(),
    }
}

/// Run `npm show gsd-pi version` via spawn_blocking and return the version.
async fn get_latest_npm_version() -> String {
    let npm = resolve_npm_cmd();

    // Use spawn_blocking so we don't hold a Tokio worker thread for the entire
    // network round-trip — npm show is a blocking subprocess.
    let npm_clone = npm.clone();
    let result = tokio::task::spawn_blocking(move || {
        let mut c = std::process::Command::new(&npm_clone);
        c.args(["show", "gsd-pi", "version"]);
        #[cfg(windows)] {
            use std::os::windows::process::CommandExt;
            c.creation_flags(0x08000000);
        }
        c.output()
    })
    .await;

    match result {
        Ok(Ok(out)) if out.status.success() => {
            let raw = String::from_utf8_lossy(&out.stdout);
            raw.trim().to_string()
        }
        _ => String::new(),
    }
}

/// Extract a semver version from raw CLI output.
/// Handles formats like:
///   - "1.2.3"
///   - "gsd-pi/1.2.3 linux-x64 node/v20"
///   - "gsd 1.2.3"
///   - "v1.2.3"
pub fn extract_version_from_output(raw: &str) -> String {
    // Try to find the first token that looks like a semver
    for token in raw.split_whitespace() {
        let t = token.trim_start_matches('v');
        if looks_like_semver(t) {
            return t.to_string();
        }
    }
    // Try slash-separated parts (e.g. "gsd-pi/1.2.3")
    for token in raw.split('/') {
        let t = token.trim().trim_start_matches('v');
        let core = t.split_whitespace().next().unwrap_or(t);
        if looks_like_semver(core) {
            return core.to_string();
        }
    }
    raw.trim().to_string()
}

fn looks_like_semver(s: &str) -> bool {
    let core = s.split('-').next().unwrap_or(s);
    let parts: Vec<&str> = core.split('.').collect();
    parts.len() >= 2 && parts.iter().all(|p| p.chars().all(|c| c.is_ascii_digit()))
}

/// Upgrade gsd-pi to the latest version via npm.
///
/// Emits `gsd-upgrade-progress` events:
///   - `{ phase: "running", message: "Installing gsd-pi@latest…" }`
///   - `{ phase: "success", message: "Upgraded to X.Y.Z" }` on success
///   - `{ phase: "error",   message: "<error detail>" }` on failure
///
/// Returns `Ok(())` on success, `Err(message)` on failure.
#[tauri::command]
pub async fn upgrade_gsd(app: AppHandle) -> Result<(), String> {
    let npm = resolve_npm_cmd();

    let emit_progress = |phase: &str, message: &str| {
        let _ = app.emit(
            "gsd-upgrade-progress",
            GsdUpgradeProgress {
                phase: phase.to_string(),
                message: message.to_string(),
            },
        );
    };

    emit_progress("running", "Installing gsd-pi@latest…");

    // Build the install command
    #[cfg(target_os = "windows")]
    let output = {
        let mut c = Command::new(&npm);
        c.args(["install", "-g", "gsd-pi@latest"]);
        c.creation_flags(0x08000000); // CREATE_NO_WINDOW
        c.output().await
    };

    #[cfg(not(target_os = "windows"))]
    let output = {
        Command::new(&npm)
            .args(["install", "-g", "gsd-pi@latest"])
            .output()
            .await
    };

    match output {
        Ok(out) if out.status.success() => {
            // Try to detect the new version from stdout
            let stdout = String::from_utf8_lossy(&out.stdout);
            let version = extract_version_from_output(&stdout);
            let msg = if version.is_empty() {
                "gsd-pi upgraded successfully.".to_string()
            } else {
                format!("Upgraded to {}", version)
            };
            emit_progress("success", &msg);
            Ok(())
        }
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            let msg = format!(
                "npm install failed (exit {}): {}",
                out.status.code().unwrap_or(-1),
                stderr.trim()
            );
            emit_progress("error", &msg);
            Err(msg)
        }
        Err(e) => {
            let msg = format!("Failed to spawn npm: {}", e);
            emit_progress("error", &msg);
            Err(msg)
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // --- parse_semver ---

    #[test]
    fn test_parse_semver_basic() {
        assert_eq!(parse_semver("1.2.3"), (1, 2, 3));
        assert_eq!(parse_semver("0.10.0"), (0, 10, 0));
        assert_eq!(parse_semver("2.0.0"), (2, 0, 0));
    }

    #[test]
    fn test_parse_semver_with_v_prefix() {
        assert_eq!(parse_semver("v1.2.3"), (1, 2, 3));
        assert_eq!(parse_semver("V2.0.1"), (2, 0, 1));
    }

    #[test]
    fn test_parse_semver_with_prerelease() {
        assert_eq!(parse_semver("1.2.3-alpha"), (1, 2, 3));
        assert_eq!(parse_semver("1.2.3-beta.1"), (1, 2, 3));
    }

    #[test]
    fn test_parse_semver_whitespace() {
        assert_eq!(parse_semver("  1.2.3  "), (1, 2, 3));
    }

    #[test]
    fn test_parse_semver_invalid_returns_zeros() {
        assert_eq!(parse_semver(""), (0, 0, 0));
        assert_eq!(parse_semver("not-a-version"), (0, 0, 0));
    }

    // --- is_newer ---

    #[test]
    fn test_is_newer_patch() {
        assert!(is_newer("1.0.0", "1.0.1"));
        assert!(!is_newer("1.0.1", "1.0.0"));
        assert!(!is_newer("1.0.0", "1.0.0"));
    }

    #[test]
    fn test_is_newer_minor() {
        assert!(is_newer("1.0.0", "1.1.0"));
        assert!(!is_newer("1.1.0", "1.0.9"));
    }

    #[test]
    fn test_is_newer_major() {
        assert!(is_newer("0.9.9", "1.0.0"));
        assert!(!is_newer("2.0.0", "1.9.9"));
    }

    #[test]
    fn test_is_newer_with_v_prefix() {
        assert!(is_newer("v1.0.0", "v1.0.1"));
        assert!(!is_newer("v2.0.0", "v1.9.9"));
    }

    #[test]
    fn test_is_newer_empty_strings() {
        // Empty strings parse to (0,0,0) — equal, so not newer
        assert!(!is_newer("", ""));
        assert!(!is_newer("1.0.0", ""));
        assert!(!is_newer("", "1.0.0"));
    }

    // --- extract_version_from_output ---

    #[test]
    fn test_extract_version_bare() {
        assert_eq!(extract_version_from_output("1.2.3\n"), "1.2.3");
    }

    #[test]
    fn test_extract_version_gsd_prefix() {
        assert_eq!(extract_version_from_output("gsd 1.2.3"), "1.2.3");
    }

    #[test]
    fn test_extract_version_slash_format() {
        assert_eq!(
            extract_version_from_output("gsd-pi/1.2.3 linux-x64 node/v20"),
            "1.2.3"
        );
    }

    #[test]
    fn test_extract_version_v_prefix() {
        assert_eq!(extract_version_from_output("v1.2.3"), "1.2.3");
    }

    #[test]
    fn test_extract_version_whitespace_lines() {
        assert_eq!(extract_version_from_output("  \n  1.5.0  \n"), "1.5.0");
    }

    // --- resolve_npm_cmd ---

    #[test]
    fn test_resolve_npm_cmd_returns_nonempty() {
        let npm = resolve_npm_cmd();
        assert!(
            !npm.is_empty(),
            "resolve_npm_cmd() must return a non-empty string"
        );
    }

    #[test]
    fn test_resolve_npm_cmd_ends_with_npm() {
        let npm = resolve_npm_cmd();
        let lower = npm.to_lowercase();
        assert!(
            lower.contains("npm"),
            "resolve_npm_cmd() should reference npm, got: {}",
            npm
        );
    }
}
