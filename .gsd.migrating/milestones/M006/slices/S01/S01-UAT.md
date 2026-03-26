# S01: GSD Project Data Parser — UAT

**Milestone:** M006
**Written:** 2026-03-26T09:06:23.779Z

## Preconditions

- Project builds: `cd src-tauri && cargo build` succeeds
- Frontend builds: `npm run build` succeeds
- A real GSD project directory exists at a known path (e.g. `D:\AiProjects\gsd-gui`) with `.gsd/milestones/` containing at least one milestone with ROADMAP.md

## Test Cases

### TC1: Parse a real .gsd/ directory with completed milestones

**Steps:**
1. Open the app (or invoke the Tauri command directly via dev tools)
2. Call `parseProjectMilestones("D:\\AiProjects\\gsd-gui")` via GsdClient
3. Verify the response is a non-empty `MilestoneInfo[]` array

**Expected:**
- Array contains entries for M001, M002, M003, M004, M005 (completed milestones)
- Each milestone has `id`, `title`, `status`, `progress`, `slices[]`
- Status values are kebab-case strings: `"done"`, `"in-progress"`, `"pending"`
- Risk values are lowercase: `"high"`, `"medium"`, `"low"`
- Field names are camelCase in JSON: `completedAt`, `startedAt`, `costEstimate`, etc.

### TC2: Parse a project with no .gsd/ directory

**Steps:**
1. Call `parseProjectMilestones("C:\\Windows\\Temp")` (a path with no `.gsd/milestones/`)

**Expected:**
- Returns an empty array `[]`
- No error thrown

### TC3: Milestone with slices and tasks shows correct hierarchy

**Steps:**
1. Parse a project with at least one milestone containing slices with tasks
2. Inspect a milestone's `slices` array
3. Inspect a slice's `tasks` array

**Expected:**
- Each slice has `id` (e.g. "S01"), `title`, `status`, `risk`, `depends[]`, `tasks[]`
- Each task has `id` (e.g. "T01"), `title`, `status`, `estimate`, `duration`
- Completed slices have `status: "done"`, in-progress have `status: "in-progress"`
- Tasks with checked boxes `[x]` AND existing SUMMARY.md show `status: "done"`

### TC4: Progress percentage computation

**Steps:**
1. Parse a milestone with some completed and some pending slices

**Expected:**
- `progress` field is a number between 0 and 100
- A milestone with 3/4 slices done shows `progress: 75`
- A fully complete milestone shows `progress: 100`

### TC5: Ghost milestone directory handling

**Steps:**
1. Create a temporary milestone directory with no ROADMAP.md inside `.gsd/milestones/`
2. Parse the project

**Expected:**
- The ghost milestone directory is silently skipped
- Other valid milestones are still returned
- No error is thrown

### TC6: Malformed ROADMAP.md lines

**Steps:**
1. Create a ROADMAP.md with some valid slice lines and some garbage lines
2. Parse the project

**Expected:**
- Valid slice lines are parsed correctly
- Malformed lines are silently skipped
- No error thrown

### TC7: Frontend GsdClient method

**Steps:**
1. In frontend test environment, call `client.parseProjectMilestones("/some/path")`
2. Verify the Tauri invoke is called with command `"parse_project_milestones_cmd"` and args `{ projectPath: "/some/path" }`

**Expected:**
- Invoke is called exactly once with correct command name and argument shape
- Return type matches `MilestoneInfo[]`

### TC8: Duration extraction from task SUMMARY.md

**Steps:**
1. Parse a project where task SUMMARY.md files contain `duration: "45m"` in YAML frontmatter

**Expected:**
- The task's `duration` field contains `"45m"`
- Tasks without SUMMARY.md have empty string duration `""`
