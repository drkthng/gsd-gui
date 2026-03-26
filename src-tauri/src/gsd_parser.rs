// ---------------------------------------------------------------------------
// gsd_parser.rs — Parse a .gsd/ directory tree into MilestoneInfo structs
//
// Reads ROADMAP.md, PLAN.md, and SUMMARY.md files to build a structured
// milestone → slice → task tree matching the frontend TypeScript types.
// ---------------------------------------------------------------------------

use regex::Regex;
use serde::Serialize;
use std::path::{Path, PathBuf};

// ---------------------------------------------------------------------------
// Types — mirror src/lib/types.ts exactly (camelCase JSON via serde)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum CompletionStatus {
    Done,
    InProgress,
    Pending,
    Blocked,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskInfo {
    pub id: String,
    pub title: String,
    pub status: CompletionStatus,
    pub cost: f64,
    pub duration: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SliceInfo {
    pub id: String,
    pub title: String,
    pub status: CompletionStatus,
    pub risk: RiskLevel,
    pub cost: f64,
    pub progress: f64,
    pub tasks: Vec<TaskInfo>,
    pub depends: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MilestoneInfo {
    pub id: String,
    pub title: String,
    pub status: CompletionStatus,
    pub cost: f64,
    pub progress: f64,
    pub slices: Vec<SliceInfo>,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Parse all milestones under `<project_root>/.gsd/milestones/`.
///
/// Returns an empty Vec if the milestones directory doesn't exist.
/// Skips milestones that don't have a ROADMAP.md.
/// Returns Err only on truly unexpected I/O failures (not missing files).
pub fn parse_project_milestones(project_root: &Path) -> Result<Vec<MilestoneInfo>, String> {
    let milestones_dir = project_root.join(".gsd").join("milestones");
    if !milestones_dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries: Vec<PathBuf> = std::fs::read_dir(&milestones_dir)
        .map_err(|e| format!("Failed to read {}: {}", milestones_dir.display(), e))?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|p| p.is_dir())
        .collect();

    // Sort by directory name so milestones appear in order (M001 before M002)
    entries.sort();

    let mut milestones = Vec::new();
    for milestone_dir in entries {
        let dir_name = milestone_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

        // Only process directories that look like milestone IDs (M followed by digits, optionally with a random suffix)
        if !dir_name.starts_with('M') {
            continue;
        }

        // Extract the milestone ID (e.g. "M001" from "M001" or "M001-eh88as")
        let milestone_id = extract_milestone_id(dir_name);
        if milestone_id.is_none() {
            continue;
        }
        let milestone_id = milestone_id.unwrap();

        // Look for ROADMAP.md: could be M001-ROADMAP.md or similar
        let roadmap_path = find_roadmap_file(&milestone_dir, dir_name);
        if roadmap_path.is_none() {
            continue; // No roadmap = skip this milestone (ghost directory)
        }
        let roadmap_path = roadmap_path.unwrap();

        let roadmap_content = std::fs::read_to_string(&roadmap_path)
            .map_err(|e| format!("Failed to read {}: {}", roadmap_path.display(), e))?;

        // Check if milestone has a SUMMARY.md with status: complete
        let milestone_has_summary = has_complete_milestone_summary(&milestone_dir, dir_name);

        // Parse roadmap into milestone info
        let mut milestone =
            parse_roadmap(&roadmap_content, &milestone_id, &milestone_dir)?;

        // Override status if milestone summary says complete
        if milestone_has_summary {
            milestone.status = CompletionStatus::Done;
        }

        // Derive milestone status and progress from slices
        derive_milestone_status(&mut milestone);

        milestones.push(milestone);
    }

    Ok(milestones)
}

// ---------------------------------------------------------------------------
// Internal parsing functions
// ---------------------------------------------------------------------------

/// Extract a milestone ID like "M001" from a directory name like "M001" or "M001-eh88as".
fn extract_milestone_id(dir_name: &str) -> Option<String> {
    let re = Regex::new(r"^(M\d+)").unwrap();
    re.captures(dir_name).map(|c| c[1].to_string())
}

/// Find the ROADMAP.md file in a milestone directory.
/// Tries `<dir_name>-ROADMAP.md` first, then any file ending in `-ROADMAP.md`.
fn find_roadmap_file(milestone_dir: &Path, dir_name: &str) -> Option<PathBuf> {
    // Try the canonical name first
    let canonical = milestone_dir.join(format!("{}-ROADMAP.md", dir_name));
    if canonical.exists() {
        return Some(canonical);
    }

    // Fall back to scanning for any *-ROADMAP.md
    if let Ok(entries) = std::fs::read_dir(milestone_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str.ends_with("-ROADMAP.md") {
                return Some(entry.path());
            }
        }
    }

    None
}

/// Check if a milestone has a SUMMARY.md with `status: complete` in frontmatter.
fn has_complete_milestone_summary(milestone_dir: &Path, dir_name: &str) -> bool {
    let summary_path = milestone_dir.join(format!("{}-SUMMARY.md", dir_name));
    if !summary_path.exists() {
        return false;
    }
    match std::fs::read_to_string(&summary_path) {
        Ok(content) => frontmatter_has_status_complete(&content),
        Err(_) => false,
    }
}

/// Parse YAML-ish frontmatter for `status: complete`.
fn frontmatter_has_status_complete(content: &str) -> bool {
    let Some(fm) = extract_frontmatter(content) else {
        return false;
    };
    fm.lines()
        .any(|line| {
            let trimmed = line.trim();
            trimmed == "status: complete" || trimmed == "status: \"complete\""
        })
}

/// Extract the frontmatter block between `---` fences.
fn extract_frontmatter(content: &str) -> Option<&str> {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return None;
    }
    let after_first = &trimmed[3..];
    let end = after_first.find("\n---")?;
    Some(&after_first[..end])
}

