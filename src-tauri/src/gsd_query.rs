use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Stdio;

use crate::gsd_resolve::resolve_gsd_binary;

// ---------------------------------------------------------------------------
// Structs — field names match frontend GsdState / ProjectInfo via camelCase
// ---------------------------------------------------------------------------

/// Snapshot of GSD project state, returned by `gsd headless query`.
/// Matches the frontend `GsdState` interface in `gsd-client.ts`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuerySnapshot {
    pub current_milestone: Option<String>,
    pub active_tasks: u32,
    pub total_cost: f64,
}

/// A discovered GSD project directory.
/// Matches the frontend `ProjectInfo` interface in `gsd-client.ts`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    pub path: String,
}

// ---------------------------------------------------------------------------
// Headless query execution
// ---------------------------------------------------------------------------

/// Run `gsd headless query --project <path> --format json` and parse output
/// into a `QuerySnapshot`. Returns a descriptive error on any failure.
pub async fn run_headless_query(project_path: &str) -> Result<QuerySnapshot, String> {
    let binary = resolve_gsd_binary()?;

    let mut cmd = tokio::process::Command::new(&binary);
    cmd.args(["headless", "query", "--project", project_path, "--format", "json"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // On Windows, prevent a console window from flashing
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| format!("Failed to spawn gsd binary at '{}': {}", binary.display(), e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let code = output.status.code().map_or("unknown".to_string(), |c| c.to_string());
        return Err(format!(
            "gsd headless query exited with code {}: {}",
            code,
            stderr.trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str::<QuerySnapshot>(stdout.trim()).map_err(|e| {
        format!(
            "Failed to parse gsd headless query JSON output: {}. Raw output: '{}'",
            e,
            stdout.chars().take(200).collect::<String>()
        )
    })
}

/// Parse raw JSON string into a `QuerySnapshot`. Exposed for unit testing.
pub fn parse_query_json(json: &str) -> Result<QuerySnapshot, String> {
    serde_json::from_str::<QuerySnapshot>(json.trim()).map_err(|e| {
        format!(
            "Failed to parse gsd headless query JSON output: {}. Raw output: '{}'",
            e,
            json.chars().take(200).collect::<String>()
        )
    })
}

// ---------------------------------------------------------------------------
// Project directory scanning
// ---------------------------------------------------------------------------

/// Scan `scan_path` for subdirectories that contain a `.gsd/` child directory.
/// Returns a `ProjectInfo` for each match.
pub fn list_projects_in_dir(scan_path: &str) -> Result<Vec<ProjectInfo>, String> {
    let dir = Path::new(scan_path);
    if !dir.is_dir() {
        return Err(format!("Scan path is not a directory: {}", scan_path));
    }

    let entries = std::fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory '{}': {}", scan_path, e))?;

    let mut projects = Vec::new();

    for entry in entries {
        let entry = entry
            .map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() && path.join(".gsd").is_dir() {
            let dir_name = entry
                .file_name()
                .to_string_lossy()
                .to_string();
            let abs_path = std::fs::canonicalize(&path)
                .unwrap_or_else(|_| path.clone())
                .to_string_lossy()
                .to_string();

            projects.push(ProjectInfo {
                id: dir_name.clone(),
                name: dir_name,
                path: abs_path,
            });
        }
    }

    Ok(projects)
}

// ---------------------------------------------------------------------------
// Tests (written first per TDD / R008)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    // -- QuerySnapshot parsing tests --

    #[test]
    fn test_parse_valid_json() {
        let json = r#"{"currentMilestone":"M001","activeTasks":3,"totalCost":1.25}"#;
        let snapshot = parse_query_json(json).unwrap();
        assert_eq!(
            snapshot,
            QuerySnapshot {
                current_milestone: Some("M001".to_string()),
                active_tasks: 3,
                total_cost: 1.25,
            }
        );
    }

    #[test]
    fn test_parse_valid_json_null_milestone() {
        let json = r#"{"currentMilestone":null,"activeTasks":0,"totalCost":0.0}"#;
        let snapshot = parse_query_json(json).unwrap();
        assert_eq!(snapshot.current_milestone, None);
        assert_eq!(snapshot.active_tasks, 0);
        assert_eq!(snapshot.total_cost, 0.0);
    }

    #[test]
    fn test_handle_invalid_json() {
        let result = parse_query_json("not json at all");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("Failed to parse"),
            "Error should describe parse failure: {}",
            err
        );
        assert!(
            err.contains("not json at all"),
            "Error should include raw output snippet: {}",
            err
        );
    }

    #[test]
    fn test_handle_empty_json() {
        let result = parse_query_json("");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("Failed to parse"),
            "Error should describe parse failure: {}",
            err
        );
    }

    #[test]
    fn test_handle_partial_json() {
        let result = parse_query_json(r#"{"currentMilestone":"M001"}"#);
        assert!(result.is_err(), "Missing required fields should fail");
    }

    // -- Serialization round-trip test (camelCase) --

    #[test]
    fn test_query_snapshot_serializes_camel_case() {
        let snapshot = QuerySnapshot {
            current_milestone: Some("M002".to_string()),
            active_tasks: 5,
            total_cost: 2.50,
        };
        let json = serde_json::to_string(&snapshot).unwrap();
        assert!(json.contains("currentMilestone"), "Should use camelCase: {}", json);
        assert!(json.contains("activeTasks"), "Should use camelCase: {}", json);
        assert!(json.contains("totalCost"), "Should use camelCase: {}", json);
        // Should NOT contain snake_case
        assert!(!json.contains("current_milestone"), "Should not use snake_case: {}", json);
    }

    #[test]
    fn test_project_info_serializes_camel_case() {
        let info = ProjectInfo {
            id: "proj1".to_string(),
            name: "Project 1".to_string(),
            path: "/tmp/proj1".to_string(),
        };
        let json = serde_json::to_string(&info).unwrap();
        // All fields are single-word, so just verify it round-trips
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["id"], "proj1");
        assert_eq!(parsed["name"], "Project 1");
        assert_eq!(parsed["path"], "/tmp/proj1");
    }

    // -- list_projects_in_dir tests --

    #[test]
    fn test_list_projects_finds_gsd_dirs() {
        let tmp = std::env::temp_dir().join("gsd_query_test_list");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        // Create two dirs: one with .gsd/, one without
        let proj_a = tmp.join("project-a");
        fs::create_dir_all(proj_a.join(".gsd")).unwrap();

        let proj_b = tmp.join("project-b");
        fs::create_dir_all(&proj_b).unwrap(); // no .gsd/

        let proj_c = tmp.join("project-c");
        fs::create_dir_all(proj_c.join(".gsd")).unwrap();

        let result = list_projects_in_dir(tmp.to_str().unwrap()).unwrap();

        // Should find exactly 2 projects
        assert_eq!(result.len(), 2, "Expected 2 projects, got: {:?}", result);

        let names: Vec<&str> = result.iter().map(|p| p.name.as_str()).collect();
        assert!(names.contains(&"project-a"), "Should find project-a: {:?}", names);
        assert!(names.contains(&"project-c"), "Should find project-c: {:?}", names);
        assert!(!names.contains(&"project-b"), "Should not find project-b: {:?}", names);

        // Clean up
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_list_projects_empty_dir() {
        let tmp = std::env::temp_dir().join("gsd_query_test_empty");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let result = list_projects_in_dir(tmp.to_str().unwrap()).unwrap();
        assert!(result.is_empty(), "Empty dir should return empty vec");

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_list_projects_invalid_path() {
        let result = list_projects_in_dir("/nonexistent/path/xyz");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("not a directory"),
            "Error should mention invalid path: {}",
            err
        );
    }
}
