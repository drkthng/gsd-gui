# S02: Headless query & file watcher

**Goal:** Rust modules for headless GSD state queries and `.gsd/` file watching, registered as Tauri commands/events, proven by unit tests.
**Demo:** `cargo test` passes for headless query parsing, file watcher debouncing, and both Tauri commands (`query_gsd_state`, `list_projects`) are registered. `gsd-file-changed` events emit on `.gsd/` changes.

## Must-Haves

- `QuerySnapshot` struct with `current_milestone`, `active_tasks`, `total_cost` fields matching the frontend `GsdState` interface in `gsd-client.ts`
- `query_gsd_state(project_path)` spawns `gsd headless query --project <path>` and parses JSON stdout into `QuerySnapshot`
- `list_projects(scan_path)` scans a directory for subdirectories containing `.gsd/` and returns `Vec<ProjectInfo>`
- `GsdFileWatcher` using notify-rs watches `.gsd/` directory for changes to STATE.md, metrics.json, and roadmap files
- File change events debounced (≤2s latency per milestone success criteria)
- Tauri commands `query_gsd_state` and `list_projects` registered in `lib.rs`
- `gsd-file-changed` Tauri event emitted on watched file changes
- All new code has unit tests (TDD per R008)

## Proof Level

- This slice proves: contract (Rust unit tests with mocked/short-lived processes and temp dirs)
- Real runtime required: no (tests use temp files and mock processes, not real GSD binary)
- Human/UAT required: no

## Verification

- `cd src-tauri && cargo test` — all existing 21 tests + new query/watcher tests pass
- `cargo test --lib gsd_query` — headless query tests pass (parse valid JSON, handle invalid JSON, handle missing binary)
- `cargo test --lib gsd_watcher` — file watcher tests pass (detects file creation, debounces rapid changes)
- `cargo test --lib gsd_query -- test_handle_invalid_json` — failure-path test confirms descriptive error on malformed JSON output

## Observability / Diagnostics

- **Query errors**: `run_headless_query()` returns structured `Err(String)` with context (binary path, exit code, stderr snippet) — surfaced to frontend via Tauri command error channel.
- **Watcher events**: `gsd-file-changed` Tauri events include `{ path, kind, timestamp }` payload — inspectable in browser devtools via Tauri event listener.
- **Binary resolution**: Reuses `resolve_gsd_binary()` from `gsd_resolve.rs` which logs the 3-tier resolution chain in its error messages.
- **Failure visibility**: All errors are descriptive strings, never silent failures. Missing binary, spawn failure, non-zero exit, invalid JSON, and directory scan errors each produce distinct error messages.
- **Redaction**: No secrets or credentials are involved in headless queries or file watching. Project paths are logged but contain no sensitive data.

## Integration Closure

- Upstream surfaces consumed: `gsd_resolve.rs` → `resolve_gsd_binary()`, `gsd_rpc.rs` → shared serde patterns
- New wiring introduced in this slice: `query_gsd_state` and `list_projects` Tauri commands, `gsd-file-changed` Tauri event
- What remains before the milestone is truly usable end-to-end: S03 wires React client to these commands, S05 hooks consume query data and file-change events

## Tasks

- [x] **T01: Implement headless query module with TDD** `est:1h`
  - Why: R013 requires `gsd headless query` for instant state snapshots. This task creates `gsd_query.rs` with `QuerySnapshot` struct, headless query execution, project scanning, and registers `query_gsd_state`/`list_projects` Tauri commands.
  - Files: `src-tauri/src/gsd_query.rs`, `src-tauri/src/lib.rs`
  - Do: Define `QuerySnapshot` (current_milestone, active_tasks, total_cost) and `ProjectInfo` (id, name, path) structs with serde. Implement `query_gsd_state()` that calls `resolve_gsd_binary()`, spawns `gsd headless query --project <path>`, reads stdout JSON, parses into `QuerySnapshot`. Implement `list_projects()` that scans a directory for subdirs containing `.gsd/`. Add both as `#[tauri::command]` in lib.rs. Write tests first: parse valid JSON output, handle invalid/empty output, handle spawn failure, scan directory with/without .gsd subdirs.
  - Verify: `cd src-tauri && cargo test --lib gsd_query` passes all tests
  - Done when: `QuerySnapshot` and `ProjectInfo` structs defined, `query_gsd_state` and `list_projects` Tauri commands registered, ≥5 new tests pass

- [x] **T02: Implement file watcher module with TDD** `est:1h`
  - Why: R014 requires watching `.gsd/` files for changes and emitting events. This task creates `gsd_watcher.rs` with notify-rs, debounce logic, and `gsd-file-changed` Tauri event emission.
  - Files: `src-tauri/Cargo.toml`, `src-tauri/src/gsd_watcher.rs`, `src-tauri/src/lib.rs`
  - Do: Add `notify = "7"` and `notify-debouncer-mini = "0.5"` to Cargo.toml. Implement `GsdFileWatcher` struct with `start(project_path, app_handle)` and `stop()`. Watch `<project>/.gsd/` for changes to STATE.md, metrics.json, and files matching `*-ROADMAP.md`. Debounce events to avoid flooding (500ms debounce window). Emit `gsd-file-changed` Tauri event with payload `{ path, kind, timestamp }`. Wire watcher state into `lib.rs` managed state. Write tests first: watcher detects file creation in temp dir, rapid changes are debounced, watcher can be stopped cleanly.
  - Verify: `cd src-tauri && cargo test --lib gsd_watcher` passes all tests
  - Done when: `GsdFileWatcher` implemented, `gsd-file-changed` events emitted on `.gsd/` changes, debounce works, ≥3 new tests pass, `cargo test` passes all tests (existing 21 + new)

## Files Likely Touched

- `src-tauri/src/gsd_query.rs` (new)
- `src-tauri/src/gsd_watcher.rs` (new)
- `src-tauri/src/lib.rs` (add modules, commands, managed state)
- `src-tauri/Cargo.toml` (add notify dependencies)
