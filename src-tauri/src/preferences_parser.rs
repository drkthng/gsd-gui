// ---------------------------------------------------------------------------
// preferences_parser.rs — Read/write .gsd/preferences.md YAML frontmatter
//
// The preferences file has YAML frontmatter between `---` markers followed
// by an optional markdown body. This module parses the YAML into a flexible
// serde_json::Value (no typed struct needed — frontend handles any shape)
// and can write updated YAML back while preserving the markdown body.
// ---------------------------------------------------------------------------

use std::path::Path;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Read preferences from `<project_path>/.gsd/preferences.md`.
///
/// Extracts the YAML frontmatter between the first and second `---` markers,
/// parses it into a `serde_json::Value`, and returns it. Returns an empty
/// object `{}` if the file doesn't exist or has no frontmatter.
pub fn read_preferences(project_path: &str) -> Result<serde_json::Value, String> {
    let pref_path = Path::new(project_path)
        .join(".gsd")
        .join("preferences.md");

    if !pref_path.exists() {
        return Ok(serde_json::Value::Object(serde_json::Map::new()));
    }

    let content = std::fs::read_to_string(&pref_path)
        .map_err(|e| format!("Failed to read {}: {}", pref_path.display(), e))?;

    let yaml_str = extract_yaml_frontmatter(&content);
    match yaml_str {
        Some(yaml) => parse_yaml_to_json(yaml),
        None => Ok(serde_json::Value::Object(serde_json::Map::new())),
    }
}

/// Write preferences to `<project_path>/.gsd/preferences.md`.
///
/// Converts the `serde_json::Value` to YAML, wraps it in `---` markers,
/// and preserves any markdown body that existed after the frontmatter.
/// Creates the file if it doesn't exist.
pub fn write_preferences(
    project_path: &str,
    prefs: serde_json::Value,
) -> Result<(), String> {
    let pref_path = Path::new(project_path)
        .join(".gsd")
        .join("preferences.md");

    // Read existing body (markdown after frontmatter) if file exists
    let existing_body = if pref_path.exists() {
        let content = std::fs::read_to_string(&pref_path)
            .map_err(|e| format!("Failed to read {}: {}", pref_path.display(), e))?;
        extract_body_after_frontmatter(&content)
    } else {
        String::new()
    };

    // Convert JSON value to YAML string
    let yaml_str = serde_yaml::to_string(&prefs)
        .map_err(|e| format!("Failed to serialize preferences to YAML: {}", e))?;

    // Build the full file content
    let mut output = String::new();
    output.push_str("---\n");
    output.push_str(&yaml_str);
    // serde_yaml may or may not end with newline — ensure we have one
    if !yaml_str.ends_with('\n') {
        output.push('\n');
    }
    output.push_str("---\n");
    if !existing_body.is_empty() {
        output.push_str(&existing_body);
    }

    // Ensure parent directory exists
    if let Some(parent) = pref_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
    }

    std::fs::write(&pref_path, &output)
        .map_err(|e| format!("Failed to write {}: {}", pref_path.display(), e))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Extract the YAML content between the first and second `---` markers.
///
/// Returns `None` if the content doesn't start with `---` or doesn't have
/// a closing `---` marker.
fn extract_yaml_frontmatter(content: &str) -> Option<&str> {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return None;
    }

    // Skip the first `---` and any trailing chars on that line
    let after_first = &trimmed[3..];
    let after_first = match after_first.find('\n') {
        Some(pos) => &after_first[pos + 1..],
        None => return None, // Only `---` with nothing after
    };

    // Find the closing `---`
    // Look for `---` at the start of a line
    let end = find_closing_fence(after_first)?;
    Some(&after_first[..end])
}

/// Find the position of the closing `---` fence in a string.
/// The fence must be at the start of a line (or the start of the string).
fn find_closing_fence(s: &str) -> Option<usize> {
    // Check if string starts with ---
    if s.starts_with("---") {
        return Some(0);
    }

    // Look for \n---
    let mut search_start = 0;
    while let Some(pos) = s[search_start..].find("\n---") {
        let fence_start = search_start + pos + 1; // position of first `-`
        // Verify it's actually `---` followed by newline or EOF
        let after_dashes = &s[fence_start + 3..];
        if after_dashes.is_empty()
            || after_dashes.starts_with('\n')
            || after_dashes.starts_with('\r')
        {
            return Some(search_start + pos + 1 - 1); // return position relative to line start
        }
        search_start = fence_start + 3;
    }

    // Simpler approach: split by lines
    None
}

