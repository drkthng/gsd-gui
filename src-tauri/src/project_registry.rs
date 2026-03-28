//! Persistent project registry — stores known project paths in a JSON file
//! inside the app's data directory.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::gsd_query::ProjectInfo;
use tauri::Manager;

/// A saved project entry in the registry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedProject {
    pub id: String,
    pub name: String,
    pub path: String,
    /// Optional user-provided description.
    pub description: Option<String>,
    /// ISO 8601 timestamp of when the project was added.
    pub added_at: String,
}

/// The registry file contents.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Registry {
    pub projects: Vec<SavedProject>,
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

fn registry_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
    Ok(dir)
}

fn registry_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(registry_dir(app)?.join("projects.json"))
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/// Load the registry from disk. Returns empty registry if file doesn't exist.
/// Also self-heals any stored projects whose name is a generic GSD placeholder
/// ("Project", "GSD Project", etc.) by re-deriving from PROJECT.md or directory name.
pub fn load(app: &tauri::AppHandle) -> Result<Registry, String> {
    let path = registry_path(app)?;
    if !path.exists() {
        return Ok(Registry::default());
    }
    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read registry at {}: {e}", path.display()))?;
    let mut registry: Registry = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse registry JSON: {e}"))?;

    // Heal generic placeholder names stored by earlier versions
    let mut changed = false;
    for project in &mut registry.projects {
        // Strip \\?\ UNC prefix that canonicalize used to add
        if project.path.starts_with(r"\\?\") {
            project.path = project.path[4..].to_string();
            changed = true;
        }
        if is_generic_name(&project.name) {
            let project_dir = std::path::Path::new(&project.path);
            let better_name = read_project_name(project_dir).or_else(|| {
                project_dir
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
            });
            if let Some(name) = better_name {
                project.name = name;
                changed = true;
            }
        }
    }
    if changed {
        // Best-effort write — don't fail the load if the save fails
        let _ = save(app, &registry);
    }

    Ok(registry)
}

/// Returns true if the name is a known GSD-generated generic placeholder.
fn is_generic_name(name: &str) -> bool {
    matches!(
        name.trim().to_lowercase().as_str(),
        "project" | "gsd project" | "untitled" | ""
    )
}

/// Save the registry to disk. Creates parent directories if needed.
fn save(app: &tauri::AppHandle, registry: &Registry) -> Result<(), String> {
    let path = registry_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create registry dir: {e}"))?;
    }
    let json = serde_json::to_string_pretty(registry)
        .map_err(|e| format!("Failed to serialize registry: {e}"))?;
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write registry at {}: {e}", path.display()))
}

