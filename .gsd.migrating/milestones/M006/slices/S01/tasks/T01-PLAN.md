---
estimated_steps: 26
estimated_files: 3
skills_used: []
---

# T01: Implement Rust .gsd directory parser with unit tests

Create `gsd_parser.rs` that reads a project's `.gsd/milestones/` directory and returns a `Vec<MilestoneInfo>` struct tree matching the frontend TypeScript types exactly. The parser must handle real-world .gsd directories — missing files, incomplete milestones, varied formatting.

**Key context for executor:**

The frontend types in `src/lib/types.ts` define the exact JSON shape:
```typescript
type CompletionStatus = "done" | "in-progress" | "pending" | "blocked";
type RiskLevel = "low" | "medium" | "high";
interface TaskInfo { id: string; title: string; status: CompletionStatus; cost: number; duration: string | null; }
interface SliceInfo { id: string; title: string; status: CompletionStatus; risk: RiskLevel; cost: number; progress: number; tasks: TaskInfo[]; depends: string[]; }
interface MilestoneInfo { id: string; title: string; status: CompletionStatus; cost: number; progress: number; slices: SliceInfo[]; }
```

**ROADMAP.md format** (each milestone has one at `.gsd/milestones/MXXX/MXXX-ROADMAP.md`):
- Line 1: `# M001: Project Scaffolding & Core Shell` → extract id and title
- Slice lines under `## Slices`: `- [x] **S01: Title text** \`risk:high\` \`depends:[]\`` or `- [ ] **S02: Title** \`risk:low\` \`depends:[S01]\``
- `[x]` = done, `[ ]` with in-progress tasks = in-progress, `[ ]` with no tasks started = pending

**PLAN.md format** (each slice has one at `.gsd/milestones/MXXX/slices/SXX/SXX-PLAN.md`):
- Task lines under `## Tasks`: `- [x] **T01: Task title** \`est:2h\`` or `- [ ] **T02: Title** \`est:45m\``
- `[x]` = done, `[ ]` = pending (or in-progress if SUMMARY exists for some tasks in the slice)

**SUMMARY.md frontmatter** (task summaries at `.gsd/milestones/MXXX/slices/SXX/tasks/TXX-SUMMARY.md`):
- YAML frontmatter with `duration: 25m` field

**Milestone SUMMARY.md** (at `.gsd/milestones/MXXX/MXXX-SUMMARY.md`):
- YAML frontmatter with `status: complete` field — if this exists, the milestone status is "done"

Cost fields: set to 0.0 everywhere (no cost data available from .gsd files — costs are tracked separately).

**IMPORTANT knowledge entries for executor:**
- K017: MSVC toolchain needs env vars for cargo build (see Knowledge Base)
- K018: Tauri build script requires icon files — they already exist
- K020: cargo test must run from src-tauri/, not project root

## Inputs

- ``src/lib/types.ts` — frontend type definitions that Rust serde structs must match (MilestoneInfo, SliceInfo, TaskInfo, CompletionStatus, RiskLevel)`
- ``src-tauri/src/lib.rs` — existing Tauri command registration to extend with parse_project_milestones`
- ``src-tauri/Cargo.toml` — dependency manifest to add regex crate`
- ``.gsd/milestones/M001/M001-ROADMAP.md` — reference example of ROADMAP.md format with completed slices`
- ``.gsd/milestones/M002/slices/S01/S01-PLAN.md` — reference example of PLAN.md task line format`
- ``.gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md` — reference for SUMMARY.md YAML frontmatter with duration field`

## Expected Output

- ``src-tauri/src/gsd_parser.rs` — new module with MilestoneInfo/SliceInfo/TaskInfo serde structs, parse_project_milestones() public function, regex-based ROADMAP/PLAN line parsers, SUMMARY frontmatter reader, and 15+ unit tests using temp directory fixtures`
- ``src-tauri/src/lib.rs` — updated with mod gsd_parser and parse_project_milestones in generate_handler![]`
- ``src-tauri/Cargo.toml` — updated with regex dependency`

## Verification

cd src-tauri && cargo test --lib gsd_parser && cargo build

## Observability Impact

- Signals added: parse_project_milestones returns Result<Vec<MilestoneInfo>, String> with descriptive error messages including file paths
- How a future agent inspects: invoke parse_project_milestones from frontend dev tools or Tauri console
- Failure state exposed: missing .gsd/milestones/ dir returns empty Vec (not error), malformed ROADMAP.md lines are skipped with warning-level logging
