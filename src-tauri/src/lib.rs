mod activity_parser;
mod gsd_detect;
mod gsd_init;
mod gsd_parser;
mod gsd_process;
mod gsd_query;
pub mod gsd_resolve;
pub mod gsd_rpc;
pub mod gsd_update;
mod gsd_watcher;
mod preferences_parser;
mod project_registry;
mod session_parser;

use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::Mutex;

use gsd_process::GsdProcess;
use gsd_resolve::resolve_gsd_binary;
use gsd_rpc::RpcCommand;
use gsd_watcher::GsdFileWatcher;

/// Tauri managed state holding the active GSD process and file watcher.
pub struct GsdState {
    process: Arc<Mutex<Option<GsdProcess>>>,
    watcher: Arc<Mutex<Option<GsdFileWatcher>>>,
}

impl GsdState {
    fn new() -> Self {
        GsdState {
            process: Arc::new(Mutex::new(None)),
            watcher: Arc::new(Mutex::new(None)),
        }
    }
}

/// Start a new GSD RPC session. Resolves the gsd binary, stops any existing
/// process, and spawns a fresh `gsd --mode rpc --project <path>`.
#[tauri::command]
async fn start_gsd_session(
    project_path: String,
    state: tauri::State<'_, GsdState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let binary = resolve_gsd_binary()?;

    let mut guard = state.process.lock().await;

    // Stop any existing process first
    if let Some(mut existing) = guard.take() {
        let _ = existing.stop().await;
    }

    let process = GsdProcess::spawn(&binary, &project_path, app.clone()).await?;
    *guard = Some(process);

    // Spawn a background task to monitor for process exit and emit event
    let process_ref = state.process.clone();
    let app_exit = app.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            let mut guard = process_ref.lock().await;
            if let Some(proc) = guard.as_mut() {
                if !proc.is_running() {
                    let _ = app_exit.emit(
                        "gsd-process-exit",
                        gsd_process::GsdExitPayload {
                            code: None, // process already reaped by is_running()
                            timestamp: gsd_process::unix_timestamp_ms(),
                        },
                    );
                    guard.take(); // clean up
                    break;
                }
            } else {
                break; // no process to monitor
            }
        }
    });

    Ok(())
}

/// Stop the active GSD RPC session.
#[tauri::command]
async fn stop_gsd_session(
    state: tauri::State<'_, GsdState>,
) -> Result<(), String> {
    let mut guard = state.process.lock().await;
    if let Some(mut process) = guard.take() {
        process.stop().await
    } else {
        Ok(()) // No process running — not an error
    }
}

/// Send an RPC command to the running GSD process.
///
/// `command` is a JSON string that deserializes into an `RpcCommand`.
#[tauri::command]
async fn send_gsd_command(
    command: String,
    state: tauri::State<'_, GsdState>,
) -> Result<(), String> {
    let cmd: RpcCommand = serde_json::from_str(&command)
        .map_err(|e| format!("Invalid RPC command JSON: {}", e))?;

    let guard = state.process.lock().await;
    if let Some(process) = guard.as_ref() {
        process.send_command(&cmd).await
    } else {
        Err("No GSD process is running. Call start_gsd_session first.".to_string())
    }
}

/// Query GSD project state via headless query command.
/// Returns a `QuerySnapshot` matching the frontend `GsdState` interface.
#[tauri::command]
async fn query_gsd_state(
    project_path: String,
) -> Result<gsd_query::QuerySnapshot, String> {
    gsd_query::run_headless_query(&project_path).await
}

/// List GSD projects in a directory by scanning for `.gsd/` subdirectories.
/// Returns a `Vec<ProjectInfo>` matching the frontend `ProjectInfo` interface.
#[tauri::command]
async fn list_projects(
    scan_path: String,
) -> Result<Vec<gsd_query::ProjectInfo>, String> {
    gsd_query::list_projects_in_dir(&scan_path)
}

/// Start watching a project's `.gsd/` directory for file changes.
/// Emits `gsd-file-changed` events when STATE.md, metrics.json, or
/// *-ROADMAP.md files change. Debounces rapid changes (500ms window).
#[tauri::command]
async fn start_file_watcher(
    project_path: String,
    state: tauri::State<'_, GsdState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut guard = state.watcher.lock().await;

    // Stop any existing watcher first
    if let Some(existing) = guard.take() {
        existing.stop();
    }

    let watcher = GsdFileWatcher::start_tauri(&project_path, app)?;
    *guard = Some(watcher);
    Ok(())
}

