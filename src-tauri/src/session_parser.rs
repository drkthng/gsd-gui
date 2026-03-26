// ---------------------------------------------------------------------------
// session_parser.rs — Parse GSD session JSONL files into SessionInfo structs
//
// Scans the GSD sessions directory for a project, reading JSONL files to
// extract session metadata, message counts, costs, and first-message previews.
//
// Path encoding replicates the JS logic exactly:
//   `--${cwd.replace(/^[\/\\]/, "").replace(/[\/\\:]/g, "-")}--`
// ---------------------------------------------------------------------------

use serde::Serialize;
use std::path::{Path, PathBuf};

// ---------------------------------------------------------------------------
// Types — mirror src/lib/types.ts SessionInfo (camelCase JSON via serde)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub message_count: usize,
    pub cost: f64,
    pub created_at: String,
    pub last_active_at: String,
    pub preview: String,
    pub parent_id: Option<String>,
    pub is_active: bool,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Resolve the GSD home directory.
///
/// Checks `GSD_HOME` env var first, then falls back to `HOME` (Unix)
/// or `USERPROFILE` (Windows) + `/.gsd`.
pub fn gsd_home() -> Result<PathBuf, String> {
    if let Ok(home) = std::env::var("GSD_HOME") {
        return Ok(PathBuf::from(home));
    }

    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| {
            "Cannot determine home directory: HOME and USERPROFILE not set".to_string()
        })?;

    Ok(PathBuf::from(home_dir).join(".gsd"))
}

/// Encode a project path to the GSD sessions directory name.
///
/// Replicates the JS encoding exactly:
///   `--${cwd.replace(/^[\/\\]/, "").replace(/[\/\\:]/g, "-")}--`
///
/// Examples:
/// - `/home/user/project`    → `--home-user-project--`
/// - `D:\AiProjects\gsd-gui` → `--D--AiProjects-gsd-gui--`
pub fn encode_project_path(path: &str) -> String {
    let mut s = path.to_string();

    // Strip leading `/` or `\` (only the first character)
    if s.starts_with('/') || s.starts_with('\\') {
        s = s[1..].to_string();
    }

    // Replace all `/`, `\`, `:` with `-`
    s = s.replace(['/', '\\', ':'], "-");

    format!("--{}--", s)
}

/// List all sessions for a project by scanning its sessions directory.
///
/// Returns an empty Vec if the sessions directory doesn't exist.
/// Skips individual session files that are malformed or unreadable.
pub fn list_sessions(project_path: &str) -> Result<Vec<SessionInfo>, String> {
    let home = gsd_home()?;
    let encoded = encode_project_path(project_path);
    let sessions_dir = home.join("sessions").join(&encoded);

    if !sessions_dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries: Vec<PathBuf> = std::fs::read_dir(&sessions_dir)
        .map_err(|e| format!("Failed to read {}: {}", sessions_dir.display(), e))?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("jsonl"))
        .collect();

    // Sort by filename (which starts with timestamp) for consistent ordering
    entries.sort();

    let mut sessions = Vec::new();
    for path in entries {
        match parse_session_file(&path) {
            Ok(session) => sessions.push(session),
            Err(_) => continue, // Skip malformed session files
        }
    }

    Ok(sessions)
}

// ---------------------------------------------------------------------------
// Internal parsing functions
// ---------------------------------------------------------------------------

