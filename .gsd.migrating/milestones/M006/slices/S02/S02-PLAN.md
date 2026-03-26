# S02: Live Dashboard Wiring

**Goal:** Selecting a project in the gallery populates milestones, timeline, and costs pages with real data from that project's .gsd/ directory — no mock data in production pages.
**Demo:** Select a project in gallery → milestones, timeline, and costs pages show real data from that project

## Must-Haves

- Milestones page shows real MilestoneInfo from the selected project's .gsd/ directory
- Timeline page shows real slices from the selected project
- Costs page shows cost data derived from real milestone/slice data
- All three pages show appropriate loading, empty, and no-project-selected states
- No mock data imports remain in production page files (milestones-page, timeline-page, costs-page)
- All existing tests pass plus new tests for the data hook
- R008: tests written before implementation for all new code

## Proof Level

- This slice proves: Contract — hook tested with mocked IPC, pages tested with mocked hook. No real Tauri runtime required.

## Integration Closure

- Upstream: `GsdClient.parseProjectMilestones()` from S01 (`src/services/gsd-client.ts`), `useProjectStore.activeProject` from M002
- New wiring: `useMilestoneData` hook connects activeProject selection to IPC data fetch, pages consume hook output
- What remains: S03 adds milestone filtering/grouping; cost data currently limited to what the parser extracts (costs default to 0.0 from .gsd files — real cost data will need a separate source)

## Verification

- Runtime signals: hook exposes isLoading/error state for data fetch failures
- Inspection surfaces: React DevTools shows hook state; pages show error messages inline
- Failure visibility: error string from IPC call displayed in page UI and available via store inspection

## Tasks

- [x] **T01: Create useMilestoneData hook with tests** `est:45m`
  Create a custom React hook that fetches parsed milestone data when the active project changes, plus a utility to derive CostData from MilestoneInfo[]. The hook subscribes to useProjectStore's activeProject, calls GsdClient.parseProjectMilestones() on change, and returns { milestones, costData, isLoading, error }. The costData is derived client-side from the milestone tree (sum costs by slice, aggregate by milestone as 'phase'). Tests first per R008.
  - Files: `src/hooks/use-milestone-data.ts`, `src/hooks/use-milestone-data.test.ts`, `src/lib/derive-cost-data.ts`, `src/lib/derive-cost-data.test.ts`
  - Verify: npm run test -- --run src/hooks/use-milestone-data.test.ts src/lib/derive-cost-data.test.ts

- [x] **T02: Rewire milestones, timeline, and costs pages to real data** `est:1h`
  Replace mock data imports in milestones-page.tsx, timeline-page.tsx, and costs-page.tsx with the useMilestoneData hook. Add loading spinner, no-project-selected empty state, and error display. Update pages.test.tsx and any affected tests to mock the hook instead of relying on static mock data. Remove mock data imports from all production page files.
  - Files: `src/pages/milestones-page.tsx`, `src/pages/timeline-page.tsx`, `src/pages/costs-page.tsx`, `src/pages/__tests__/pages.test.tsx`
  - Verify: npm run test -- --run src/pages/__tests__/pages.test.tsx && npm run build

## Files Likely Touched

- src/hooks/use-milestone-data.ts
- src/hooks/use-milestone-data.test.ts
- src/lib/derive-cost-data.ts
- src/lib/derive-cost-data.test.ts
- src/pages/milestones-page.tsx
- src/pages/timeline-page.tsx
- src/pages/costs-page.tsx
- src/pages/__tests__/pages.test.tsx
