use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;

// ---------------------------------------------------------------------------
// Event payload — emitted as `gsd-file-changed` Tauri event
// ---------------------------------------------------------------------------

/// Payload for `gsd-file-changed` events. Includes the changed file path,
/// the kind of change, and a Unix-epoch-ms timestamp.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GsdFileChangedPayload {
    pub path: String,
    pub kind: String,
    pub timestamp: u64,
}

// ---------------------------------------------------------------------------
// Relevant-file filter
// ---------------------------------------------------------------------------

/// Returns true if the file name matches one of the watched patterns:
/// STATE.md, metrics.json, or any file ending in -ROADMAP.md.
pub fn is_relevant_file(path: &Path) -> bool {
    let file_name = match path.file_name().and_then(|n| n.to_str()) {
        Some(name) => name,
        None => return false,
    };
    file_name == "STATE.md"
        || file_name == "metrics.json"
        || file_name.ends_with("-ROADMAP.md")
}

/// Convert a `notify::EventKind` into a human-readable string.
fn event_kind_label(kind: &EventKind) -> &'static str {
    match kind {
        EventKind::Create(_) => "create",
        EventKind::Modify(_) => "modify",
        EventKind::Remove(_) => "remove",
        EventKind::Access(_) => "access",
        EventKind::Any => "any",
        EventKind::Other => "other",
    }
}

/// Get the current Unix timestamp in milliseconds.
fn unix_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ---------------------------------------------------------------------------
// GsdFileWatcher — lifecycle wrapper around notify::RecommendedWatcher
// ---------------------------------------------------------------------------

/// Manages a filesystem watcher on a project's `.gsd/` directory.
/// Filters for relevant files, debounces rapid changes (500ms window),
/// and emits `gsd-file-changed` Tauri events.
pub struct GsdFileWatcher {
    /// Dropping this sender signals the debounce task to stop.
    _shutdown_tx: mpsc::Sender<()>,
    /// The underlying notify watcher. Dropped when GsdFileWatcher is dropped.
    _watcher: RecommendedWatcher,
}

impl std::fmt::Debug for GsdFileWatcher {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GsdFileWatcher").finish()
    }
}

impl GsdFileWatcher {
    /// Start watching `<project_path>/.gsd/` for relevant file changes.
    ///
    /// Events are debounced: after the first change, we wait 500ms for more
    /// changes before flushing a single batch of `gsd-file-changed` events.
    ///
    /// The `emit_fn` callback receives each `GsdFileChangedPayload` — in
    /// production this emits a Tauri event; in tests it pushes to a vec.
    pub fn start<F>(project_path: &str, emit_fn: F) -> Result<Self, String>
    where
        F: Fn(GsdFileChangedPayload) + Send + Sync + 'static,
    {
        let gsd_dir = PathBuf::from(project_path).join(".gsd");
        if !gsd_dir.is_dir() {
            return Err(format!(
                "Cannot watch: .gsd/ directory not found at '{}'",
                gsd_dir.display()
            ));
        }

        let (event_tx, mut event_rx) = mpsc::unbounded_channel::<(PathBuf, EventKind)>();
        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);

