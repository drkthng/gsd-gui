---
estimated_steps: 9
estimated_files: 4
skills_used: []
---

# T01: Create useMilestoneData hook with tests

Create a custom React hook that fetches parsed milestone data when the active project changes, plus a pure utility function to derive CostData from MilestoneInfo[].

**Context:** S01 delivered `GsdClient.parseProjectMilestones(projectPath)` which calls a Tauri IPC command that parses a project's `.gsd/milestones/` directory and returns `MilestoneInfo[]`. The `useProjectStore` has an `activeProject: SavedProject | null` field set when a user clicks a project card. This task bridges those two — when activeProject changes, fetch milestone data automatically.

**Key types (from `src/lib/types.ts`):**
- `MilestoneInfo { id, title, status, cost, progress, slices: SliceInfo[] }`
- `SliceInfo { id, title, status, risk, cost, progress, tasks: TaskInfo[], depends }`
- `TaskInfo { id, title, status, cost, duration }`
- `CostData { totalCost, budgetCeiling, byPhase, byModel, bySlice }`

**Cost derivation strategy:** The parser returns cost=0.0 for milestones/slices/tasks (cost data isn't in .gsd files yet). The `deriveCostData` function should still work correctly by summing the tree — when real costs arrive later, the function will produce real numbers. For now, `byPhase` maps milestones as phases, `byModel` returns an empty array (no model data available), `bySlice` lists each slice with its cost, `budgetCeiling` is null.

**Mock pattern (K-M002-05):** The project-store uses `createGsdClient()` at module scope. Any test that imports from project-store needs `vi.hoisted()` + `vi.mock()` for gsd-client. The hook should use `createGsdClient()` directly (same pattern as existing stores) or subscribe to project-store and use a client instance.

## Inputs

- ``src/services/gsd-client.ts` — GsdClient interface with parseProjectMilestones(projectPath) method`
- ``src/stores/project-store.ts` — useProjectStore with activeProject: SavedProject | null`
- ``src/lib/types.ts` — MilestoneInfo, CostData, SliceInfo, TaskInfo, SavedProject types`
- ``src/test/test-utils.tsx` — renderWithProviders and test setup with matchMedia mock`

## Expected Output

- ``src/hooks/use-milestone-data.ts` — custom hook: subscribes to activeProject, calls parseProjectMilestones, returns { milestones: MilestoneInfo[], costData: CostData, isLoading: boolean, error: string | null, refetch: () => void }`
- ``src/hooks/use-milestone-data.test.ts` — tests: null project returns empty arrays, successful fetch populates milestones and costData, error sets error string, refetch re-calls IPC, project change triggers new fetch`
- ``src/lib/derive-cost-data.ts` — pure function deriveCostData(milestones: MilestoneInfo[]): CostData`
- ``src/lib/derive-cost-data.test.ts` — tests: empty input returns zeroed CostData, single milestone sums correctly, multi-milestone aggregation works, budgetCeiling always null`

## Verification

npm run test -- --run src/hooks/use-milestone-data.test.ts src/lib/derive-cost-data.test.ts