/// Parse a ROADMAP.md into a MilestoneInfo.
fn parse_roadmap(
    content: &str,
    milestone_id: &str,
    milestone_dir: &Path,
) -> Result<MilestoneInfo, String> {
    let title = parse_milestone_title(content, milestone_id);

    let slices = parse_roadmap_slices(content, milestone_id, milestone_dir)?;

    Ok(MilestoneInfo {
        id: milestone_id.to_string(),
        title,
        status: CompletionStatus::Pending, // Will be derived later
        cost: 0.0,
        progress: 0.0,
        slices,
    })
}

/// Extract milestone title from the `# MXXX: Title` heading line.
fn parse_milestone_title(content: &str, milestone_id: &str) -> String {
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("# ") {
            // Try to match "# M001: Title" or "# M001-r5jzab: Title"
            let after_hash = trimmed[2..].trim();
            // Strip the milestone ID prefix (with optional random suffix) and colon
            let re = Regex::new(&format!(r"^{}(?:-\w+)?:\s*(.+)$", regex::escape(milestone_id)))
                .unwrap();
            if let Some(caps) = re.captures(after_hash) {
                return caps[1].to_string();
            }
            // If no colon pattern matches, return everything after "# "
            return after_hash.to_string();
        }
    }
    milestone_id.to_string() // Fallback to ID as title
}

/// Parse slice lines from a ROADMAP.md.
///
/// Expected format:
/// `- [x] **S01: Title text** \`risk:high\` \`depends:[]\``
/// `- [ ] **S02: Title** \`risk:low\` \`depends:[S01]\``
fn parse_roadmap_slices(
    content: &str,
    milestone_id: &str,
    milestone_dir: &Path,
) -> Result<Vec<SliceInfo>, String> {
    let slice_re = Regex::new(
        r"^-\s+\[([ xX])\]\s+\*\*(\w+):\s*(.+?)\*\*\s*`risk:(\w+)`\s*`depends:\[([^\]]*)\]`"
    ).unwrap();

    let mut slices = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(caps) = slice_re.captures(trimmed) {
            let checkbox = &caps[1];
            let slice_id = caps[2].to_string();
            let title = caps[3].trim().to_string();
            let risk_str = &caps[4];
            let depends_str = &caps[5];

            let checked = checkbox == "x" || checkbox == "X";
            let risk = parse_risk_level(risk_str);
            let depends = parse_depends(depends_str);

            // Parse tasks from the slice's PLAN.md
            let tasks = parse_slice_tasks(milestone_dir, &slice_id);

            // Determine slice status from checkbox and task states
            let status = derive_slice_status(checked, &tasks);

            let progress = if tasks.is_empty() {
                if checked { 100.0 } else { 0.0 }
            } else {
                let done_count = tasks.iter()
                    .filter(|t| t.status == CompletionStatus::Done)
                    .count();
                (done_count as f64 / tasks.len() as f64) * 100.0
            };

            slices.push(SliceInfo {
                id: slice_id,
                title,
                status,
                risk,
                cost: 0.0,
                progress,
                tasks,
                depends,
            });
        }
    }

    let _ = milestone_id; // used for context in error messages if needed
    Ok(slices)
}

