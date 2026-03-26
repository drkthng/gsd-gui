---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T02: Implement file watcher module with TDD

**Slice:** S02 — Headless query & file watcher
**Milestone:** M002

## Description

Create `gsd_watcher.rs` using notify-rs to watch a project's `.gsd/` directory for changes to key files (STATE.md, metrics.json, *-ROADMAP.md). Debounce rapid changes and emit `gsd-file-changed` Tauri events. Wire watcher lifecycle into `lib.rs` managed state.

This satisfies R014: "The Tauri backend must watch .gsd/STATE.md, metrics.json, and roadmap files for changes and emit events." The milestone success criteria requires changes to push updates within 2 seconds — the 500ms debounce window satisfies this.

## Steps

1. **Add dependencies to `Cargo.toml`** — add `notify = "7"` and `notify-debouncer-mini = "0.5"` (or just `notify` with manual debounce using tokio::time). Check latest compatible versions. The `notify` crate provides cross-platform filesystem watching (uses ReadDirectoryChangesW on Windows, inotify on Linux, kqueue on macOS).

2. **Write tests in `gsd_watcher.rs`** — test that file creation in a watched temp dir triggers a callback. Test that the watcher filters for relevant files (STATE.md, metrics.json, *-ROADMAP.md). Test that the watcher can be stopped cleanly. Use `tempfile` or `std::env::temp_dir()` for filesystem tests and `tokio::time::timeout` to bound test duration.

3. **Define structs and event payload** — `GsdFileChangedPayload { path: String, kind: String, timestamp: u64 }` with serde Serialize. `GsdFileWatcher` struct holding a `notify::RecommendedWatcher` and a stop mechanism (e.g., dropping the watcher or a oneshot channel).

4. **Implement `GsdFileWatcher`** — `start(project_path, app_handle)` creates a watcher on `<project>/.gsd/`, filters events to relevant files, debounces via tokio channel + `tokio::time::sleep` (500ms window), emits `gsd-file-changed` Tauri event. `stop()` drops the watcher. Use `notify::EventKind::Modify` and `Create` events. For the debounce: collect events into a HashSet of paths, flush after 500ms of quiet.

5. **Wire into `lib.rs`** — add `mod gsd_watcher;`, add `GsdFileWatcher` to `GsdState` (or a new `WatcherState`), optionally add a `start_file_watcher` / `stop_file_watcher` Tauri command pair (or start the watcher automatically when `start_gsd_session` is called — decide based on what's cleanest). Register any new commands.

## Must-Haves

- [ ] `notify` dependency added to Cargo.toml
- [ ] `GsdFileWatcher` struct with `start()` and `stop()` lifecycle
- [ ] Watches `<project>/.gsd/` for STATE.md, metrics.json, *-ROADMAP.md changes
- [ ] Events debounced with ≤500ms window
- [ ] `gsd-file-changed` Tauri event emitted with path, kind, timestamp payload
- [ ] Watcher state managed in `lib.rs`
- [ ] ≥3 unit tests written before implementation code (TDD)

## Verification

- `cd src-tauri && cargo test --lib gsd_watcher` — all watcher tests pass
- `cd src-tauri && cargo test` — all existing tests (21 + T01's new tests) + watcher tests pass (no regressions)

## Observability Impact

- Signals added: `gsd-file-changed` Tauri event with `{ path, kind, timestamp }` — downstream consumers (S05 hooks) use this to invalidate caches
- How a future agent inspects this: listen for `gsd-file-changed` events via Tauri `listen()`, check watcher state via managed state
- Failure state exposed: watcher start failure returns descriptive error string; silent watcher death requires monitoring (could add heartbeat later)

## Inputs

- `src-tauri/src/lib.rs` — existing managed state pattern (`GsdState`), Tauri command registration (as modified by T01)
- `src-tauri/src/gsd_query.rs` — T01's output, needed to verify no regressions
- `src-tauri/Cargo.toml` — existing dependencies to extend

## Expected Output

- `src-tauri/Cargo.toml` — updated with notify dependency
- `src-tauri/src/gsd_watcher.rs` — new module with GsdFileWatcher, debounce logic, event emission, and tests
- `src-tauri/src/lib.rs` — updated with `mod gsd_watcher`, watcher state management, optional start/stop commands