/// Parse a single session JSONL file into a SessionInfo.
fn parse_session_file(path: &Path) -> Result<SessionInfo, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;

    let mut lines = content.lines();

    // First line must be the session header
    let first_line_str = lines
        .next()
        .ok_or_else(|| "Empty session file".to_string())?;

    let header: serde_json::Value = serde_json::from_str(first_line_str)
        .map_err(|e| format!("Failed to parse session header: {}", e))?;

    let session_id = header
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let created_at = header
        .get("timestamp")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let name = derive_session_name(path);

    // Process remaining lines for message data
    let mut message_count: usize = 0;
    let mut cost: f64 = 0.0;
    let mut preview = String::new();
    let mut last_active_at = created_at.clone();

    for line_str in lines {
        let line_str = line_str.trim();
        if line_str.is_empty() {
            continue;
        }

        let Ok(line_val) = serde_json::from_str::<serde_json::Value>(line_str) else {
            continue; // Skip malformed lines
        };

        let line_type = line_val
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        if line_type != "message" {
            continue;
        }

        message_count += 1;

        // Update last_active_at from message timestamp if present
        if let Some(ts) = line_val.get("timestamp").and_then(|v| v.as_str()) {
            last_active_at = ts.to_string();
        }

        let message = line_val.get("message");
        let role = message
            .and_then(|m| m.get("role"))
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // Accumulate cost from assistant messages
        if role == "assistant" {
            if let Some(total) = message
                .and_then(|m| m.get("usage"))
                .and_then(|u| u.get("cost"))
                .and_then(|c| c.get("total"))
                .and_then(|t| t.as_f64())
            {
                cost += total;
            }
        }

        // Extract preview from first user message
        if role == "user" && preview.is_empty() {
            preview = extract_user_preview(message);
        }
    }

    Ok(SessionInfo {
        id: session_id,
        name,
        message_count,
        cost,
        created_at,
        last_active_at,
        preview,
        parent_id: None,
        is_active: false,
    })
}

/// Extract preview text from a user message.
///
/// Handles both formats:
/// - `content: "plain text"` (string)
/// - `content: [{ type: "text", text: "..." }]` (array of blocks)
fn extract_user_preview(message: Option<&serde_json::Value>) -> String {
    let content = message.and_then(|m| m.get("content"));

    match content {
        // Array of content blocks — take first text block
        Some(serde_json::Value::Array(arr)) => arr
            .iter()
            .find_map(|item| item.get("text").and_then(|t| t.as_str()))
            .map(|t| t.chars().take(200).collect())
            .unwrap_or_default(),

        // Plain string content
        Some(serde_json::Value::String(s)) => s.chars().take(200).collect(),

        _ => String::new(),
    }
}

