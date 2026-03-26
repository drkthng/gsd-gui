# S02: Headless query & file watcher — UAT Script

## Preconditions

- Rust toolchain installed (stable, MSRV 1.77+)
- Working directory: project root containing `src-tauri/`
- For full `cargo test`: VS Build Tools with Windows SDK (for `vswhom-sys`). For `cargo test --lib`: no extra tooling needed.

---

## Test Case 1: Headless Query — JSON Parsing

**Objective:** Verify `QuerySnapshot` correctly parses valid and edge-case JSON.

1. Run `cd src-tauri && cargo test --lib gsd_query -- test_parse_valid_json`
   - **Expected:** Test passes. `QuerySnapshot` has `current_milestone = Some("M002")`, `active_tasks` populated, `total_cost > 0.0`.

2. Run `cargo test --lib gsd_query -- test_parse_null_milestone`
   - **Expected:** Test passes. `current_milestone = None` when JSON has `null` milestone field.

3. Run `cargo test --lib gsd_query -- test_handle_invalid_json`
   - **Expected:** Test passes. Returns `Err` with descriptive message including raw output snippet (first 200 chars).

4. Run `cargo test --lib gsd_query -- test_handle_empty_json`
   - **Expected:** Test passes. Returns `Err` for empty string input.

5. Run `cargo test --lib gsd_query -- test_handle_partial_json`
   - **Expected:** Test passes. Returns `Err` for incomplete/malformed JSON.

## Test Case 2: Headless Query — camelCase Serialization

**Objective:** Verify Rust structs serialize to JSON matching frontend TypeScript interfaces.

1. Run `cargo test --lib gsd_query -- test_query_snapshot_serializes_camel_case`
   - **Expected:** JSON output contains `currentMilestone`, `activeTasks`, `totalCost` (not snake_case).

2. Run `cargo test --lib gsd_query -- test_project_info_serializes_camel_case`
   - **Expected:** JSON output contains `id`, `name`, `path` keys.

## Test Case 3: Project Directory Scanning

**Objective:** Verify `list_projects_in_dir` finds `.gsd/` subdirectories correctly.

1. Run `cargo test --lib gsd_query -- test_find_gsd_dirs`
   - **Expected:** Test passes. Finds directories containing `.gsd/` child, returns `ProjectInfo` with correct `id` (dir name), `name`, and canonicalized `path`.

2. Run `cargo test --lib gsd_query -- test_empty_dir`
   - **Expected:** Test passes. Returns empty Vec for directory with no `.gsd/` subdirs.

3. Run `cargo test --lib gsd_query -- test_invalid_path`
   - **Expected:** Test passes. Returns `Err` with descriptive message for non-existent path.

## Test Case 4: File Watcher — Relevant File Filtering

**Objective:** Verify `is_relevant_file()` correctly identifies watched files.

1. Run `cargo test --lib gsd_watcher -- test_relevant_file_state_md`
   - **Expected:** `is_relevant_file("STATE.md")` returns `true`.

2. Run `cargo test --lib gsd_watcher -- test_relevant_file_metrics_json`
   - **Expected:** `is_relevant_file("metrics.json")` returns `true`.

3. Run `cargo test --lib gsd_watcher -- test_relevant_file_roadmap`
   - **Expected:** `is_relevant_file("M002-ROADMAP.md")` returns `true` (any `*-ROADMAP.md`).

4. Run `cargo test --lib gsd_watcher -- test_irrelevant_file_ignored`
   - **Expected:** `is_relevant_file("random.txt")` returns `false`.

## Test Case 5: File Watcher — Change Detection

**Objective:** Verify watcher detects relevant file changes in `.gsd/` directory.

1. Run `cargo test --lib gsd_watcher -- test_watcher_detects_file_creation`
   - **Expected:** Creating STATE.md in a temp `.gsd/` dir triggers a callback with payload containing the file path.

2. Run `cargo test --lib gsd_watcher -- test_watcher_detects_roadmap_file`
   - **Expected:** Creating a `*-ROADMAP.md` file in `.gsd/` triggers a callback.

3. Run `cargo test --lib gsd_watcher -- test_watcher_filters_irrelevant_files`
   - **Expected:** Creating an irrelevant file (e.g., `notes.txt`) in `.gsd/` does NOT trigger a callback.

## Test Case 6: File Watcher — Debounce Behavior

**Objective:** Verify rapid changes are debounced into fewer events.

1. Run `cargo test --lib gsd_watcher -- test_watcher_debounces_rapid_changes`
   - **Expected:** Writing to the same file multiple times in rapid succession results in fewer callbacks than writes (debounce window: 500ms).

## Test Case 7: File Watcher — Lifecycle

**Objective:** Verify watcher starts and stops cleanly.

1. Run `cargo test --lib gsd_watcher -- test_watcher_stops_cleanly`
   - **Expected:** After `stop()`, no further callbacks fire even if files change.

2. Run `cargo test --lib gsd_watcher -- test_watcher_fails_on_missing_gsd_dir`
   - **Expected:** Starting watcher on a path without `.gsd/` dir returns `Err` with message `"Cannot watch: .gsd/ directory not found at '...'"`.

## Test Case 8: Payload Serialization

**Objective:** Verify `GsdFileChangedPayload` serializes to camelCase JSON.

1. Run `cargo test --lib gsd_watcher -- test_payload_serializes_camel_case`
   - **Expected:** JSON contains `path`, `kind`, `timestamp` keys (camelCase).

## Test Case 9: Full Suite — No Regressions

**Objective:** Verify all existing + new tests pass together.

1. Run `cd src-tauri && cargo test --lib`
   - **Expected:** 42 tests pass (21 from S01 + 10 from T01 + 11 from T02). Zero failures.

## Test Case 10: Tauri Command Registration

**Objective:** Verify all commands are registered in the Tauri handler.

1. Open `src-tauri/src/lib.rs` and inspect `generate_handler![]` macro.
   - **Expected:** Contains all 7 commands: `start_gsd_session`, `stop_gsd_session`, `send_gsd_command`, `query_gsd_state`, `list_projects`, `start_file_watcher`, `stop_file_watcher`.

---

## Edge Cases

- **Binary not found:** `run_headless_query` returns descriptive error including resolution chain (env var → PATH → common paths).
- **Non-zero exit code:** Error includes exit code and stderr snippet.
- **Empty stdout:** Error describes "empty output from gsd headless query".
- **Missing `.gsd/` for watcher:** Explicit error message with path.
- **Concurrent watcher start:** Second `start_file_watcher` stops existing watcher first (no leak).
