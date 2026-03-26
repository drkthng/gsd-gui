---
id: T01
parent: S02
milestone: M006
key_files:
  - src/hooks/use-milestone-data.ts
  - src/hooks/use-milestone-data.test.ts
  - src/lib/derive-cost-data.ts
  - src/lib/derive-cost-data.test.ts
key_decisions:
  - useMilestoneData uses useState+useEffect (not TanStack Query) because it subscribes to Zustand store state rather than a simple query key — this avoids coupling the query lifecycle to an external store subscription
  - deriveCostData falls back to parent-level cost when child sums are zero, supporting both current (costs not parsed yet) and future (real costs populated) states
  - Fetch generation ref pattern to discard stale responses on rapid project switching, avoiding race conditions without AbortController (which Tauri invoke doesn't support)
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:18:21.162Z
blocker_discovered: false
---

# T01: Create useMilestoneData hook and deriveCostData utility with 17 tests

**Create useMilestoneData hook and deriveCostData utility with 17 tests**

## What Happened

Built two new modules for the live dashboard wiring:

1. **`src/lib/derive-cost-data.ts`** — Pure function that walks the MilestoneInfo tree summing costs at task→slice→milestone levels. Maps milestones as "phases" for `byPhase`, lists all slices in `bySlice`, returns empty `byModel` (no model attribution data yet), and always-null `budgetCeiling`. Includes fallback logic: if task-level costs sum to zero, falls back to slice.cost; if slice-level costs sum to zero, falls back to milestone.cost. This handles both the current state (parser returns cost=0) and future state (when costs are populated).

2. **`src/hooks/use-milestone-data.ts`** — Custom hook subscribing to `useProjectStore.activeProject`. When active project changes to non-null, calls `client.parseProjectMilestones(path)` and derives cost data. Uses a fetch generation ref to discard stale responses (handles rapid project switching). Returns `{ milestones, costData, isLoading, error, refetch }`. Follows the established pattern of module-scope `createGsdClient()` consistent with `useGsdState` and the project store.

Tests cover: empty/null project, successful fetch populating both milestones and costData, loading state tracking, error handling (Error objects and raw strings), refetch behavior, project change triggering new fetch, project deselection clearing data, cost aggregation across multiple milestones, fallback logic for zero costs.

## Verification

Ran task-level verification: `npm run test -- --run src/hooks/use-milestone-data.test.ts src/lib/derive-cost-data.test.ts` — 17 tests pass (9 hook + 8 cost data). TypeScript check `npx tsc --noEmit` passes with zero errors. Full suite `npm run test -- --run` passes all 336 tests across 52 files with zero regressions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test -- --run src/hooks/use-milestone-data.test.ts src/lib/derive-cost-data.test.ts` | 0 | ✅ pass | 4010ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 3400ms |
| 3 | `npm run test -- --run` | 0 | ✅ pass | 104910ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/hooks/use-milestone-data.ts`
- `src/hooks/use-milestone-data.test.ts`
- `src/lib/derive-cost-data.ts`
- `src/lib/derive-cost-data.test.ts`