fn parse_risk_level(s: &str) -> RiskLevel {
    match s.to_lowercase().as_str() {
        "high" => RiskLevel::High,
        "medium" => RiskLevel::Medium,
        _ => RiskLevel::Low,
    }
}

fn parse_depends(s: &str) -> Vec<String> {
    if s.trim().is_empty() {
        return Vec::new();
    }
    s.split(',')
        .map(|d| d.trim().to_string())
        .filter(|d| !d.is_empty())
        .collect()
}

/// Derive slice status from its checkbox and task states.
fn derive_slice_status(checked: bool, tasks: &[TaskInfo]) -> CompletionStatus {
    if checked {
        return CompletionStatus::Done;
    }
    if tasks.is_empty() {
        return CompletionStatus::Pending;
    }

    let all_done = tasks.iter().all(|t| t.status == CompletionStatus::Done);
    let any_done_or_progress = tasks.iter().any(|t| {
        t.status == CompletionStatus::Done || t.status == CompletionStatus::InProgress
    });

    if all_done {
        CompletionStatus::Done
    } else if any_done_or_progress {
        CompletionStatus::InProgress
    } else {
        CompletionStatus::Pending
    }
}

// ---------------------------------------------------------------------------
// Task parsing from PLAN.md
// ---------------------------------------------------------------------------

/// Parse tasks from a slice's PLAN.md file.
///
/// Expected format:
/// `- [x] **T01: Task title** \`est:2h\``
/// `- [ ] **T02: Another task** \`est:45m\``
fn parse_slice_tasks(milestone_dir: &Path, slice_id: &str) -> Vec<TaskInfo> {
    let plan_path = milestone_dir
        .join("slices")
        .join(slice_id)
        .join(format!("{}-PLAN.md", slice_id));

    if !plan_path.exists() {
        return Vec::new();
    }

    let content = match std::fs::read_to_string(&plan_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let task_re = Regex::new(
        r"^-\s+\[([ xX])\]\s+\*\*(\w+):\s*(.+?)\*\*\s*`est:([^`]+)`"
    ).unwrap();

    let tasks_dir = milestone_dir.join("slices").join(slice_id).join("tasks");

    let mut tasks = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(caps) = task_re.captures(trimmed) {
            let checkbox = &caps[1];
            let task_id = caps[2].to_string();
            let title = caps[3].trim().to_string();

            let checked = checkbox == "x" || checkbox == "X";

            // Read duration from task SUMMARY.md if it exists
            let duration = read_task_duration(&tasks_dir, &task_id);

            // Determine task status: checked = done, has summary = done, otherwise pending
            let has_summary = tasks_dir.join(format!("{}-SUMMARY.md", task_id)).exists();
            let status = if checked || has_summary {
                CompletionStatus::Done
            } else {
                CompletionStatus::Pending
            };

            tasks.push(TaskInfo {
                id: task_id,
                title,
                status,
                cost: 0.0,
                duration,
            });
        }
    }

    tasks
}

/// Read the `duration` field from a task's SUMMARY.md YAML frontmatter.
fn read_task_duration(tasks_dir: &Path, task_id: &str) -> Option<String> {
    let summary_path = tasks_dir.join(format!("{}-SUMMARY.md", task_id));
    if !summary_path.exists() {
        return None;
    }

    let content = std::fs::read_to_string(&summary_path).ok()?;
    let fm = extract_frontmatter(&content)?;

    for line in fm.lines() {
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("duration:") {
            let v = value.trim().trim_matches('"').trim_matches('\'');
            if !v.is_empty() {
                return Some(v.to_string());
            }
        }
    }

    None
}