        // Create the notify watcher — sends filtered events to the channel
        let tx = event_tx.clone();
        let mut watcher = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    for path in &event.paths {
                        if is_relevant_file(path) {
                            let _ = tx.send((path.clone(), event.kind));
                        }
                    }
                }
            },
            Config::default(),
        )
        .map_err(|e| format!("Failed to create file watcher: {}", e))?;

        watcher
            .watch(&gsd_dir, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch '{}': {}", gsd_dir.display(), e))?;

        // Spawn debounce task — collects events for 500ms of quiet, then flushes
        let emit = Arc::new(emit_fn);
        tokio::spawn(async move {
            let debounce_ms = 500u64;
            let mut pending: HashSet<PathBuf> = HashSet::new();
            let mut pending_kind: std::collections::HashMap<PathBuf, EventKind> =
                std::collections::HashMap::new();

            loop {
                if pending.is_empty() {
                    // Wait for the first event or shutdown
                    tokio::select! {
                        Some((path, kind)) = event_rx.recv() => {
                            pending.insert(path.clone());
                            pending_kind.insert(path, kind);
                        }
                        _ = shutdown_rx.recv() => break,
                    }
                } else {
                    // Drain more events within the debounce window
                    let deadline =
                        tokio::time::sleep(Duration::from_millis(debounce_ms));
                    tokio::pin!(deadline);

                    loop {
                        tokio::select! {
                            Some((path, kind)) = event_rx.recv() => {
                                pending.insert(path.clone());
                                pending_kind.insert(path, kind);
                            }
                            _ = &mut deadline => break,
                            _ = shutdown_rx.recv() => {
                                // Flush remaining then exit
                                Self::flush(&pending, &pending_kind, &emit);
                                return;
                            }
                        }
                    }

                    // Debounce window expired — flush
                    Self::flush(&pending, &pending_kind, &emit);
                    pending.clear();
                    pending_kind.clear();
                }
            }
        });

        Ok(GsdFileWatcher {
            _shutdown_tx: shutdown_tx,
            _watcher: watcher,
        })
    }

    /// Emit one payload per unique path in the pending set.
    fn flush<F>(
        pending: &HashSet<PathBuf>,
        kinds: &std::collections::HashMap<PathBuf, EventKind>,
        emit: &Arc<F>,
    ) where
        F: Fn(GsdFileChangedPayload),
    {
        let ts = unix_timestamp_ms();
        for path in pending {
            let kind_label = kinds
                .get(path)
                .map(event_kind_label)
                .unwrap_or("unknown");
            emit(GsdFileChangedPayload {
                path: path.to_string_lossy().to_string(),
                kind: kind_label.to_string(),
                timestamp: ts,
            });
        }
    }

    /// Stop the watcher by dropping it. The notify watcher and debounce
    /// task are cleaned up when `GsdFileWatcher` is dropped (the shutdown
    /// channel closes, and the watcher handle is dropped).
    pub fn stop(self) {
        // Consuming self triggers Drop on _watcher and _shutdown_tx
        drop(self);
    }

    /// Start watching and emit Tauri events via `app_handle.emit()`.
    /// This is the production entry point.
    #[allow(dead_code)]
    pub fn start_tauri(
        project_path: &str,
        app_handle: tauri::AppHandle,
    ) -> Result<Self, String> {
        use tauri::Emitter;
        Self::start(project_path, move |payload| {
            let _ = app_handle.emit("gsd-file-changed", payload);
        })
    }
}

