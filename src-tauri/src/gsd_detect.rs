/// gsd_detect — filesystem metadata detection for project auto-fill.
///
/// Inspects a directory path and returns a [`ProjectMetadata`] struct that
/// the frontend wizard uses to pre-populate fields in the Import dialog.

use serde::Serialize;
use std::path::Path;

/// Metadata detected from a project directory.
///
/// All fields are optional/nullable because detection can fail gracefully
/// (e.g. no package.json, no .git, etc.).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetadata {
    /// Project name extracted from `package.json` `name` field, or `null`.
    pub detected_name: Option<String>,
    /// `true` if a `.git/` directory exists at the project root.
    pub is_git: bool,
    /// Inferred language: `"TypeScript"`, `"JavaScript"`, or `null`.
    ///
    /// Detected by checking whether `typescript` appears in
    /// `devDependencies` or `dependencies` of `package.json`.
    pub language: Option<String>,
    /// `true` if a `.gsd/` directory exists at the project root.
    pub has_gsd: bool,
    /// `true` if a `.planning/` directory exists at the project root.
    pub has_planning: bool,
}

/// Detect project metadata from the filesystem at `path`.
///
/// Never returns an error — missing files or parse failures are treated as
/// absent metadata rather than hard failures, keeping the UX smooth.
pub fn detect_project_metadata(path: &str) -> ProjectMetadata {
    let root = Path::new(path);

    let is_git = root.join(".git").is_dir();
    let has_gsd = root.join(".gsd").is_dir();
    let has_planning = root.join(".planning").is_dir();

    // Attempt to read and parse package.json
    let (detected_name, language) = read_package_json(root);

    ProjectMetadata {
        detected_name,
        is_git,
        language,
        has_gsd,
        has_planning,
    }
}

/// Read `package.json` and extract the `name` field and infer the language.
///
/// Returns `(None, None)` on any error — the caller treats absence gracefully.
fn read_package_json(root: &Path) -> (Option<String>, Option<String>) {
    let pkg_path = root.join("package.json");
    if !pkg_path.is_file() {
        return (None, None);
    }

    let content = match std::fs::read_to_string(&pkg_path) {
        Ok(c) => c,
        Err(_) => return (None, None),
    };

    let parsed: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return (None, None),
    };

    // Extract name
    let detected_name = parsed
        .get("name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // Infer language: check devDependencies and dependencies for "typescript"
    let has_typescript = has_typescript_dep(&parsed);
    let language = if has_typescript {
        Some("TypeScript".to_string())
    } else if detected_name.is_some() {
        // package.json exists → it's at least a JS project
        Some("JavaScript".to_string())
    } else {
        None
    };

    (detected_name, language)
}

/// Check whether `typescript` appears in `devDependencies` or `dependencies`.
fn has_typescript_dep(pkg: &serde_json::Value) -> bool {
    for section in &["devDependencies", "dependencies"] {
        if let Some(deps) = pkg.get(section).and_then(|v| v.as_object()) {
            if deps.contains_key("typescript") {
                return true;
            }
        }
    }
    false
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_detect_empty_directory() {
        let dir = tempdir().unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert!(!meta.is_git);
        assert!(!meta.has_gsd);
        assert!(!meta.has_planning);
        assert!(meta.detected_name.is_none());
        assert!(meta.language.is_none());
    }

    #[test]
    fn test_detect_git_directory() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join(".git")).unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert!(meta.is_git);
    }

    #[test]
    fn test_detect_gsd_and_planning() {
        let dir = tempdir().unwrap();
        fs::create_dir(dir.path().join(".gsd")).unwrap();
        fs::create_dir(dir.path().join(".planning")).unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert!(meta.has_gsd);
        assert!(meta.has_planning);
    }

    #[test]
    fn test_detect_package_json_typescript() {
        let dir = tempdir().unwrap();
        let pkg = serde_json::json!({
            "name": "my-ts-app",
            "devDependencies": {
                "typescript": "^5.0.0",
                "eslint": "^8.0.0"
            }
        });
        fs::write(dir.path().join("package.json"), pkg.to_string()).unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert_eq!(meta.detected_name.as_deref(), Some("my-ts-app"));
        assert_eq!(meta.language.as_deref(), Some("TypeScript"));
    }

    #[test]
    fn test_detect_package_json_javascript() {
        let dir = tempdir().unwrap();
        let pkg = serde_json::json!({
            "name": "my-js-app",
            "dependencies": {
                "express": "^4.18.0"
            }
        });
        fs::write(dir.path().join("package.json"), pkg.to_string()).unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert_eq!(meta.detected_name.as_deref(), Some("my-js-app"));
        assert_eq!(meta.language.as_deref(), Some("JavaScript"));
    }

    #[test]
    fn test_detect_typescript_in_dependencies_not_devdeps() {
        let dir = tempdir().unwrap();
        let pkg = serde_json::json!({
            "name": "ts-in-deps",
            "dependencies": {
                "typescript": "^5.0.0"
            }
        });
        fs::write(dir.path().join("package.json"), pkg.to_string()).unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        assert_eq!(meta.language.as_deref(), Some("TypeScript"));
    }

    #[test]
    fn test_detect_malformed_package_json() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("package.json"), "not valid json {{").unwrap();
        let meta = detect_project_metadata(dir.path().to_str().unwrap());
        // Should not panic; both fields should be None
        assert!(meta.detected_name.is_none());
        assert!(meta.language.is_none());
    }

    #[test]
    fn test_detect_nonexistent_path() {
        // Should not panic on a missing root
        let meta = detect_project_metadata("/nonexistent/path/xyz_gsd_test");
        assert!(!meta.is_git);
        assert!(!meta.has_gsd);
        assert!(!meta.has_planning);
        assert!(meta.detected_name.is_none());
    }
}
