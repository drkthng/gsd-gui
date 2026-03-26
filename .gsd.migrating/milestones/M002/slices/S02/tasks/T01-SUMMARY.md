---
id: T01
parent: S02
milestone: M002
provides:
  - QuerySnapshot struct with serde camelCase serialization matching frontend GsdState
  - ProjectInfo struct with serde camelCase serialization matching frontend ProjectInfo
  - run_headless_query() async fn that spawns gsd binary and parses JSON output
  - list_projects_in_dir() fn that scans for .gsd/ subdirectories
  - parse_query_json() helper exposed for unit testing
  - query_gsd_state and list_projects Tauri commands registered in lib.rs
key_files:
  - src-tauri/src/gsd_query.rs
  - src-tauri/src/lib.rs
key_decisions:
  - Exposed parse_query_json() as a separate public function to enable direct unit testing of JSON parsing without spawning a process
patterns_established:
  - serde rename_all = "camelCase" for structs that must match frontend TypeScript interfaces
  - Tauri command functions in lib.rs delegate to module functions for testability
observability_surfaces:
  - run_headless_query() returns descriptive errors including binary path, exit code, and stderr snippet on failure
  - list_projects_in_dir() returns descriptive errors for invalid paths and directory read failures
  - parse_query_json() includes raw output snippet (first 200 chars) in parse error messages
duration: 12m
verification_result: passed
completed_at: 2026-03-25
blocker_discovered: false
---

# T01: Implement headless query module with TDD

**Added gsd_query.rs with QuerySnapshot/ProjectInfo structs, headless query execution, project directory scanning, and 10 unit tests — all registered as Tauri commands**

## What Happened

Created `src-tauri/src/gsd_query.rs` with TDD approach (tests written first, then implementation):

1. **Structs** — `QuerySnapshot { current_milestone, active_tasks, total_cost }` and `ProjectInfo { id, name, path }`, both with `#[serde(rename_all = "camelCase")]` to match frontend `GsdState` and `ProjectInfo` TypeScript interfaces.

2. **`run_headless_query(project_path)`** — Resolves gsd binary via `resolve_gsd_binary()`, spawns `gsd headless query --project <path> --format json`, captures stdout, parses JSON into `QuerySnapshot`. Handles spawn failure, non-zero exit (with stderr + exit code), and invalid JSON (with raw output snippet) as descriptive error strings.

3. **`parse_query_json(json)`** — Standalone JSON parsing helper exposed for direct unit testing without process spawning.

4. **`list_projects_in_dir(scan_path)`** — Reads directory entries, filters for subdirectories containing `.gsd/` child, constructs `ProjectInfo` with `id` = dir name, `name` = dir name, `path` = canonicalized absolute path.

5. **Tauri commands** — `query_gsd_state` and `list_projects` registered in `lib.rs` via `generate_handler![]`, delegating to module functions.

6. **10 unit tests** — parse valid JSON, parse null milestone, invalid JSON, empty JSON, partial JSON, camelCase serialization (QuerySnapshot + ProjectInfo), find .gsd/ dirs, empty dir, invalid path.

## Verification

- `cargo test --lib gsd_query` — 10 tests pass
- `cargo test` — 31 total tests pass (21 existing + 10 new), zero regressions
- `cargo test --lib gsd_query -- test_handle_invalid_json` — failure-path test passes, confirms descriptive error on malformed JSON

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cargo test --lib gsd_query` | 0 | ✅ pass | 22.1s |
| 2 | `cargo test` | 0 | ✅ pass | 25.6s |
| 3 | `cargo test --lib gsd_query -- test_handle_invalid_json` | 0 | ✅ pass | 11.7s |

## Diagnostics

- **Error inspection**: All error paths return descriptive `String` errors. `run_headless_query()` errors include: binary path on spawn failure, exit code + stderr on non-zero exit, parse error + raw output snippet (first 200 chars) on invalid JSON.
- **Serialization verification**: `test_query_snapshot_serializes_camel_case` and `test_project_info_serializes_camel_case` explicitly verify camelCase field names in JSON output, ensuring frontend compatibility.
- **Filesystem tests**: Use temp dirs with cleanup, testing both positive cases (dirs with `.gsd/`) and negative cases (dirs without, empty dirs, invalid paths).

## Deviations

None — implementation followed the task plan exactly.

## Known Issues

- `parse_query_json` and some items from `gsd_rpc.rs` generate dead_code warnings (used in tests but not yet in production code paths). These will be resolved as downstream tasks wire up the full pipeline.

## Files Created/Modified

- `src-tauri/src/gsd_query.rs` — New module with QuerySnapshot, ProjectInfo structs, run_headless_query(), parse_query_json(), list_projects_in_dir(), and 10 unit tests
- `src-tauri/src/lib.rs` — Added `mod gsd_query`, `query_gsd_state` and `list_projects` Tauri commands, registered in `generate_handler![]`
- `.gsd/milestones/M002/slices/S02/S02-PLAN.md` — Added Observability/Diagnostics section and failure-path verification check