// ---------------------------------------------------------------------------
// Tests (written first per TDD / R008)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::{Arc, Mutex as StdMutex};

    /// Helper: create a temp dir with a `.gsd/` subdirectory.
    fn make_test_dir() -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "gsd_watcher_test_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(dir.join(".gsd")).unwrap();
        dir
    }

    /// Helper: create a callback that pushes events into a shared vec.
    fn make_collector() -> (
        Arc<StdMutex<Vec<GsdFileChangedPayload>>>,
        impl Fn(GsdFileChangedPayload) + Send + Sync + 'static,
    ) {
        let events: Arc<StdMutex<Vec<GsdFileChangedPayload>>> =
            Arc::new(StdMutex::new(Vec::new()));
        let events_clone = events.clone();
        let cb = move |payload: GsdFileChangedPayload| {
            events_clone.lock().unwrap().push(payload);
        };
        (events, cb)
    }

    // -- is_relevant_file tests --

    #[test]
    fn test_relevant_file_state_md() {
        assert!(is_relevant_file(Path::new("/project/.gsd/STATE.md")));
    }

    #[test]
    fn test_relevant_file_metrics_json() {
        assert!(is_relevant_file(Path::new("/project/.gsd/metrics.json")));
    }

    #[test]
    fn test_relevant_file_roadmap() {
        assert!(is_relevant_file(Path::new(
            "/project/.gsd/M001-ROADMAP.md"
        )));
        assert!(is_relevant_file(Path::new(
            "/project/.gsd/milestones/M002-ROADMAP.md"
        )));
    }

    #[test]
    fn test_irrelevant_file_ignored() {
        assert!(!is_relevant_file(Path::new("/project/.gsd/DECISIONS.md")));
        assert!(!is_relevant_file(Path::new("/project/.gsd/random.txt")));
        assert!(!is_relevant_file(Path::new("/project/.gsd/state.md"))); // case-sensitive
    }

    // -- GsdFileWatcher integration tests --

    #[tokio::test]
    async fn test_watcher_detects_file_creation() {
        let dir = make_test_dir();
        let (events, cb) = make_collector();

        let watcher = GsdFileWatcher::start(dir.to_str().unwrap(), cb)
            .expect("Watcher should start successfully");

        // Give the watcher time to set up
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Create a relevant file
        let state_file = dir.join(".gsd").join("STATE.md");
        fs::write(&state_file, "# State").unwrap();

        // Wait for debounce (500ms) + buffer
        tokio::time::sleep(Duration::from_millis(1500)).await;

        let captured = events.lock().unwrap();
        assert!(
            !captured.is_empty(),
            "Watcher should detect STATE.md creation"
        );
        let ev = &captured[0];
        assert!(
            ev.path.contains("STATE.md"),
            "Event path should contain STATE.md, got: {}",
            ev.path
        );
        assert!(ev.timestamp > 0, "Timestamp should be set");

        drop(captured);
        watcher.stop();
        let _ = fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_watcher_filters_irrelevant_files() {
        let dir = make_test_dir();
        let (events, cb) = make_collector();

        let watcher = GsdFileWatcher::start(dir.to_str().unwrap(), cb)
            .expect("Watcher should start");

        tokio::time::sleep(Duration::from_millis(100)).await;

        // Create an irrelevant file — should NOT trigger an event
        fs::write(dir.join(".gsd").join("DECISIONS.md"), "# Decisions").unwrap();

        tokio::time::sleep(Duration::from_millis(1500)).await;

        let captured = events.lock().unwrap();
        assert!(
            captured.is_empty(),
            "Irrelevant files should not trigger events, got: {:?}",
            captured.iter().map(|e| &e.path).collect::<Vec<_>>()
        );

        drop(captured);
        watcher.stop();
        let _ = fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_watcher_debounces_rapid_changes() {
        let dir = make_test_dir();
        let (events, cb) = make_collector();

        let watcher = GsdFileWatcher::start(dir.to_str().unwrap(), cb)
            .expect("Watcher should start");

        tokio::time::sleep(Duration::from_millis(100)).await;

        // Write to STATE.md multiple times rapidly
        let state_file = dir.join(".gsd").join("STATE.md");
        for i in 0..5 {
            fs::write(&state_file, format!("# State v{}", i)).unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;
        }

        // Wait for debounce to flush
        tokio::time::sleep(Duration::from_millis(1500)).await;

        let captured = events.lock().unwrap();
        // Debounce should collapse 5 rapid writes into a small number of events
        // (ideally 1, but at most 2 if timing splits across debounce windows)
        assert!(
            captured.len() <= 2,
            "Debounce should collapse rapid changes, got {} events",
            captured.len()
        );
        assert!(
            !captured.is_empty(),
            "Should still emit at least one event"
        );

        drop(captured);
        watcher.stop();
        let _ = fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_watcher_stops_cleanly() {
        let dir = make_test_dir();
        let (events, cb) = make_collector();

        let watcher = GsdFileWatcher::start(dir.to_str().unwrap(), cb)
            .expect("Watcher should start");

        // Stop immediately
        watcher.stop();

        // Write after stop — should not trigger events
        tokio::time::sleep(Duration::from_millis(100)).await;
        let state_file = dir.join(".gsd").join("STATE.md");
        fs::write(&state_file, "# After stop").unwrap();
        tokio::time::sleep(Duration::from_millis(1000)).await;

        let captured = events.lock().unwrap();
        assert!(
            captured.is_empty(),
            "No events should be emitted after stop, got: {}",
            captured.len()
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_watcher_fails_on_missing_gsd_dir() {
        let dir = std::env::temp_dir().join("gsd_watcher_no_gsd");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        // No .gsd/ subdirectory
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        let result = rt.block_on(async {
            GsdFileWatcher::start(dir.to_str().unwrap(), |_| {})
        });

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("not found"),
            "Error should mention missing .gsd/ dir: {}",
            err
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn test_watcher_detects_roadmap_file() {
        let dir = make_test_dir();
        let (events, cb) = make_collector();

        let watcher = GsdFileWatcher::start(dir.to_str().unwrap(), cb)
            .expect("Watcher should start");

        tokio::time::sleep(Duration::from_millis(100)).await;

        // Create a roadmap file
        fs::write(
            dir.join(".gsd").join("M001-ROADMAP.md"),
            "# Roadmap",
        )
        .unwrap();

        tokio::time::sleep(Duration::from_millis(1500)).await;

        let captured = events.lock().unwrap();
        assert!(
            !captured.is_empty(),
            "Watcher should detect *-ROADMAP.md creation"
        );
        assert!(
            captured[0].path.contains("ROADMAP.md"),
            "Event path should contain ROADMAP.md, got: {}",
            captured[0].path
        );

        drop(captured);
        watcher.stop();
        let _ = fs::remove_dir_all(&dir);
    }

    // -- Payload serialization test --

    #[test]
    fn test_payload_serializes_camel_case() {
        let payload = GsdFileChangedPayload {
            path: "/test/STATE.md".to_string(),
            kind: "modify".to_string(),
            timestamp: 1234567890,
        };
        let json = serde_json::to_string(&payload).unwrap();
        // All field names are single-word, but verify round-trip
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["path"], "/test/STATE.md");
        assert_eq!(parsed["kind"], "modify");
        assert_eq!(parsed["timestamp"], 1234567890u64);
    }
}