/// Add a project to the registry. If the path already exists, returns Ok without duplicating.
/// Validates that the path exists and contains a `.gsd/` directory.
pub fn add_project(
    app: &tauri::AppHandle,
    project_path: &str,
    description: Option<String>,
) -> Result<SavedProject, String> {
    let abs_path = fs::canonicalize(project_path)
        .map_err(|e| format!("Path does not exist: {project_path} ({e})"))?;

    // Strip the \\?\ UNC prefix Windows canonicalize adds — store clean paths
    let abs_str = {
        let s = abs_path.to_string_lossy().to_string();
        if s.starts_with(r"\\?\") { s[4..].to_string() } else { s }
    };

    // Validate it's a directory with .gsd/
    if !abs_path.is_dir() {
        return Err(format!("Not a directory: {abs_str}"));
    }
    if !abs_path.join(".gsd").is_dir() {
        return Err(format!(
            "Not a GSD project (no .gsd/ directory found): {abs_str}"
        ));
    }

    let mut registry = load(app)?;

    // Check for duplicate by normalized path
    if let Some(existing) = registry.projects.iter().find(|p| {
        normalize_path(&p.path) == normalize_path(&abs_str)
    }) {
        return Ok(existing.clone());
    }

    let dir_name = abs_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    // Try to read project name from .gsd/PROJECT.md title line
    let name = read_project_name(&abs_path).unwrap_or_else(|| dir_name.clone());

    let project = SavedProject {
        id: generate_id(),
        name,
        path: abs_str,
        description,
        added_at: now_iso(),
    };

    registry.projects.push(project.clone());
    save(app, &registry)?;

    Ok(project)
}

/// Update a project's name and/or description in the registry.
pub fn update_project(
    app: &tauri::AppHandle,
    project_id: &str,
    name: Option<String>,
    description: Option<String>,
) -> Result<SavedProject, String> {
    let mut registry = load(app)?;
    let project = registry
        .projects
        .iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {project_id}"))?;

    if let Some(n) = name {
        let trimmed = n.trim().to_string();
        if trimmed.is_empty() {
            return Err("Project name cannot be empty".to_string());
        }
        project.name = trimmed;
    }
    if let Some(d) = description {
        let trimmed = d.trim().to_string();
        project.description = if trimmed.is_empty() { None } else { Some(trimmed) };
    }

    let updated = project.clone();
    save(app, &registry)?;
    Ok(updated)
}

/// Remove a project from the registry by id.
pub fn remove_project(app: &tauri::AppHandle, project_id: &str) -> Result<(), String> {
    let mut registry = load(app)?;
    let before = registry.projects.len();
    registry.projects.retain(|p| p.id != project_id);
    if registry.projects.len() == before {
        return Err(format!("Project not found: {project_id}"));
    }
    save(app, &registry)
}

/// Convert registry entries to ProjectInfo for the frontend.
pub fn to_project_infos(registry: &Registry) -> Vec<ProjectInfo> {
    registry
        .projects
        .iter()
        .map(|p| ProjectInfo {
            id: p.id.clone(),
            name: p.name.clone(),
            path: p.path.clone(),
        })
        .collect()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Normalize path for comparison (lowercase on Windows, forward slashes).
fn normalize_path(p: &str) -> String {
    let s = p.replace('\\', "/");
    // Strip UNC prefix \\?\ that canonicalize adds on Windows
    let s = s.strip_prefix("//?/").unwrap_or(&s);
    s.to_lowercase()
}

/// Try to extract project name from the first `# ` heading in `.gsd/PROJECT.md`.
fn read_project_name(project_dir: &Path) -> Option<String> {
    let project_md = project_dir.join(".gsd").join("PROJECT.md");
    let content = fs::read_to_string(project_md).ok()?;
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(title) = trimmed.strip_prefix("# ") {
            let title = title.trim();
            // Reject GSD's generic default placeholder headings
            if title.is_empty()
                || title.eq_ignore_ascii_case("project")
                || title.eq_ignore_ascii_case("gsd project")
                || title.eq_ignore_ascii_case("untitled")
            {
                return None;
            }
            return Some(title.to_string());
        }
    }
    None
}

fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("proj_{ts:x}")
}

fn now_iso() -> String {
    // Simple ISO-ish timestamp without chrono dependency
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Just store as unix seconds — frontend can format
    format!("{secs}")
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_path() {
        assert_eq!(
            normalize_path(r"\\?\D:\Projects\my-app"),
            "d:/projects/my-app"
        );
        assert_eq!(
            normalize_path("D:\\Projects\\my-app"),
            "d:/projects/my-app"
        );
    }

    #[test]
    fn test_generate_id_is_unique() {
        let a = generate_id();
        std::thread::sleep(std::time::Duration::from_millis(2));
        let b = generate_id();
        assert_ne!(a, b);
    }

    #[test]
    fn test_registry_serde_roundtrip() {
        let reg = Registry {
            projects: vec![SavedProject {
                id: "proj_1".into(),
                name: "test".into(),
                path: "/tmp/test".into(),
                description: Some("A test project".into()),
                added_at: "1234567890".into(),
            }],
        };
        let json = serde_json::to_string(&reg).unwrap();
        let parsed: Registry = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.projects.len(), 1);
        assert_eq!(parsed.projects[0].name, "test");
    }
}
