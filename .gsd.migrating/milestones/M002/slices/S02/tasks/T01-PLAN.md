---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T01: Implement headless query module with TDD

**Slice:** S02 — Headless query & file watcher
**Milestone:** M002

## Description

Create `gsd_query.rs` with `QuerySnapshot` and `ProjectInfo` structs, implement headless query execution via `gsd headless query --project <path>`, implement project directory scanning, and register both as Tauri commands. Tests first per R008.

The `QuerySnapshot` fields must align with the frontend `GsdState` interface already defined in `src/services/gsd-client.ts`: `currentMilestone: string | null`, `activeTasks: number`, `totalCost: number`. Use serde `rename_all = "camelCase"` to match.

The `ProjectInfo` struct must match the frontend interface: `id: string`, `name: string`, `path: string`.

## Steps

1. **Write tests in `gsd_query.rs`** — test parsing valid JSON into `QuerySnapshot`, test handling of invalid/empty JSON, test `list_projects_in_dir()` finding directories with `.gsd/` subdirs and ignoring those without. Use temp dirs for filesystem tests.

2. **Define structs** — `QuerySnapshot { current_milestone: Option<String>, active_tasks: u32, total_cost: f64 }` with `#[serde(rename_all = "camelCase")]`. `ProjectInfo { id: String, name: String, path: String }` with same serde config.

3. **Implement `run_headless_query(project_path: &str) -> Result<QuerySnapshot, String>`** — calls `resolve_gsd_binary()` from `gsd_resolve.rs`, spawns `gsd headless query --project <path> --format json`, reads stdout to completion, parses JSON into `QuerySnapshot`. Handle spawn failure, non-zero exit, and invalid JSON gracefully with descriptive errors.

4. **Implement `list_projects_in_dir(scan_path: &str) -> Result<Vec<ProjectInfo>, String>`** — reads directory entries, filters for subdirectories containing a `.gsd/` child, constructs `ProjectInfo` with `id` = dir name, `name` = dir name, `path` = absolute path.

5. **Register Tauri commands in `lib.rs`** — add `mod gsd_query;`, add `#[tauri::command] async fn query_gsd_state(project_path: String) -> Result<QuerySnapshot, String>` and `#[tauri::command] async fn list_projects(scan_path: String) -> Result<Vec<ProjectInfo>, String>` that delegate to the module functions. Add both to `generate_handler![]`.

## Must-Haves

- [ ] `QuerySnapshot` struct with serde serialization matching frontend `GsdState` interface
- [ ] `ProjectInfo` struct with serde serialization matching frontend `ProjectInfo` interface
- [ ] `run_headless_query()` spawns process and parses JSON output
- [ ] `list_projects_in_dir()` scans for `.gsd/` subdirectories
- [ ] Both functions registered as Tauri commands in `lib.rs`
- [ ] ≥5 unit tests written before implementation code (TDD)

## Verification

- `cd src-tauri && cargo test --lib gsd_query` — all query tests pass
- `cd src-tauri && cargo test` — all 21 existing tests + new tests pass (no regressions)

## Inputs

- `src-tauri/src/gsd_resolve.rs` — `resolve_gsd_binary()` function reused for binary resolution
- `src-tauri/src/gsd_rpc.rs` — serde patterns (tag, rename_all) as reference
- `src-tauri/src/lib.rs` — existing Tauri command registration pattern
- `src/services/gsd-client.ts` — `GsdState` and `ProjectInfo` TypeScript interfaces that Rust structs must align with

## Expected Output

- `src-tauri/src/gsd_query.rs` — new module with QuerySnapshot, ProjectInfo, run_headless_query(), list_projects_in_dir(), and tests
- `src-tauri/src/lib.rs` — updated with `mod gsd_query`, two new Tauri commands registered
