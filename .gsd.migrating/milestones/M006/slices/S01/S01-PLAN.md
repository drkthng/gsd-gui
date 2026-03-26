# S01: GSD Project Data Parser

**Goal:** Rust backend can parse a .gsd/ directory and return structured milestone/slice/task data matching the frontend MilestoneInfo[] type hierarchy, exposed as a Tauri command and accessible via gsd-client.ts.
**Demo:** Tauri command returns parsed milestones/slices/tasks from a real .gsd/ directory

## Must-Haves

- `gsd_parser.rs` parses ROADMAP.md files to extract milestone title, slices (id, title, status, risk, depends)
- `gsd_parser.rs` parses PLAN.md files to extract tasks (id, title, status, estimate)
- `gsd_parser.rs` derives completion status from `[x]`/`[ ]` checkboxes and SUMMARY.md existence
- `gsd_parser.rs` computes progress percentages from completed vs total items
- Tauri command `parse_project_milestones` registered and callable from frontend
- `GsdClient.parseProjectMilestones()` method added to gsd-client.ts
- All Rust unit tests pass: `cd src-tauri && cargo test --lib`
- All frontend tests pass: `npm run test -- --run`
- No regressions in existing test suite

## Proof Level

- This slice proves: Contract — Rust unit tests with temp directory fixtures (no real GSD binary or running project). Frontend tests with mocked Tauri invoke.

## Integration Closure

- Upstream surfaces consumed: existing `MilestoneInfo`, `SliceInfo`, `TaskInfo`, `CompletionStatus`, `RiskLevel` types in `src/lib/types.ts`
- New wiring: `gsd_parser.rs` module, `parse_project_milestones` Tauri command, `GsdClient.parseProjectMilestones()` method
- What remains before milestone is truly usable end-to-end: S02 (wire parsed data into React pages replacing mock imports), S03 (milestone filtering UI)

## Verification

- Runtime signals: parse errors include the file path and line content that failed
- Inspection surfaces: `parse_project_milestones` Tauri command returns Result with descriptive error strings
- Failure visibility: missing files return empty arrays (not errors) — only malformed content returns errors with file path context

## Tasks

- [x] **T01: Implement Rust .gsd directory parser with unit tests** `est:2h`
  Create `gsd_parser.rs` that reads a project's `.gsd/milestones/` directory and returns a `Vec<MilestoneInfo>` struct tree. The parser extracts milestone metadata from ROADMAP.md headers, slice metadata from roadmap checkbox lines (`- [x] **S01: Title** \`risk:high\` \`depends:[]\``), task metadata from PLAN.md checkbox lines (`- [x] **T01: Title** \`est:2h\``), and completion status from checkbox state plus SUMMARY.md existence. Serde structs must serialize to camelCase JSON matching the existing frontend TypeScript types in `src/lib/types.ts` (MilestoneInfo, SliceInfo, TaskInfo, CompletionStatus, RiskLevel). Cost fields default to 0.0 (no cost data in .gsd files). Duration parsed from task SUMMARY.md frontmatter `duration:` field when available. Progress computed as percentage of done items. Register `parse_project_milestones` as a Tauri command in lib.rs. Add `regex` crate to Cargo.toml.
  - Files: `src-tauri/src/gsd_parser.rs`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`
  - Verify: cd src-tauri && cargo test --lib gsd_parser && cargo build

- [x] **T02: Wire parser through GsdClient and add frontend tests** `est:45m`
  Add `parseProjectMilestones` to the GsdClient interface and implementation in gsd-client.ts, invoking the `parse_project_milestones` Tauri command. Add tests in gsd-client.test.ts verifying the new method calls invoke with the correct command name and arguments. Verify the return type matches MilestoneInfo[]. Ensure all existing tests still pass — no regressions.
  - Files: `src/services/gsd-client.ts`, `src/services/gsd-client.test.ts`
  - Verify: npm run test -- --run

## Files Likely Touched

- src-tauri/src/gsd_parser.rs
- src-tauri/src/lib.rs
- src-tauri/Cargo.toml
- src/services/gsd-client.ts
- src/services/gsd-client.test.ts