/// Derive milestone-level status and progress from its slices.
fn derive_milestone_status(milestone: &mut MilestoneInfo) {
    if milestone.slices.is_empty() {
        // No slices parsed — keep whatever status was set (e.g. from summary)
        return;
    }

    let all_done = milestone
        .slices
        .iter()
        .all(|s| s.status == CompletionStatus::Done);
    let any_in_progress = milestone.slices.iter().any(|s| {
        s.status == CompletionStatus::InProgress || s.status == CompletionStatus::Done
    });

    // Don't override Done if milestone summary confirmed it
    if milestone.status != CompletionStatus::Done {
        milestone.status = if all_done {
            CompletionStatus::Done
        } else if any_in_progress {
            CompletionStatus::InProgress
        } else {
            CompletionStatus::Pending
        };
    }

    let done_count = milestone
        .slices
        .iter()
        .filter(|s| s.status == CompletionStatus::Done)
        .count();
    milestone.progress = if milestone.slices.is_empty() {
        0.0
    } else {
        (done_count as f64 / milestone.slices.len() as f64) * 100.0
    };
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// Helper to create a temp .gsd directory structure for testing.
    struct TestProject {
        dir: tempfile::TempDir,
    }

    impl TestProject {
        fn new() -> Self {
            Self {
                dir: tempfile::TempDir::new().unwrap(),
            }
        }

        fn root(&self) -> &Path {
            self.dir.path()
        }

        fn milestones_dir(&self) -> PathBuf {
            self.root().join(".gsd").join("milestones")
        }

        fn create_milestone(&self, id: &str) -> PathBuf {
            let dir = self.milestones_dir().join(id);
            fs::create_dir_all(&dir).unwrap();
            dir
        }

        fn write_file(&self, relative_path: &str, content: &str) {
            let path = self.root().join(relative_path);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).unwrap();
            }
            fs::write(&path, content).unwrap();
        }
    }

    // -----------------------------------------------------------------------
    // extract_milestone_id
    // -----------------------------------------------------------------------

    #[test]
    fn test_extract_milestone_id_simple() {
        assert_eq!(extract_milestone_id("M001"), Some("M001".to_string()));
    }

    #[test]
    fn test_extract_milestone_id_with_suffix() {
        assert_eq!(
            extract_milestone_id("M002-eh88as"),
            Some("M002".to_string())
        );
    }

    #[test]
    fn test_extract_milestone_id_invalid() {
        assert_eq!(extract_milestone_id("slices"), None);
        assert_eq!(extract_milestone_id(".hidden"), None);
    }

    // -----------------------------------------------------------------------
    // parse_milestone_title
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_milestone_title() {
        let content = "# M001: Project Scaffolding & Core Shell\n\n**Vision:** ...";
        assert_eq!(
            parse_milestone_title(content, "M001"),
            "Project Scaffolding & Core Shell"
        );
    }

    #[test]
    fn test_parse_milestone_title_with_suffix() {
        let content = "# M001-eh88as: Fancy Name\n\n**Vision:** ...";
        assert_eq!(parse_milestone_title(content, "M001"), "Fancy Name");
    }

    #[test]
    fn test_parse_milestone_title_fallback() {
        let content = "No heading here\nJust text.";
        assert_eq!(parse_milestone_title(content, "M001"), "M001");
    }

    // -----------------------------------------------------------------------
    // parse_risk_level
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_risk_levels() {
        assert_eq!(parse_risk_level("high"), RiskLevel::High);
        assert_eq!(parse_risk_level("medium"), RiskLevel::Medium);
        assert_eq!(parse_risk_level("low"), RiskLevel::Low);
        assert_eq!(parse_risk_level("HIGH"), RiskLevel::High);
        assert_eq!(parse_risk_level("unknown"), RiskLevel::Low); // default
    }

    // -----------------------------------------------------------------------
    // parse_depends
    // -----------------------------------------------------------------------

    #[test]
    fn test_parse_depends_empty() {
        assert_eq!(parse_depends(""), Vec::<String>::new());
        assert_eq!(parse_depends("  "), Vec::<String>::new());
    }

    #[test]
    fn test_parse_depends_single() {
        assert_eq!(parse_depends("S01"), vec!["S01".to_string()]);
    }

    #[test]
    fn test_parse_depends_multiple() {
        assert_eq!(
            parse_depends("S01,S02"),
            vec!["S01".to_string(), "S02".to_string()]
        );
        // With spaces
        assert_eq!(
            parse_depends("S01, S02, S03"),
            vec!["S01".to_string(), "S02".to_string(), "S03".to_string()]
        );
    }

    // -----------------------------------------------------------------------
    // extract_frontmatter
    // -----------------------------------------------------------------------

    #[test]
    fn test_extract_frontmatter() {
        let content = "---\nid: T01\nduration: 25m\n---\n# Title\nBody";
        let fm = extract_frontmatter(content).unwrap();
        assert!(fm.contains("duration: 25m"));
        assert!(fm.contains("id: T01"));
    }

    #[test]
    fn test_extract_frontmatter_none() {
        assert_eq!(extract_frontmatter("# Just a heading\nNo frontmatter"), None);
    }

    // -----------------------------------------------------------------------
    // frontmatter_has_status_complete
    // -----------------------------------------------------------------------

    #[test]
    fn test_frontmatter_status_complete() {
        let content = "---\nid: M001\nstatus: complete\n---\n# Summary";
        assert!(frontmatter_has_status_complete(content));
    }

    #[test]
    fn test_frontmatter_status_not_complete() {
        let content = "---\nid: M001\nstatus: in-progress\n---\n# Summary";
        assert!(!frontmatter_has_status_complete(content));
    }

    #[test]
    fn test_frontmatter_no_frontmatter() {
        assert!(!frontmatter_has_status_complete("# Just a heading"));
    }

    // -----------------------------------------------------------------------
    // derive_slice_status
    // -----------------------------------------------------------------------

    #[test]
    fn test_derive_slice_status_checked() {
        let tasks = vec![];
        assert_eq!(derive_slice_status(true, &tasks), CompletionStatus::Done);
    }

    #[test]
    fn test_derive_slice_status_no_tasks() {
        let tasks = vec![];
        assert_eq!(derive_slice_status(false, &tasks), CompletionStatus::Pending);
    }

    #[test]
    fn test_derive_slice_status_all_done() {
        let tasks = vec![
            TaskInfo { id: "T01".into(), title: "A".into(), status: CompletionStatus::Done, cost: 0.0, duration: None },
            TaskInfo { id: "T02".into(), title: "B".into(), status: CompletionStatus::Done, cost: 0.0, duration: None },
        ];
        assert_eq!(derive_slice_status(false, &tasks), CompletionStatus::Done);
    }

    #[test]
    fn test_derive_slice_status_in_progress() {
        let tasks = vec![
            TaskInfo { id: "T01".into(), title: "A".into(), status: CompletionStatus::Done, cost: 0.0, duration: None },
            TaskInfo { id: "T02".into(), title: "B".into(), status: CompletionStatus::Pending, cost: 0.0, duration: None },
        ];
        assert_eq!(derive_slice_status(false, &tasks), CompletionStatus::InProgress);
    }

    #[test]
    fn test_derive_slice_status_all_pending() {
        let tasks = vec![
            TaskInfo { id: "T01".into(), title: "A".into(), status: CompletionStatus::Pending, cost: 0.0, duration: None },
        ];
        assert_eq!(derive_slice_status(false, &tasks), CompletionStatus::Pending);
    }

    // -----------------------------------------------------------------------
    // Full integration: parse_project_milestones with temp directories
    // -----------------------------------------------------------------------

    #[test]
    fn test_empty_project_no_gsd_dir() {
        let proj = TestProject::new();
        let result = parse_project_milestones(proj.root()).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_empty_milestones_dir() {
        let proj = TestProject::new();
        fs::create_dir_all(proj.milestones_dir()).unwrap();
        let result = parse_project_milestones(proj.root()).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_ghost_milestone_no_roadmap() {
        let proj = TestProject::new();
        let m_dir = proj.create_milestone("M001");
        fs::create_dir_all(m_dir.join("slices")).unwrap();
        // No ROADMAP.md — should be skipped
        let result = parse_project_milestones(proj.root()).unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_single_milestone_with_slices() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            r#"# M001: Test Milestone

## Slices

- [x] **S01: First slice** `risk:high` `depends:[]`
  > After this: everything works

- [ ] **S02: Second slice** `risk:low` `depends:[S01]`
  > After this: more works
"#,
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result.len(), 1);

        let m = &result[0];
        assert_eq!(m.id, "M001");
        assert_eq!(m.title, "Test Milestone");
        assert_eq!(m.slices.len(), 2);

        let s1 = &m.slices[0];
        assert_eq!(s1.id, "S01");
        assert_eq!(s1.title, "First slice");
        assert_eq!(s1.risk, RiskLevel::High);
        assert_eq!(s1.status, CompletionStatus::Done);
        assert_eq!(s1.progress, 100.0);
        assert!(s1.depends.is_empty());

        let s2 = &m.slices[1];
        assert_eq!(s2.id, "S02");
        assert_eq!(s2.title, "Second slice");
        assert_eq!(s2.risk, RiskLevel::Low);
        assert_eq!(s2.status, CompletionStatus::Pending);
        assert_eq!(s2.progress, 0.0);
        assert_eq!(s2.depends, vec!["S01"]);
    }

    #[test]
    fn test_milestone_with_complete_summary() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            "# M001: Done Milestone\n\n## Slices\n\n- [x] **S01: Only slice** `risk:low` `depends:[]`\n",
        );

        proj.write_file(
            ".gsd/milestones/M001/M001-SUMMARY.md",
            "---\nid: M001\ntitle: \"Done Milestone\"\nstatus: complete\n---\n# Summary\nAll done.",
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].status, CompletionStatus::Done);
    }

    #[test]
    fn test_milestone_in_progress() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            "# M001: Active Milestone\n\n## Slices\n\n- [x] **S01: Done** `risk:low` `depends:[]`\n- [ ] **S02: Pending** `risk:medium` `depends:[S01]`\n",
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result[0].status, CompletionStatus::InProgress);
        assert_eq!(result[0].progress, 50.0);
    }

    #[test]
    fn test_tasks_parsed_from_plan() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            "# M001: With Tasks\n\n## Slices\n\n- [ ] **S01: Has tasks** `risk:medium` `depends:[]`\n",
        );

        proj.write_file(
            ".gsd/milestones/M001/slices/S01/S01-PLAN.md",
            r#"# S01: Has tasks

## Tasks

- [x] **T01: First task** `est:2h`
- [ ] **T02: Second task** `est:45m`
- [ ] **T03: Third task** `est:1h`
"#,
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        let s = &result[0].slices[0];
        assert_eq!(s.tasks.len(), 3);
        assert_eq!(s.status, CompletionStatus::InProgress); // T01 done, others pending

        assert_eq!(s.tasks[0].id, "T01");
        assert_eq!(s.tasks[0].title, "First task");
        assert_eq!(s.tasks[0].status, CompletionStatus::Done);

        assert_eq!(s.tasks[1].id, "T02");
        assert_eq!(s.tasks[1].status, CompletionStatus::Pending);

        // Progress: 1/3 done
        let expected = (1.0 / 3.0) * 100.0;
        assert!((s.progress - expected).abs() < 0.01);
    }

    #[test]
    fn test_task_duration_from_summary() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            "# M001: Duration Test\n\n## Slices\n\n- [ ] **S01: Slice** `risk:low` `depends:[]`\n",
        );

        proj.write_file(
            ".gsd/milestones/M001/slices/S01/S01-PLAN.md",
            "# S01: Slice\n\n## Tasks\n\n- [x] **T01: Task A** `est:2h`\n- [ ] **T02: Task B** `est:1h`\n",
        );

        proj.write_file(
            ".gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md",
            "---\nid: T01\nparent: S01\nmilestone: M001\nduration: 25m\n---\n# Task summary\nDone.",
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        let tasks = &result[0].slices[0].tasks;
        assert_eq!(tasks[0].duration, Some("25m".to_string()));
        assert_eq!(tasks[1].duration, None);
    }

    #[test]
    fn test_multiple_milestones_sorted() {
        let proj = TestProject::new();
        // Create in reverse order to test sorting
        proj.create_milestone("M003");
        proj.create_milestone("M001");
        proj.create_milestone("M002");

        for id in &["M001", "M002", "M003"] {
            proj.write_file(
                &format!(".gsd/milestones/{}/{}-ROADMAP.md", id, id),
                &format!("# {}: Milestone {}\n\n## Slices\n", id, id),
            );
        }

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].id, "M001");
        assert_eq!(result[1].id, "M002");
        assert_eq!(result[2].id, "M003");
    }

    #[test]
    fn test_malformed_slice_lines_skipped() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            r#"# M001: Mixed Content

