---
id: T02
parent: S01
milestone: M006
key_files:
  - src/services/gsd-client.ts
  - src/services/gsd-client.test.ts
key_decisions:
  - MilestoneInfo added to gsd-client.ts re-export block to maintain D005 boundary — all type consumers import from gsd-client, not types.ts directly
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:01:09.177Z
blocker_discovered: false
---

# T02: Wire parseProjectMilestones through GsdClient interface with 2 new frontend tests

**Wire parseProjectMilestones through GsdClient interface with 2 new frontend tests**

## What Happened

Added `parseProjectMilestones` to the GsdClient interface and factory implementation in `gsd-client.ts`, wiring the Rust Tauri command `parse_project_milestones` through to the frontend. The method accepts a `projectPath` string and returns `Promise<MilestoneInfo[]>` via `invoke`.

Also added `MilestoneInfo` to the import/re-export blocks in gsd-client.ts so downstream consumers can import it from the gsd-client boundary (per D005).

Added 2 new test cases in `gsd-client.test.ts`:
1. `parseProjectMilestones() calls invoke with correct command and project path` — verifies the correct Tauri command name and argument shape
2. `parseProjectMilestones() returns MilestoneInfo[]` — verifies typed return with a full milestone/slice/task hierarchy

Updated the existing `createGsdClient() returns an object with all expected methods` test to include `parseProjectMilestones`.

The initial verification gate failure was because `cargo test` and `cargo build` ran from the project root (D:\AiProjects\gsd-gui) instead of `src-tauri/` — a known issue documented in K020. All commands succeed when run from the correct directory.

## Verification

- `npm run test -- --run`: 319 tests pass across 50 files (gsd-client.test.ts: 20 tests, up from 18)
- `cargo test --lib gsd_parser` (from src-tauri/): 35 tests pass
- `cargo build` (from src-tauri/): compiles successfully (warnings only)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test -- --run` | 0 | ✅ pass | 98600ms |
| 2 | `cd src-tauri && cargo test --lib gsd_parser` | 0 | ✅ pass | 3600ms |
| 3 | `cd src-tauri && cargo build` | 0 | ✅ pass | 3600ms |


## Deviations

None.

## Known Issues

Verification gate runs cargo commands from project root instead of src-tauri/, causing false failures. This is a known issue (K020) with the verification gate configuration, not a code issue.

## Files Created/Modified

- `src/services/gsd-client.ts`
- `src/services/gsd-client.test.ts`
