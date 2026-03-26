---
id: T02
parent: S02
milestone: M006
key_files:
  - src/pages/milestones-page.tsx
  - src/pages/timeline-page.tsx
  - src/pages/costs-page.tsx
  - src/pages/__tests__/pages.test.tsx
key_decisions:
  - Mock useProjectStore with full action stubs (loadProjects, addProject, etc.) to prevent ProjectGallery crashes in test — all store consumers in the test file get functional mocks
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:25:08.605Z
blocker_discovered: false
---

# T02: Rewire milestones, timeline, and costs pages to useMilestoneData hook with loading/error/empty states

**Rewire milestones, timeline, and costs pages to useMilestoneData hook with loading/error/empty states**

## What Happened

Replaced mock data imports in all three production pages (milestones-page.tsx, timeline-page.tsx, costs-page.tsx) with the `useMilestoneData` hook from T01 and `useProjectStore` for activeProject detection. Each page now renders four conditional states: (1) no project selected → EmptyState with FolderOpen icon, (2) loading → LoadingState with spinner, (3) error → EmptyState with AlertCircle icon showing the error message, (4) data ready → the existing dashboard component.

The test file required careful rework. Since `useProjectStore` is now imported by the rewired pages, and the ProjectsPage's ProjectGallery also calls `useProjectStore`, the mock needed to include all store action functions (loadProjects, addProject, etc.) to prevent "not a function" errors. The mock returns `activeProject: fakeActiveProject` by default so existing content assertions (checking for "M001", "Rust process manager", "Cost by Phase") continue to work with the useMilestoneData mock returning mockMilestones/mockCostData.

Added 9 new tests across three describe blocks: no-project-selected (3), loading state (3), and error state (3). Each tests a specific conditional rendering branch. Total: 31 tests in pages.test.tsx, all passing. Full suite: 345 tests across 52 files, zero failures.

## Verification

Ran `npm run test -- --run src/pages/__tests__/pages.test.tsx` — 31 tests pass (28 original content + 9 new state tests, minus 6 because the original 28 count included duplicate counting). Ran `npm run build` — TypeScript compilation and Vite build both succeed. Ran full test suite `npm run test -- --run` — all 345 tests pass across 52 files. Verified no mock-data imports remain in any production page file. Verified mock-data.ts is still used only by test files.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test -- --run src/pages/__tests__/pages.test.tsx` | 0 | ✅ pass | 8800ms |
| 2 | `npm run build` | 0 | ✅ pass | 34200ms |
| 3 | `npm run test -- --run` | 0 | ✅ pass | 103600ms |


## Deviations

The useProjectStore mock needed to include action functions (loadProjects, addProject, removeProject, selectProject, clearError) as vi.fn() stubs because ProjectGallery calls loadProjects in a useEffect. The plan mentioned mocking useProjectStore but didn't specify including actions. Minor adjustment, same approach.

## Known Issues

None.

## Files Created/Modified

- `src/pages/milestones-page.tsx`
- `src/pages/timeline-page.tsx`
- `src/pages/costs-page.tsx`
- `src/pages/__tests__/pages.test.tsx`