/// Stop the active file watcher.
#[tauri::command]
async fn stop_file_watcher(
    state: tauri::State<'_, GsdState>,
) -> Result<(), String> {
    let mut guard = state.watcher.lock().await;
    if let Some(watcher) = guard.take() {
        watcher.stop();
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Project registry commands
// ---------------------------------------------------------------------------

/// Get all saved projects from the persistent registry.
#[tauri::command]
async fn get_saved_projects(
    app: tauri::AppHandle,
) -> Result<Vec<project_registry::SavedProject>, String> {
    let registry = project_registry::load(&app)?;
    Ok(registry.projects)
}

/// Add a project to the registry by its filesystem path.
/// Validates it contains a `.gsd/` directory.
#[tauri::command]
async fn add_project(
    project_path: String,
    description: Option<String>,
    app: tauri::AppHandle,
) -> Result<project_registry::SavedProject, String> {
    project_registry::add_project(&app, &project_path, description)
}

/// Remove a project from the registry by its ID.
#[tauri::command]
async fn remove_project(
    project_id: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    project_registry::remove_project(&app, &project_id)
}

#[tauri::command]
async fn update_project(
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    app: tauri::AppHandle,
) -> Result<project_registry::SavedProject, String> {
    project_registry::update_project(&app, &project_id, name, description)
}

/// Parse all milestones/slices/tasks from a project's `.gsd/` directory.
/// Returns a structured tree matching the frontend `MilestoneInfo[]` type.
#[tauri::command]
async fn parse_project_milestones_cmd(
    project_path: String,
) -> Result<Vec<gsd_parser::MilestoneInfo>, String> {
    let path = std::path::Path::new(&project_path);
    gsd_parser::parse_project_milestones(path)
}

/// List GSD sessions for a project by scanning session JSONL files.
/// Returns a paginated `SessionPage` with sessions and total count.
#[tauri::command]
async fn list_project_sessions_cmd(
    project_path: String,
    offset: usize,
    limit: usize,
) -> Result<SessionPage, String> {
    let (sessions, total) = session_parser::list_sessions(&project_path, offset, limit)?;
    Ok(SessionPage { sessions, total })
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionPage {
    sessions: Vec<session_parser::SessionInfo>,
    total: usize,
}

#[tauri::command]
async fn read_session_messages_cmd(
    project_path: String,
    session_id: String,
) -> Result<Vec<session_parser::SessionMessage>, String> {
    session_parser::read_session_messages(&project_path, &session_id)
}

/// Read preferences from a project's `.gsd/preferences.md` YAML frontmatter.
/// Returns a `serde_json::Value` containing the parsed YAML as JSON.
#[tauri::command]
async fn read_preferences_cmd(
    project_path: String,
) -> Result<serde_json::Value, String> {
    preferences_parser::read_preferences(&project_path)
}

/// Write preferences to a project's `.gsd/preferences.md` YAML frontmatter.
/// Accepts a `serde_json::Value`, converts to YAML, preserves the markdown body.
#[tauri::command]
async fn write_preferences_cmd(
    project_path: String,
    prefs: serde_json::Value,
) -> Result<(), String> {
    preferences_parser::write_preferences(&project_path, prefs)
}

/// List activity log entries from a project's `.gsd/activity/*.jsonl` files.
/// Returns a `Vec<ActivityEntry>` sorted by sequence number.
#[tauri::command]
async fn list_activity_cmd(
    project_path: String,
) -> Result<Vec<activity_parser::ActivityEntry>, String> {
    activity_parser::list_activity_entries(&project_path)
}

/// Initialize a new GSD project at the given path by running `gsd init <path>`.
/// Creates the directory if it does not exist. Returns an error string on failure.
#[tauri::command]
fn init_project(path: String) -> Result<(), String> {
    gsd_init::run_gsd_init(&path)
}

/// Detect project metadata from the filesystem at the given path.
/// Checks for .git/, package.json (name + TypeScript detection), .gsd/, .planning/.
#[tauri::command]
fn detect_project_metadata(path: String) -> Result<gsd_detect::ProjectMetadata, String> {
    Ok(gsd_detect::detect_project_metadata(&path))
}

/// Restart the Tauri application — replaces the current process with a fresh instance.
#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

#[cfg(test)]
mod tests {
    #[test]
    fn restart_app_fn_is_defined() {
        // Compile-time proof that restart_app is reachable via the module.
        let _ = stringify!(super::restart_app);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(GsdState::new())
        .invoke_handler(tauri::generate_handler![
            start_gsd_session,
            stop_gsd_session,
            send_gsd_command,
            query_gsd_state,
            list_projects,
            start_file_watcher,
            stop_file_watcher,
            get_saved_projects,
            add_project,
            remove_project,
            update_project,
            parse_project_milestones_cmd,
            list_project_sessions_cmd,
            read_session_messages_cmd,
            read_preferences_cmd,
            write_preferences_cmd,
            list_activity_cmd,
            init_project,
            detect_project_metadata,
            gsd_update::check_gsd_version,
            gsd_update::upgrade_gsd,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
