// ---------------------------------------------------------------------------
// activity_parser.rs — Parse .gsd/activity/*.jsonl files into ActivityEntry structs
//
// Scans the activity directory for JSONL files, parses the filename pattern
// to extract action, milestone, slice, and task IDs, reads the first line
// for a timestamp, and counts total lines as message_count.
//
// Filename pattern: <seq>-<action>-<milestone>[-<slice>[-<task>]].jsonl
//   e.g. 001-plan-slice-M001-S01.jsonl
//        003-execute-task-M007-S02-T01.jsonl
//        002-complete-milestone-M001.jsonl
// ---------------------------------------------------------------------------

use regex::Regex;
use serde::Serialize;
use std::path::Path;

// ---------------------------------------------------------------------------
// Types — camelCase JSON via serde for frontend consumption
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    pub id: String,
    pub action: String,
    pub milestone_id: String,
    pub slice_id: Option<String>,
    pub task_id: Option<String>,
    pub timestamp: String,
    pub message_count: u32,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// List activity entries from `<project_path>/.gsd/activity/*.jsonl`.
///
/// Each JSONL file is parsed for:
/// - Filename → action, milestone_id, slice_id, task_id
/// - First line → timestamp (from JSON `"timestamp"` field)
/// - Line count → message_count
///
/// Returns entries sorted by sequence number (from filename prefix).
/// Returns an empty Vec if the activity directory doesn't exist.
/// Skips files that don't match the expected naming pattern.
pub fn list_activity_entries(project_path: &str) -> Result<Vec<ActivityEntry>, String> {
    let activity_dir = Path::new(project_path).join(".gsd").join("activity");

    if !activity_dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries: Vec<(u32, ActivityEntry)> = Vec::new();

    let dir_entries = std::fs::read_dir(&activity_dir)
        .map_err(|e| format!("Failed to read {}: {}", activity_dir.display(), e))?;

    for dir_entry in dir_entries.flatten() {
        let path = dir_entry.path();

        // Only process .jsonl files
        let extension = path.extension().and_then(|e| e.to_str());
        if extension != Some("jsonl") {
            continue;
        }

        let file_stem = match path.file_stem().and_then(|s| s.to_str()) {
            Some(s) => s.to_string(),
            None => continue,
        };

        // Parse filename
        let parsed = match parse_activity_filename(&file_stem) {
            Some(p) => p,
            None => continue, // Skip files that don't match the pattern
        };

        // Read the file for timestamp and line count
        let (timestamp, message_count) = read_activity_file(&path);

        entries.push((
            parsed.sequence,
            ActivityEntry {
                id: file_stem,
                action: parsed.action,
                milestone_id: parsed.milestone_id,
                slice_id: parsed.slice_id,
                task_id: parsed.task_id,
                timestamp,
                message_count,
            },
        ));
    }

    // Sort by sequence number
    entries.sort_by_key(|(seq, _)| *seq);

    Ok(entries.into_iter().map(|(_, entry)| entry).collect())
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Parsed components from an activity filename.
struct ParsedFilename {
    sequence: u32,
    action: String,
    milestone_id: String,
    slice_id: Option<String>,
    task_id: Option<String>,
}

/// Parse an activity filename stem into its components.
///
/// Expected patterns:
///   `001-plan-slice-M001-S01`
///   `003-execute-task-M007-S02-T01`
///   `002-complete-milestone-M001`
///
/// The action is everything between the sequence number and the milestone ID.
fn parse_activity_filename(stem: &str) -> Option<ParsedFilename> {
    // Pattern: <digits>-<action-words>-<M###>[-<S##>[-<T##>]]
    let re = Regex::new(
        r"^(\d+)-(.+?)-(M\d+)(?:-(S\d+))?(?:-(T\d+))?$"
    ).unwrap();

    let caps = re.captures(stem)?;

    let sequence: u32 = caps[1].parse().ok()?;
    let action = caps[2].to_string();
    let milestone_id = caps[3].to_string();
    let slice_id = caps.get(4).map(|m| m.as_str().to_string());
    let task_id = caps.get(5).map(|m| m.as_str().to_string());

    Some(ParsedFilename {
        sequence,
        action,
        milestone_id,
        slice_id,
        task_id,
    })
}

/// Read an activity JSONL file to extract the timestamp from the first line
/// and count total lines.
///
/// The timestamp is extracted from the first line's JSON `"timestamp"` field.
/// If the file is empty or the first line has no timestamp, returns an empty
/// string. Line count excludes empty trailing lines.
fn read_activity_file(path: &Path) -> (String, u32) {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return (String::new(), 0),
    };

    let mut lines = content.lines();
    let first_line = lines.next().unwrap_or("");
    let timestamp = extract_timestamp(first_line);

    // Count non-empty lines
    let message_count = content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .count() as u32;

    (timestamp, message_count)
}