/// Derive a human-readable session name from the JSONL filename.
///
/// Filenames look like `2026-03-26T09-30-55-abc123.jsonl`.
/// We extract the datetime portion: `2026-03-26T09-30-55`.
fn derive_session_name(path: &Path) -> String {
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown");

    // Try to extract YYYY-MM-DDTHH-MM-SS (19 chars)
    if stem.len() >= 19 {
        let candidate = &stem[..19];
        if candidate.as_bytes().get(4) == Some(&b'-')
            && candidate.as_bytes().get(7) == Some(&b'-')
            && candidate.as_bytes().get(10) == Some(&b'T')
            && candidate.as_bytes().get(13) == Some(&b'-')
            && candidate.as_bytes().get(16) == Some(&b'-')
        {
            return candidate.to_string();
        }
    }

    stem.to_string()
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    // -----------------------------------------------------------------------
    // encode_project_path
    // -----------------------------------------------------------------------

    #[test]
    fn test_encode_unix_path() {
        assert_eq!(
            encode_project_path("/home/user/project"),
            "--home-user-project--"
        );
    }

    #[test]
    fn test_encode_windows_path() {
        assert_eq!(
            encode_project_path("D:\\AiProjects\\gsd-gui"),
            "--D--AiProjects-gsd-gui--"
        );
    }

    #[test]
    fn test_encode_windows_path_forward_slashes() {
        assert_eq!(
            encode_project_path("C:/Users/test/project"),
            "--C--Users-test-project--"
        );
    }

    #[test]
    fn test_encode_path_leading_backslash() {
        assert_eq!(
            encode_project_path("\\server\\share\\dir"),
            "--server-share-dir--"
        );
    }

    #[test]
    fn test_encode_simple_path() {
        assert_eq!(encode_project_path("/tmp/test"), "--tmp-test--");
    }

    // -----------------------------------------------------------------------
    // derive_session_name
    // -----------------------------------------------------------------------

    #[test]
    fn test_derive_name_from_timestamp_filename() {
        let path = Path::new("/sessions/2026-03-26T09-30-55-abc123.jsonl");
        assert_eq!(derive_session_name(path), "2026-03-26T09-30-55");
    }

    #[test]
    fn test_derive_name_from_short_filename() {
        let path = Path::new("/sessions/short.jsonl");
        assert_eq!(derive_session_name(path), "short");
    }

    #[test]
    fn test_derive_name_exact_19_chars() {
        let path = Path::new("/sessions/2026-03-26T09-30-55.jsonl");
        assert_eq!(derive_session_name(path), "2026-03-26T09-30-55");
    }

    // -----------------------------------------------------------------------
    // extract_user_preview
    // -----------------------------------------------------------------------

    #[test]
    fn test_preview_from_content_array() {
        let msg: serde_json::Value = serde_json::from_str(
            r#"{"role":"user","content":[{"type":"text","text":"Hello, world!"}]}"#,
        )
        .unwrap();
        assert_eq!(extract_user_preview(Some(&msg)), "Hello, world!");
    }

    #[test]
    fn test_preview_from_content_string() {
        let msg: serde_json::Value =
            serde_json::from_str(r#"{"role":"user","content":"Plain text message"}"#).unwrap();
        assert_eq!(extract_user_preview(Some(&msg)), "Plain text message");
    }

    #[test]
    fn test_preview_truncated_at_200() {
        let long_text = "a".repeat(300);
        let json_str = format!(r#"{{"role":"user","content":"{}"}}"#, long_text);
        let msg: serde_json::Value = serde_json::from_str(&json_str).unwrap();
        let preview = extract_user_preview(Some(&msg));
        assert_eq!(preview.len(), 200);
    }

    #[test]
    fn test_preview_missing_content() {
        let msg: serde_json::Value = serde_json::from_str(r#"{"role":"user"}"#).unwrap();
        assert_eq!(extract_user_preview(Some(&msg)), "");
    }

    #[test]
    fn test_preview_none_message() {
        assert_eq!(extract_user_preview(None), "");
    }

    // -----------------------------------------------------------------------
    // parse_session_file — full JSONL parsing
    // -----------------------------------------------------------------------

    /// Helper to create a temp directory with a session JSONL file.
    fn write_session_file(dir: &Path, filename: &str, lines: &[&str]) -> PathBuf {
        let path = dir.join(filename);
        fs::write(&path, lines.join("\n")).unwrap();
        path
    }

    #[test]
    fn test_parse_basic_session() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = write_session_file(
            dir.path(),
            "2026-03-26T09-30-55-abc123.jsonl",
            &[
                r#"{"type":"session","version":3,"id":"sess-001","timestamp":"2026-03-26T09:30:55Z","cwd":"/home/user/proj"}"#,
                r#"{"type":"message","timestamp":"2026-03-26T09:31:00Z","message":{"role":"user","content":[{"type":"text","text":"Fix the login bug"}]}}"#,
                r#"{"type":"message","timestamp":"2026-03-26T09:31:30Z","message":{"role":"assistant","content":[{"type":"text","text":"I'll fix that."}],"usage":{"cost":{"total":0.05}}}}"#,
                r#"{"type":"message","timestamp":"2026-03-26T09:32:00Z","message":{"role":"user","content":[{"type":"text","text":"Thanks"}]}}"#,
                r#"{"type":"message","timestamp":"2026-03-26T09:32:30Z","message":{"role":"assistant","content":[{"type":"text","text":"Done."}],"usage":{"cost":{"total":0.03}}}}"#,
            ],
        );

        let session = parse_session_file(&path).unwrap();

        assert_eq!(session.id, "sess-001");
        assert_eq!(session.name, "2026-03-26T09-30-55");
        assert_eq!(session.message_count, 4);
        assert!((session.cost - 0.08).abs() < 1e-10);
        assert_eq!(session.created_at, "2026-03-26T09:30:55Z");
        assert_eq!(session.last_active_at, "2026-03-26T09:32:30Z");
        assert_eq!(session.preview, "Fix the login bug");
        assert_eq!(session.parent_id, None);
        assert!(!session.is_active);
    }

    #[test]
    fn test_parse_session_no_messages() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = write_session_file(
            dir.path(),
            "2026-01-01T00-00-00.jsonl",
            &[
                r#"{"type":"session","version":3,"id":"empty-sess","timestamp":"2026-01-01T00:00:00Z","cwd":"/tmp"}"#,
            ],
        );

        let session = parse_session_file(&path).unwrap();

        assert_eq!(session.id, "empty-sess");
        assert_eq!(session.message_count, 0);
        assert_eq!(session.cost, 0.0);
        assert_eq!(session.preview, "");
        assert_eq!(session.last_active_at, "2026-01-01T00:00:00Z");
    }

    #[test]
    fn test_parse_session_with_malformed_lines() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = write_session_file(
            dir.path(),
            "2026-02-15T10-00-00.jsonl",
            &[
                r#"{"type":"session","version":3,"id":"malformed-sess","timestamp":"2026-02-15T10:00:00Z","cwd":"/tmp"}"#,
                "this is not valid json",
                r#"{"type":"message","timestamp":"2026-02-15T10:01:00Z","message":{"role":"user","content":"Hello"}}"#,
                "{invalid json too}",
                r#"{"type":"message","timestamp":"2026-02-15T10:02:00Z","message":{"role":"assistant","content":"Hi","usage":{"cost":{"total":0.01}}}}"#,
            ],
        );

        let session = parse_session_file(&path).unwrap();

        // Malformed lines should be skipped, valid ones parsed
        assert_eq!(session.message_count, 2);
        assert!((session.cost - 0.01).abs() < 1e-10);
        assert_eq!(session.preview, "Hello"); // string content format
    }

    #[test]
    fn test_parse_session_empty_file() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("empty.jsonl");
        fs::write(&path, "").unwrap();

        let result = parse_session_file(&path);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_session_cost_only_from_assistant() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = write_session_file(
            dir.path(),
            "2026-03-01T12-00-00.jsonl",
            &[
                r#"{"type":"session","version":3,"id":"cost-test","timestamp":"2026-03-01T12:00:00Z","cwd":"/tmp"}"#,
                // User message with no cost field
                r#"{"type":"message","timestamp":"2026-03-01T12:01:00Z","message":{"role":"user","content":"Test"}}"#,
                // Assistant with cost
                r#"{"type":"message","timestamp":"2026-03-01T12:01:30Z","message":{"role":"assistant","usage":{"cost":{"total":0.10}}}}"#,
                // Another assistant with cost
                r#"{"type":"message","timestamp":"2026-03-01T12:02:00Z","message":{"role":"assistant","usage":{"cost":{"total":0.25}}}}"#,
                // Tool result (not user/assistant) — should count as message but no cost
                r#"{"type":"message","timestamp":"2026-03-01T12:02:30Z","message":{"role":"tool","content":"result"}}"#,
            ],
        );

        let session = parse_session_file(&path).unwrap();

        assert_eq!(session.message_count, 4);
        assert!((session.cost - 0.35).abs() < 1e-10);
    }

    #[test]
    fn test_parse_session_non_message_types_skipped() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = write_session_file(
            dir.path(),
            "2026-04-01T08-00-00.jsonl",
            &[
                r#"{"type":"session","version":3,"id":"skip-test","timestamp":"2026-04-01T08:00:00Z","cwd":"/tmp"}"#,
                r#"{"type":"tool_use","id":"tool-1","name":"bash"}"#,
                r#"{"type":"tool_result","id":"tool-1","output":"ok"}"#,
                r#"{"type":"message","timestamp":"2026-04-01T08:01:00Z","message":{"role":"user","content":"Only message"}}"#,
            ],
        );

        let session = parse_session_file(&path).unwrap();

        assert_eq!(session.message_count, 1);
        assert_eq!(session.preview, "Only message");
    }

    // -----------------------------------------------------------------------
    // list_sessions — integration with temp directories
    // -----------------------------------------------------------------------

    #[test]
    fn test_list_sessions_empty_dir() {
        let dir = tempfile::TempDir::new().unwrap();
        let sessions_dir = dir
            .path()
            .join("sessions")
            .join("--tmp-test--");
        fs::create_dir_all(&sessions_dir).unwrap();

        // Override GSD_HOME to point to our temp dir
        std::env::set_var("GSD_HOME", dir.path());

        let result = list_sessions("/tmp/test").unwrap();
        assert!(result.is_empty());

        std::env::remove_var("GSD_HOME");
    }

    #[test]
    fn test_list_sessions_nonexistent_dir() {
        let dir = tempfile::TempDir::new().unwrap();
        std::env::set_var("GSD_HOME", dir.path());

        let result = list_sessions("/nonexistent/project").unwrap();
        assert!(result.is_empty());

        std::env::remove_var("GSD_HOME");
    }

    #[test]
    fn test_list_sessions_multiple_files() {
        let dir = tempfile::TempDir::new().unwrap();
        let sessions_dir = dir
            .path()
            .join("sessions")
            .join("--home-user-proj--");
        fs::create_dir_all(&sessions_dir).unwrap();

        // Create two session files
        fs::write(
            sessions_dir.join("2026-03-25T08-00-00-aaa.jsonl"),
            r#"{"type":"session","version":3,"id":"sess-a","timestamp":"2026-03-25T08:00:00Z","cwd":"/home/user/proj"}"#,
        )
        .unwrap();
        fs::write(
            sessions_dir.join("2026-03-26T10-00-00-bbb.jsonl"),
            concat!(
                r#"{"type":"session","version":3,"id":"sess-b","timestamp":"2026-03-26T10:00:00Z","cwd":"/home/user/proj"}"#,
                "\n",
                r#"{"type":"message","timestamp":"2026-03-26T10:01:00Z","message":{"role":"user","content":"Hi there"}}"#,
            ),
        )
        .unwrap();

        // Also create a non-jsonl file that should be ignored
        fs::write(sessions_dir.join("notes.txt"), "not a session").unwrap();

        std::env::set_var("GSD_HOME", dir.path());

        let result = list_sessions("/home/user/proj").unwrap();
        assert_eq!(result.len(), 2);

        // Should be sorted by filename (timestamp order)
        assert_eq!(result[0].id, "sess-a");
        assert_eq!(result[1].id, "sess-b");
        assert_eq!(result[1].message_count, 1);
        assert_eq!(result[1].preview, "Hi there");

        std::env::remove_var("GSD_HOME");
    }

    // -----------------------------------------------------------------------
    // Serialization tests — verify JSON output matches TypeScript types
    // -----------------------------------------------------------------------

    #[test]
    fn test_session_info_json_shape() {
        let session = SessionInfo {
            id: "sess-001".into(),
            name: "2026-03-26T09-30-55".into(),
            message_count: 10,
            cost: 1.23,
            created_at: "2026-03-26T09:30:55Z".into(),
            last_active_at: "2026-03-26T10:00:00Z".into(),
            preview: "Hello".into(),
            parent_id: None,
            is_active: false,
        };

        let json: serde_json::Value = serde_json::to_value(&session).unwrap();

        // Verify camelCase field names match TypeScript SessionInfo
        assert_eq!(json["id"], "sess-001");
        assert_eq!(json["name"], "2026-03-26T09-30-55");
        assert_eq!(json["messageCount"], 10);
        assert_eq!(json["cost"], 1.23);
        assert_eq!(json["createdAt"], "2026-03-26T09:30:55Z");
        assert_eq!(json["lastActiveAt"], "2026-03-26T10:00:00Z");
        assert_eq!(json["preview"], "Hello");
        assert!(json["parentId"].is_null());
        assert_eq!(json["isActive"], false);

        // Verify no snake_case fields leaked through
        assert!(json.get("message_count").is_none());
        assert!(json.get("created_at").is_none());
        assert!(json.get("last_active_at").is_none());
        assert!(json.get("parent_id").is_none());
        assert!(json.get("is_active").is_none());
    }

    #[test]
    fn test_session_info_with_parent_id() {
        let session = SessionInfo {
            id: "child".into(),
            name: "test".into(),
            message_count: 0,
            cost: 0.0,
            created_at: "".into(),
            last_active_at: "".into(),
            preview: "".into(),
            parent_id: Some("parent-id".into()),
            is_active: false,
        };

        let json: serde_json::Value = serde_json::to_value(&session).unwrap();
        assert_eq!(json["parentId"], "parent-id");
    }

    // -----------------------------------------------------------------------
    // gsd_home
    // -----------------------------------------------------------------------

    #[test]
    fn test_gsd_home_from_env() {
        std::env::set_var("GSD_HOME", "/custom/gsd");
        let result = gsd_home().unwrap();
        assert_eq!(result, PathBuf::from("/custom/gsd"));
        std::env::remove_var("GSD_HOME");
    }
}
