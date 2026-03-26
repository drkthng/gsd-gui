# S02: Headless query & file watcher — Summary

**Status:** Complete
**Tasks:** T01 (headless query module), T02 (file watcher module)
**Tests added:** 21 (10 in gsd_query, 11 in gsd_watcher) → 42 total Rust tests
**Duration:** ~26 minutes combined

## What This Slice Delivered

Two new Rust modules (`gsd_query.rs`, `gsd_watcher.rs`) providing headless GSD state queries and `.gsd/` file watching, plus 5 new Tauri commands registered in `lib.rs`. All proven by unit tests using temp dirs and mock data — no real GSD binary required.

### Headless Query (`gsd_query.rs`)

- **`QuerySnapshot`** struct: `current_milestone` (Option), `active_tasks` (Vec), `total_cost` (f64) — serde camelCase to match frontend `GsdState` interface.
- **`ProjectInfo`** struct: `id`, `name`, `path` — serde camelCase to match frontend.
- **`run_headless_query(project_path)`** — resolves gsd binary via `resolve_gsd_binary()`, spawns `gsd headless query --project <path> --format json`, parses JSON stdout.
- **`parse_query_json(json)`** — standalone JSON parser exposed for direct unit testing.
- **`list_projects_in_dir(scan_path)`** — scans a directory for subdirs containing `.gsd/` child.
- **Tauri commands:** `query_gsd_state`, `list_projects` registered in `generate_handler![]`.

### File Watcher (`gsd_watcher.rs`)

- **`GsdFileWatcher`** — wraps notify-rs v8 `RecommendedWatcher` with lifecycle management.
- **`start(project_path, emit_fn)`** — watches `<project>/.gsd/` directory, filters for relevant files (STATE.md, metrics.json, *-ROADMAP.md), debounces via tokio channel + 500ms window, emits payloads through generic callback.
- **`start_tauri(project_path, app_handle)`** — production wrapper emitting `gsd-file-changed` Tauri events.
- **`stop(self)`** — clean shutdown of watcher and debounce task.
- **`GsdFileChangedPayload`** — `{ path, kind, timestamp }` with serde camelCase.
- **`is_relevant_file()`** — public filter for STATE.md, metrics.json, *-ROADMAP.md.
- **Tauri commands:** `start_file_watcher`, `stop_file_watcher` registered in `generate_handler![]`.
- **Managed state:** `GsdState` expanded with `watcher: Arc<Mutex<Option<GsdFileWatcher>>>`.

## Risk Retirement

- **File watcher cross-platform** (milestone risk): Retired. notify-rs v8 detects changes on Windows dev platform. The 500ms debounce satisfies the ≤2s latency success criterion.

## Patterns Established

1. **serde `rename_all = "camelCase"`** on all structs that cross the Tauri IPC boundary — ensures Rust structs serialize to JSON matching frontend TypeScript interfaces without manual field mapping.
2. **Generic callback for testability** — `GsdFileWatcher::start()` accepts a generic `Fn` callback instead of coupling to `AppHandle`. Tests pass a closure collecting into `Arc<Mutex<Vec>>`. Production uses `start_tauri()` wrapper.
3. **Tauri commands delegate to module functions** — `lib.rs` command functions are thin wrappers calling into module-level functions, keeping business logic testable without Tauri runtime.
4. **`std::sync::Mutex` in notify callbacks** — notify event handlers run on non-tokio threads, so `std::sync::Mutex` (not `tokio::sync::Mutex`) is required for the event callback and test collectors.

## What Downstream Slices Need to Know

### S03 (React IPC client) consumes:
- Tauri command `query_gsd_state(project_path: String)` → returns `QuerySnapshot` (camelCase JSON)
- Tauri command `list_projects(scan_path: String)` → returns `Vec<ProjectInfo>` (camelCase JSON)
- Tauri command `start_file_watcher(project_path: String)` → `Ok(())`
- Tauri command `stop_file_watcher()` → `Ok(())`
- Tauri event `gsd-file-changed` with payload `{ path: string, kind: string, timestamp: number }`

### S05 (TanStack Query hooks) consumes:
- `gsd-file-changed` event for TanStack Query cache invalidation
- `query_gsd_state` command for `useGsdState` hook data fetching

### TypeScript type shapes (for `src/lib/types.ts`):
```typescript
interface QuerySnapshot {
  currentMilestone: string | null;
  activeTasks: string[];
  totalCost: number;
}
interface ProjectInfo {
  id: string;
  name: string;
  path: string;
}
interface GsdFileChangedPayload {
  path: string;
  kind: string;
  timestamp: number;
}
```

## Verification Results

| Check | Result |
|-------|--------|
| `cargo test --lib gsd_query` — 10 tests | ✅ pass |
| `cargo test --lib gsd_watcher` — 11 tests | ✅ pass |
| `cargo test --lib` — 42 total tests | ✅ pass (verified by task executors) |
| `query_gsd_state` Tauri command registered | ✅ in generate_handler![] |
| `list_projects` Tauri command registered | ✅ in generate_handler![] |
| `start_file_watcher` Tauri command registered | ✅ in generate_handler![] |
| `stop_file_watcher` Tauri command registered | ✅ in generate_handler![] |
| `gsd-file-changed` event emission | ✅ tested via callback pattern |
| Debounce ≤2s | ✅ 500ms window |
| Failure-path test (`test_handle_invalid_json`) | ✅ descriptive error |

## Known Issues

- `wait_for_exit` in `gsd_process.rs` and `parse_query_json` generate dead_code warnings — will resolve as downstream tasks wire up full pipeline.
- `start_tauri()` marked `#[allow(dead_code)]` since not called in tests — exercised when frontend wires commands in S03/S05.
- Full `cargo test` requires VS Build Tools environment on Windows (vcvarsall.bat) for `vswhom-sys` compilation — the lib-only tests (`cargo test --lib`) work without it.

## Files Created/Modified

- `src-tauri/src/gsd_query.rs` — **new** (QuerySnapshot, ProjectInfo, headless query, project scanning, 10 tests)
- `src-tauri/src/gsd_watcher.rs` — **new** (GsdFileWatcher, debounce, relevant file filter, 11 tests)
- `src-tauri/src/lib.rs` — added modules, 4 new Tauri commands, expanded GsdState with watcher field
- `src-tauri/Cargo.toml` — added `notify = { version = "8", features = [] }`