/// Extract the "timestamp" field from a JSONL line.
///
/// Parses the line as JSON and extracts the "timestamp" string field.
/// Returns empty string if parsing fails or field is missing.
fn extract_timestamp(line: &str) -> String {
    if line.trim().is_empty() {
        return String::new();
    }

    match serde_json::from_str::<serde_json::Value>(line) {
        Ok(val) => val
            .get("timestamp")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string(),
        Err(_) => String::new(),
    }
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    struct TestProject {
        dir: tempfile::TempDir,
    }

    impl TestProject {
        fn new() -> Self {
            let dir = tempfile::TempDir::new().unwrap();
            fs::create_dir_all(dir.path().join(".gsd").join("activity")).unwrap();
            Self { dir }
        }

        fn root(&self) -> String {
            self.dir.path().to_string_lossy().to_string()
        }

        fn write_activity(&self, filename: &str, content: &str) {
            let path = self.dir.path().join(".gsd").join("activity").join(filename);
            fs::write(path, content).unwrap();
        }
    }

    // -----------------------------------------------------------------------
    // parse_activity_filename
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_filename_milestone_only() {
        let parsed = parse_activity_filename("002-complete-milestone-M001").unwrap();
        assert_eq!(parsed.sequence, 2);
        assert_eq!(parsed.action, "complete-milestone");
        assert_eq!(parsed.milestone_id, "M001");
        assert_eq!(parsed.slice_id, None);
        assert_eq!(parsed.task_id, None);
    }

    #[test]
    fn test_parse_filename_with_slice() {
        let parsed = parse_activity_filename("001-plan-slice-M001-S01").unwrap();
        assert_eq!(parsed.sequence, 1);
        assert_eq!(parsed.action, "plan-slice");
        assert_eq!(parsed.milestone_id, "M001");
        assert_eq!(parsed.slice_id, Some("S01".to_string()));
        assert_eq!(parsed.task_id, None);
    }

    #[test]
    fn test_parse_filename_with_task() {
        let parsed = parse_activity_filename("003-execute-task-M007-S02-T01").unwrap();
        assert_eq!(parsed.sequence, 3);
        assert_eq!(parsed.action, "execute-task");
        assert_eq!(parsed.milestone_id, "M007");
        assert_eq!(parsed.slice_id, Some("S02".to_string()));
        assert_eq!(parsed.task_id, Some("T01".to_string()));
    }

    #[test]
    fn test_parse_filename_high_sequence() {
        let parsed = parse_activity_filename("099-plan-milestone-M099").unwrap();
        assert_eq!(parsed.sequence, 99);
        assert_eq!(parsed.action, "plan-milestone");
        assert_eq!(parsed.milestone_id, "M099");
    }

    #[test]
    fn test_parse_filename_invalid() {
        assert!(parse_activity_filename("not-a-valid-name").is_none());
        assert!(parse_activity_filename("").is_none());
        assert!(parse_activity_filename("abc-plan-M001").is_none()); // no numeric seq
    }

    // -----------------------------------------------------------------------
    // extract_timestamp
    // -----------------------------------------------------------------------

    #[test]
    fn test_extract_timestamp_valid() {
        let line = r#"{"type":"message","timestamp":"2026-03-26T19:58:45.252Z","data":"hello"}"#;
        assert_eq!(extract_timestamp(line), "2026-03-26T19:58:45.252Z");
    }

    #[test]
    fn test_extract_timestamp_no_field() {
        let line = r#"{"type":"message","data":"hello"}"#;
        assert_eq!(extract_timestamp(line), "");
    }

    #[test]
    fn test_extract_timestamp_empty_line() {
        assert_eq!(extract_timestamp(""), "");
    }

    #[test]
    fn test_extract_timestamp_invalid_json() {
        assert_eq!(extract_timestamp("not json"), "");
    }

    // -----------------------------------------------------------------------
    // list_activity_entries
    // -----------------------------------------------------------------------

    #[test]
    fn test_list_activity_no_directory() {
        let dir = tempfile::TempDir::new().unwrap();
        let entries =
            list_activity_entries(&dir.path().to_string_lossy()).unwrap();
        assert!(entries.is_empty());
    }

    #[test]
    fn test_list_activity_empty_directory() {
        let proj = TestProject::new();
        let entries = list_activity_entries(&proj.root()).unwrap();
        assert!(entries.is_empty());
    }

    #[test]
    fn test_list_activity_single_file() {
        let proj = TestProject::new();
        proj.write_activity(
            "001-plan-slice-M001-S01.jsonl",
            &format!(
                "{}\n{}\n{}\n",
                r#"{"type":"start","timestamp":"2026-03-26T10:00:00.000Z"}"#,
                r#"{"type":"message","timestamp":"2026-03-26T10:01:00.000Z"}"#,
                r#"{"type":"end","timestamp":"2026-03-26T10:02:00.000Z"}"#,
            ),
        );

        let entries = list_activity_entries(&proj.root()).unwrap();
        assert_eq!(entries.len(), 1);

        let e = &entries[0];
        assert_eq!(e.id, "001-plan-slice-M001-S01");
        assert_eq!(e.action, "plan-slice");
        assert_eq!(e.milestone_id, "M001");
        assert_eq!(e.slice_id, Some("S01".to_string()));
        assert_eq!(e.task_id, None);
        assert_eq!(e.timestamp, "2026-03-26T10:00:00.000Z");
        assert_eq!(e.message_count, 3);
    }

    #[test]
    fn test_list_activity_sorted_by_sequence() {
        let proj = TestProject::new();

        // Write out of order
        proj.write_activity(
            "003-execute-task-M001-S01-T01.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T12:00:00.000Z"}"#,
        );
        proj.write_activity(
            "001-plan-slice-M001-S01.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T10:00:00.000Z"}"#,
        );
        proj.write_activity(
            "002-complete-milestone-M001.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T11:00:00.000Z"}"#,
        );

        let entries = list_activity_entries(&proj.root()).unwrap();
        assert_eq!(entries.len(), 3);
        assert_eq!(entries[0].id, "001-plan-slice-M001-S01");
        assert_eq!(entries[1].id, "002-complete-milestone-M001");
        assert_eq!(entries[2].id, "003-execute-task-M001-S01-T01");
    }

    #[test]
    fn test_list_activity_skips_non_jsonl() {
        let proj = TestProject::new();
        proj.write_activity(
            "001-plan-slice-M001-S01.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T10:00:00.000Z"}"#,
        );
        // Write a non-JSONL file
        let path = proj.dir.path().join(".gsd").join("activity").join("readme.txt");
        fs::write(path, "Not a JSONL file").unwrap();

        let entries = list_activity_entries(&proj.root()).unwrap();
        assert_eq!(entries.len(), 1);
    }

    #[test]
    fn test_list_activity_skips_bad_filenames() {
        let proj = TestProject::new();
        proj.write_activity(
            "001-plan-slice-M001-S01.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T10:00:00.000Z"}"#,
        );
        proj.write_activity(
            "bad-filename.jsonl",
            r#"{"type":"start","timestamp":"2026-03-26T10:00:00.000Z"}"#,
        );

        let entries = list_activity_entries(&proj.root()).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].action, "plan-slice");
    }

    #[test]
    fn test_list_activity_empty_file() {
        let proj = TestProject::new();
        proj.write_activity("001-plan-slice-M001-S01.jsonl", "");

        let entries = list_activity_entries(&proj.root()).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].timestamp, "");
        assert_eq!(entries[0].message_count, 0);
    }

    // -----------------------------------------------------------------------
    // Serialization tests — verify camelCase JSON output
    // -----------------------------------------------------------------------

    #[test]
    fn test_activity_entry_camel_case() {
        let entry = ActivityEntry {
            id: "001-plan-slice-M001-S01".into(),
            action: "plan-slice".into(),
            milestone_id: "M001".into(),
            slice_id: Some("S01".into()),
            task_id: None,
            timestamp: "2026-03-26T10:00:00.000Z".into(),
            message_count: 42,
        };

        let json: serde_json::Value = serde_json::to_value(&entry).unwrap();
        // Verify camelCase serialization
        assert!(json.get("milestoneId").is_some());
        assert!(json.get("sliceId").is_some());
        assert!(json.get("taskId").is_some());
        assert!(json.get("messageCount").is_some());
        // Verify field values
        assert_eq!(json["milestoneId"], "M001");
        assert_eq!(json["sliceId"], "S01");
        assert!(json["taskId"].is_null());
        assert_eq!(json["messageCount"], 42);
    }

    #[test]
    fn test_activity_entry_with_task() {
        let entry = ActivityEntry {
            id: "003-execute-task-M007-S02-T01".into(),
            action: "execute-task".into(),
            milestone_id: "M007".into(),
            slice_id: Some("S02".into()),
            task_id: Some("T01".into()),
            timestamp: "2026-03-26T12:00:00.000Z".into(),
            message_count: 100,
        };

        let json: serde_json::Value = serde_json::to_value(&entry).unwrap();
        assert_eq!(json["taskId"], "T01");
        assert_eq!(json["action"], "execute-task");
    }
}