## Slices

- [x] **S01: Good slice** `risk:low` `depends:[]`
  > After this: works

This is a random paragraph that shouldn't match.

- Not a valid slice line at all

- [ ] **S02: Also good** `risk:high` `depends:[S01]`
"#,
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result[0].slices.len(), 2);
    }

    #[test]
    fn test_task_status_from_summary_existence() {
        let proj = TestProject::new();
        proj.create_milestone("M001");

        proj.write_file(
            ".gsd/milestones/M001/M001-ROADMAP.md",
            "# M001: Summary Test\n\n## Slices\n\n- [ ] **S01: Slice** `risk:low` `depends:[]`\n",
        );

        // Task is unchecked in plan but has a summary file → should be Done
        proj.write_file(
            ".gsd/milestones/M001/slices/S01/S01-PLAN.md",
            "# S01\n\n## Tasks\n\n- [ ] **T01: Unchecked but done** `est:1h`\n",
        );

        proj.write_file(
            ".gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md",
            "---\nid: T01\nduration: 15m\n---\n# Done\nFinished.",
        );

        let result = parse_project_milestones(proj.root()).unwrap();
        assert_eq!(result[0].slices[0].tasks[0].status, CompletionStatus::Done);
    }

    // -----------------------------------------------------------------------
    // Serialization tests — verify JSON output matches TypeScript types
    // -----------------------------------------------------------------------

    #[test]
    fn test_completion_status_serializes_kebab_case() {
        assert_eq!(serde_json::to_string(&CompletionStatus::Done).unwrap(), "\"done\"");
        assert_eq!(serde_json::to_string(&CompletionStatus::InProgress).unwrap(), "\"in-progress\"");
        assert_eq!(serde_json::to_string(&CompletionStatus::Pending).unwrap(), "\"pending\"");
        assert_eq!(serde_json::to_string(&CompletionStatus::Blocked).unwrap(), "\"blocked\"");
    }

    #[test]
    fn test_risk_level_serializes_lowercase() {
        assert_eq!(serde_json::to_string(&RiskLevel::Low).unwrap(), "\"low\"");
        assert_eq!(serde_json::to_string(&RiskLevel::Medium).unwrap(), "\"medium\"");
        assert_eq!(serde_json::to_string(&RiskLevel::High).unwrap(), "\"high\"");
    }

    #[test]
    fn test_milestone_info_json_shape() {
        let milestone = MilestoneInfo {
            id: "M001".into(),
            title: "Test".into(),
            status: CompletionStatus::InProgress,
            cost: 0.0,
            progress: 50.0,
            slices: vec![],
        };

        let json: serde_json::Value = serde_json::to_value(&milestone).unwrap();
        assert_eq!(json["id"], "M001");
        assert_eq!(json["title"], "Test");
        assert_eq!(json["status"], "in-progress");
        assert_eq!(json["cost"], 0.0);
        assert_eq!(json["progress"], 50.0);
        // Verify camelCase is not needed for these single-word fields,
        // but the struct is configured with rename_all = "camelCase"
        assert!(json.get("slices").is_some());
    }

    #[test]
    fn test_real_gsd_directory() {
        // This test parses the actual .gsd/ directory of this project
        // It's an integration test against real data
        let project_root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
        let gsd_milestones = project_root.join(".gsd").join("milestones");

        if !gsd_milestones.exists() {
            // Skip if not running from the gsd-gui project
            return;
        }

        let result = parse_project_milestones(project_root).unwrap();

        // We know this project has at least M001
        assert!(!result.is_empty(), "Should find at least one milestone");

        let m001 = result.iter().find(|m| m.id == "M001");
        assert!(m001.is_some(), "Should find M001");

        let m001 = m001.unwrap();
        assert_eq!(m001.title, "Project Scaffolding & Core Shell");
        assert_eq!(m001.status, CompletionStatus::Done);
        assert_eq!(m001.slices.len(), 4);
        assert_eq!(m001.progress, 100.0);

        // All M001 slices should be done
        for slice in &m001.slices {
            assert_eq!(slice.status, CompletionStatus::Done);
        }
    }
}