/// Extract the markdown body after the YAML frontmatter.
///
/// Returns everything after the closing `---` line (including the newline
/// after the `---`). Returns empty string if no frontmatter found.
fn extract_body_after_frontmatter(content: &str) -> String {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        // No frontmatter — the entire content is body
        return content.to_string();
    }

    // Find end of first `---` line
    let after_first = match trimmed[3..].find('\n') {
        Some(pos) => &trimmed[3 + pos + 1..],
        None => return String::new(),
    };

    // Find closing `---` line
    for (i, line) in after_first.lines().enumerate() {
        if line.trim_start().starts_with("---") {
            // Everything after this line is the body
            let lines: Vec<&str> = after_first.lines().collect();
            if i + 1 < lines.len() {
                // Rejoin lines after the closing fence
                let body_start = after_first
                    .find(&format!("{}\n", line))
                    .map(|pos| pos + line.len() + 1)
                    .unwrap_or_else(|| {
                        // Last line without trailing newline
                        after_first.len()
                    });
                return after_first[body_start..].to_string();
            }
            return String::new();
        }
    }

    String::new()
}

/// Parse a YAML string into a serde_json::Value.
///
/// serde_yaml can deserialize YAML directly into serde_json::Value because
/// both are based on serde's data model.
fn parse_yaml_to_json(yaml: &str) -> Result<serde_json::Value, String> {
    if yaml.trim().is_empty() {
        return Ok(serde_json::Value::Object(serde_json::Map::new()));
    }

    let value: serde_json::Value = serde_yaml::from_str(yaml)
        .map_err(|e| format!("Failed to parse YAML: {}", e))?;

    // Ensure we always return an object (not null from empty YAML)
    match value {
        serde_json::Value::Null => Ok(serde_json::Value::Object(serde_json::Map::new())),
        other => Ok(other),
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
            fs::create_dir_all(dir.path().join(".gsd")).unwrap();
            Self { dir }
        }

        fn root(&self) -> String {
            self.dir.path().to_string_lossy().to_string()
        }

        fn write_preferences(&self, content: &str) {
            let pref_path = self.dir.path().join(".gsd").join("preferences.md");
            fs::write(pref_path, content).unwrap();
        }

        fn read_preferences_file(&self) -> String {
            let pref_path = self.dir.path().join(".gsd").join("preferences.md");
            fs::read_to_string(pref_path).unwrap()
        }
    }

    // -----------------------------------------------------------------------
    // extract_yaml_frontmatter
    // -----------------------------------------------------------------------

    #[test]
    fn test_extract_yaml_basic() {
        let content = "---\nversion: 1\nmode: solo\n---\n# Body\n";
        let yaml = extract_yaml_frontmatter(content).unwrap();
        assert!(yaml.contains("version: 1"));
        assert!(yaml.contains("mode: solo"));
        assert!(!yaml.contains("# Body"));
    }

    #[test]
    fn test_extract_yaml_no_frontmatter() {
        assert_eq!(extract_yaml_frontmatter("# Just a heading"), None);
        assert_eq!(extract_yaml_frontmatter("No fences here"), None);
    }

    #[test]
    fn test_extract_yaml_no_closing_fence() {
        let content = "---\nversion: 1\n";
        assert_eq!(extract_yaml_frontmatter(content), None);
    }

    #[test]
    fn test_extract_yaml_empty_frontmatter() {
        let content = "---\n---\n# Body\n";
        let yaml = extract_yaml_frontmatter(content).unwrap();
        assert!(yaml.is_empty());
    }

    // -----------------------------------------------------------------------
    // extract_body_after_frontmatter
    // -----------------------------------------------------------------------

    #[test]
    fn test_extract_body_with_frontmatter() {
        let content = "---\nversion: 1\n---\n# Title\n\nBody text\n";
        let body = extract_body_after_frontmatter(content);
        assert!(body.contains("# Title"));
        assert!(body.contains("Body text"));
        assert!(!body.contains("version: 1"));
    }

    #[test]
    fn test_extract_body_no_frontmatter() {
        let content = "# Just content\nNo frontmatter\n";
        let body = extract_body_after_frontmatter(content);
        assert_eq!(body, content);
    }

    #[test]
    fn test_extract_body_empty_body() {
        let content = "---\nversion: 1\n---\n";
        let body = extract_body_after_frontmatter(content);
        assert!(body.is_empty() || body.trim().is_empty());
    }

    // -----------------------------------------------------------------------
    // parse_yaml_to_json
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_yaml_simple() {
        let yaml = "version: 1\nmode: solo\n";
        let value = parse_yaml_to_json(yaml).unwrap();
        assert_eq!(value["version"], 1);
        assert_eq!(value["mode"], "solo");
    }

    #[test]
    fn test_parse_yaml_nested() {
        let yaml = "git:\n  isolation: worktree\n  main_branch: main\n";
        let value = parse_yaml_to_json(yaml).unwrap();
        assert_eq!(value["git"]["isolation"], "worktree");
        assert_eq!(value["git"]["main_branch"], "main");
    }

    #[test]
    fn test_parse_yaml_arrays() {
        let yaml = "always_use_skills:\n  - lint\n  - test\n";
        let value = parse_yaml_to_json(yaml).unwrap();
        let skills = value["always_use_skills"].as_array().unwrap();
        assert_eq!(skills.len(), 2);
        assert_eq!(skills[0], "lint");
        assert_eq!(skills[1], "test");
    }

    #[test]
    fn test_parse_yaml_empty() {
        let value = parse_yaml_to_json("").unwrap();
        assert!(value.is_object());
        assert!(value.as_object().unwrap().is_empty());
    }

    // -----------------------------------------------------------------------
    // read_preferences
    // -----------------------------------------------------------------------

    #[test]
    fn test_read_preferences_full_file() {
        let proj = TestProject::new();
        proj.write_preferences(
            "---\nversion: 1\nmode: solo\ngit:\n  isolation: worktree\n---\n\n# GSD Preferences\n\nBody text.\n"
        );
        let prefs = read_preferences(&proj.root()).unwrap();
        assert_eq!(prefs["version"], 1);
        assert_eq!(prefs["mode"], "solo");
        assert_eq!(prefs["git"]["isolation"], "worktree");
    }

    #[test]
    fn test_read_preferences_no_file() {
        let proj = TestProject::new();
        let prefs = read_preferences(&proj.root()).unwrap();
        assert!(prefs.is_object());
        assert!(prefs.as_object().unwrap().is_empty());
    }

    #[test]
    fn test_read_preferences_no_frontmatter() {
        let proj = TestProject::new();
        proj.write_preferences("# Just a heading\nNo YAML here.\n");
        let prefs = read_preferences(&proj.root()).unwrap();
        assert!(prefs.is_object());
        assert!(prefs.as_object().unwrap().is_empty());
    }

    #[test]
    fn test_read_preferences_complex_yaml() {
        let proj = TestProject::new();
        proj.write_preferences(
            "---\nversion: 1\ncustom_instructions:\n  - always write tests\n  - use TypeScript\npost_unit_hooks:\n  - name: notify\n    enabled: true\n---\n"
        );
        let prefs = read_preferences(&proj.root()).unwrap();
        assert_eq!(prefs["version"], 1);
        let instructions = prefs["custom_instructions"].as_array().unwrap();
        assert_eq!(instructions.len(), 2);
        let hooks = prefs["post_unit_hooks"].as_array().unwrap();
        assert_eq!(hooks[0]["name"], "notify");
        assert_eq!(hooks[0]["enabled"], true);
    }

    // -----------------------------------------------------------------------
    // write_preferences
    // -----------------------------------------------------------------------

    #[test]
    fn test_write_preferences_new_file() {
        let proj = TestProject::new();
        let prefs = serde_json::json!({
            "version": 1,
            "mode": "solo"
        });
        write_preferences(&proj.root(), prefs).unwrap();

        let content = proj.read_preferences_file();
        assert!(content.starts_with("---\n"));
        assert!(content.contains("version: 1"));
        assert!(content.contains("mode: solo"));
        assert!(content.contains("\n---\n"));
    }

    #[test]
    fn test_write_preferences_preserves_body() {
        let proj = TestProject::new();
        proj.write_preferences(
            "---\nversion: 1\nmode: solo\n---\n\n# GSD Preferences\n\nKeep this body.\n"
        );

        let new_prefs = serde_json::json!({
            "version": 2,
            "mode": "team"
        });
        write_preferences(&proj.root(), new_prefs).unwrap();

        let content = proj.read_preferences_file();
        assert!(content.contains("version: 2"));
        assert!(content.contains("mode: team"));
        assert!(content.contains("# GSD Preferences"));
        assert!(content.contains("Keep this body."));
        // Old values should not be present
        assert!(!content.contains("version: 1"));
    }

    #[test]
    fn test_write_then_read_roundtrip() {
        let proj = TestProject::new();
        let original = serde_json::json!({
            "version": 1,
            "mode": "solo",
            "git": {
                "isolation": "worktree",
                "auto_push": true
            },
            "custom_instructions": ["write tests", "use rust"]
        });

        write_preferences(&proj.root(), original.clone()).unwrap();
        let read_back = read_preferences(&proj.root()).unwrap();

        assert_eq!(read_back["version"], original["version"]);
        assert_eq!(read_back["mode"], original["mode"]);
        assert_eq!(read_back["git"]["isolation"], original["git"]["isolation"]);
        assert_eq!(read_back["git"]["auto_push"], original["git"]["auto_push"]);
        assert_eq!(
            read_back["custom_instructions"].as_array().unwrap().len(),
            original["custom_instructions"].as_array().unwrap().len()
        );
    }

    #[test]
    fn test_write_preferences_creates_directory() {
        let dir = tempfile::TempDir::new().unwrap();
        // Don't create .gsd directory — write_preferences should create it
        let root = dir.path().to_string_lossy().to_string();
        let prefs = serde_json::json!({"version": 1});
        write_preferences(&root, prefs).unwrap();

        let content = fs::read_to_string(dir.path().join(".gsd").join("preferences.md")).unwrap();
        assert!(content.contains("version: 1"));
    }
}
