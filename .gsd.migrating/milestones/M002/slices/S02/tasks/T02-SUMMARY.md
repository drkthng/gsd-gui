---
id: T02
parent: S02
milestone: M002
provides:
  - GsdFileWatcher struct with start()/stop() lifecycle for .gsd/ directory watching
  - GsdFileChangedPayload struct with path, kind, timestamp fields (serde camelCase)
  - is_relevant_file() filter for STATE.md, metrics.json, *-ROADMAP.md
  - Debounced event emission (500ms window) via tokio channels
  - start_file_watcher and stop_file_watcher Tauri commands registered in lib.rs
  - gsd-file-changed Tauri event emission on watched file changes
key_files:
  - src-tauri/src/gsd_watcher.rs
  - src-tauri/src/lib.rs
  - src-tauri/Cargo.toml
key_decisions:
  - Used notify v8 (latest stable) instead of v7 as task plan suggested — v8 is current stable with same MSRV
  - Used generic emit_fn callback in GsdFileWatcher::start() instead of coupling directly to AppHandle — enables unit testing without Tauri runtime
  - Implemented manual debounce via tokio channels + sleep rather than notify-debouncer-mini — avoids extra dependency and gives more control over flush behavior
patterns_established:
  - Generic callback pattern for testability — production code uses start_tauri() wrapper, tests pass a closure that pushes to Arc<StdMutex<Vec>>
  - std::sync::Mutex (not tokio::sync::Mutex) in synchronous notify callbacks and test collectors — notify event handlers run on a non-tokio thread
observability_surfaces:
  - gsd-file-changed Tauri event with { path, kind, timestamp } payload — inspectable via Tauri listen() in browser devtools
  - Watcher start failure returns descriptive error string including .gsd/ path
  - is_relevant_file() is public for direct testing of file filter logic
duration: 14m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T02: Implement file watcher module with TDD

**Added gsd_watcher.rs with notify-rs file watcher, 500ms debounce, relevant-file filtering, and 11 unit tests — watcher state and start/stop commands registered in lib.rs**

## What Happened

Created `src-tauri/src/gsd_watcher.rs` with TDD approach (tests written alongside implementation):

1. **Dependencies** — Added `notify = "8"` to Cargo.toml (v8.2.0, latest stable matching our MSRV 1.77).

2. **GsdFileChangedPayload** — `{ path: String, kind: String, timestamp: u64 }` with `#[serde(rename_all = "camelCase")]` for Tauri event emission.

3. **is_relevant_file()** — Public filter function matching STATE.md, metrics.json, and *-ROADMAP.md file names (case-sensitive).

4. **GsdFileWatcher** — Core struct wrapping `notify::RecommendedWatcher` with:
   - `start(project_path, emit_fn)` — Creates watcher on `<project>/.gsd/`, filters events through `is_relevant_file()`, debounces via tokio unbounded channel + 500ms sleep window, emits payloads through generic callback.
   - `start_tauri(project_path, app_handle)` — Production wrapper that emits `gsd-file-changed` Tauri events.
   - `stop(self)` — Consumes the watcher, dropping both the notify watcher and shutdown channel.

5. **Debounce logic** — Events collected into a HashSet of paths. After 500ms of quiet (no new events), the batch is flushed as individual payloads. This satisfies the ≤2s latency requirement from the milestone success criteria.

6. **lib.rs integration** — Added `mod gsd_watcher`, expanded `GsdState` with `watcher: Arc<Mutex<Option<GsdFileWatcher>>>`, added `start_file_watcher` and `stop_file_watcher` Tauri commands registered in `generate_handler![]`.

7. **11 unit tests** — 4 filter tests (STATE.md, metrics.json, *-ROADMAP.md, irrelevant files), 4 integration tests (detects file creation, filters irrelevant, debounces rapid changes, stops cleanly), 1 error test (missing .gsd/ dir), 1 roadmap detection test, 1 payload serialization test.

## Verification

- `cargo test --lib gsd_watcher` — 11 tests pass
- `cargo test --lib gsd_query` — 10 tests pass (no regression)
- `cargo test --lib` — 42 total tests pass (31 existing + 11 new)
- `cargo test --lib gsd_query -- test_handle_invalid_json` — failure-path test passes

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test --lib gsd_watcher` | 0 | ✅ pass | 2.7s |
| 2 | `cargo test --lib gsd_query` | 0 | ✅ pass | 0.01s |
| 3 | `cargo test --lib` | 0 | ✅ pass | 2.8s |
| 4 | `cargo test --lib gsd_query -- test_handle_invalid_json` | 0 | ✅ pass | 0.01s |

## Diagnostics

- **Event inspection**: `gsd-file-changed` Tauri events include `{ path, kind, timestamp }` — listen via `window.__TAURI__.event.listen('gsd-file-changed', console.log)` in devtools.
- **Filter verification**: `is_relevant_file()` is public and directly testable — 4 unit tests cover positive and negative cases.
- **Error paths**: Missing `.gsd/` directory produces `"Cannot watch: .gsd/ directory not found at '...'"`. Watcher creation failure includes the notify error. Both surfaced via Tauri command error channel.
- **Lifecycle**: Dropping `GsdFileWatcher` cleanly shuts down both the notify watcher and the debounce task (via channel close).

## Deviations

- Used `notify = "8"` instead of `"7"` — v8.2.0 is the current stable release with matching MSRV.
- Skipped `notify-debouncer-mini` dependency — implemented manual debounce via tokio channels for better control and fewer dependencies.
- Added `start_file_watcher` / `stop_file_watcher` as explicit Tauri commands rather than auto-starting in `start_gsd_session` — cleaner lifecycle management, and downstream S05 hooks can control watcher timing.

## Known Issues

- `wait_for_exit` in `gsd_process.rs` generates a dead_code warning — not introduced by this task, pre-existing.
- The `start_tauri()` method is marked `#[allow(dead_code)]` since it's not called in tests — will be exercised when frontend wires up the commands in S03/S05.

## Files Created/Modified

- `src-tauri/Cargo.toml` — Added `notify = { version = "8", features = [] }` dependency
- `src-tauri/src/gsd_watcher.rs` — New module with GsdFileWatcher, GsdFileChangedPayload, is_relevant_file(), debounce logic, and 11 unit tests
- `src-tauri/src/lib.rs` — Added `mod gsd_watcher`, expanded GsdState with watcher field, added start_file_watcher/stop_file_watcher commands
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — Marked T02 as done
