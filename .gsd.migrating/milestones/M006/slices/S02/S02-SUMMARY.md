---
id: S02
parent: M006
milestone: M006
provides:
  - useMilestoneData hook: { milestones, costData, isLoading, error, refetch }
  - deriveCostData utility: MilestoneInfo[] → CostData
  - Live data wiring pattern for all three dashboard pages
  - Four-state page rendering pattern (no-project/loading/error/ready)
requires:
  - slice: S01
    provides: GsdClient.parseProjectMilestones() IPC method and MilestoneInfo/SliceInfo/TaskInfo types
affects:
  - S03
key_files:
  - src/hooks/use-milestone-data.ts
  - src/hooks/use-milestone-data.test.ts
  - src/lib/derive-cost-data.ts
  - src/lib/derive-cost-data.test.ts
  - src/pages/milestones-page.tsx
  - src/pages/timeline-page.tsx
  - src/pages/costs-page.tsx
  - src/pages/__tests__/pages.test.tsx
key_decisions:
  - useMilestoneData uses useState+useEffect (not TanStack Query) because it subscribes to Zustand store state — avoids coupling query lifecycle to external store
  - Fetch generation ref pattern discards stale IPC responses on rapid project switching without AbortController
  - deriveCostData fallback logic: child→parent cost when sums are zero, supporting current (0.0) and future (real costs) states
patterns_established:
  - useMilestoneData hook pattern: Zustand subscription → IPC call → derived state, reusable for any data that depends on activeProject
  - Four-state conditional rendering in data pages: no-project → loading → error → ready
  - Full useProjectStore mock with action stubs for any test file where ProjectGallery is in the render tree
observability_surfaces:
  - useMilestoneData.error exposes IPC fetch errors as strings in page UI
  - useMilestoneData.isLoading tracks async fetch state for spinner display
  - Each page renders error messages inline with AlertCircle icon for visual debugging
drill_down_paths:
  - .gsd/milestones/M006/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:30:27.675Z
blocker_discovered: false
---

# S02: Live Dashboard Wiring

**Milestones, timeline, and costs pages now show real project data from the selected project's .gsd/ directory via a Zustand-subscribed hook backed by the S01 Rust parser.**

## What Happened

Built two new modules and rewired three production pages to consume live project data instead of mock data.

**T01 — useMilestoneData hook + deriveCostData utility (17 tests)**

Created `src/hooks/use-milestone-data.ts`, a custom hook that subscribes to `useProjectStore.activeProject`. When a project is selected, it calls `GsdClient.parseProjectMilestones(path)` and derives cost data. Uses a fetch generation ref to discard stale responses on rapid project switching — a lightweight alternative to AbortController (which Tauri invoke doesn't support). Returns `{ milestones, costData, isLoading, error, refetch }`.

Created `src/lib/derive-cost-data.ts`, a pure function that walks the MilestoneInfo tree summing costs at task→slice→milestone levels. Includes fallback logic: if child-level costs sum to zero, falls back to the parent's cost field. This handles the current state (parser returns cost=0.0) and future state (when real cost data is populated).

Both modules had tests written first per R008. 9 hook tests cover: null project, loading state, successful fetch, error handling, refetch, project switching, and deselection. 8 cost data tests cover: empty input, single/multi milestone aggregation, and fallback behavior.

**T02 — Rewire pages to live data (9 new tests, 31 total in pages.test.tsx)**

Replaced mock-data imports in milestones-page.tsx, timeline-page.tsx, and costs-page.tsx with the useMilestoneData hook and useProjectStore. Each page now renders four conditional states: (1) no project selected → EmptyState prompt, (2) loading → spinner, (3) error → error message with AlertCircle icon, (4) data ready → the existing dashboard component with real data.

Updated pages.test.tsx to mock both useMilestoneData and useProjectStore. The useProjectStore mock required all action function stubs (loadProjects, addProject, etc.) because ProjectGallery calls loadProjects in a useEffect. Added 9 new tests: 3 pages × 3 states (no-project, loading, error).

## Verification

**Slice-level verification:**
- Full test suite: 345 tests pass across 52 files (up from 319 in S01 — 26 new tests)
- Production build: TypeScript compilation + Vite build succeed (1,090 kB JS, 70 kB CSS)
- No mock-data imports in production page files: `rg "mock-data" src/pages/{milestones,timeline,costs}-page.tsx` returns nothing
- All three pages import useMilestoneData and useProjectStore
- Task-level verification passed for both T01 and T02 independently

## Requirements Advanced

- R009 — useMilestoneData hook reads activeProject from Zustand store, maintaining the pattern of Zustand for all app state
- R032 — Pages consume data through useMilestoneData hook which calls GsdClient.parseProjectMilestones() — no direct Tauri imports in pages

## Requirements Validated

- R008 — Tests written before implementation for both derive-cost-data (8 tests) and use-milestone-data (9 tests), with page state tests (9) written alongside rewiring

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The useProjectStore mock in T02 needed full action function stubs (loadProjects, addProject, removeProject, selectProject, clearError) because ProjectGallery's useEffect calls loadProjects. The plan mentioned mocking useProjectStore but didn't specify including actions. Minor, same approach.

## Known Limitations

Cost data defaults to 0.0 for all milestones/slices because the .gsd parser doesn't extract real cost data yet. The deriveCostData function handles this gracefully with its fallback logic, but the costs page will show zeros until a cost data source is implemented. The plan acknowledged this: "cost data currently limited to what the parser extracts."

## Follow-ups

None.

## Files Created/Modified

- `src/hooks/use-milestone-data.ts` — New: Custom hook subscribing to activeProject, fetching milestones via IPC, deriving cost data
- `src/hooks/use-milestone-data.test.ts` — New: 9 tests for hook states — null project, loading, fetch, error, refetch, project switch
- `src/lib/derive-cost-data.ts` — New: Pure function deriving CostData from MilestoneInfo[] with fallback logic
- `src/lib/derive-cost-data.test.ts` — New: 8 tests for cost derivation — empty, single, multi, fallback behavior
- `src/pages/milestones-page.tsx` — Rewired from mock data to useMilestoneData hook with loading/error/empty states
- `src/pages/timeline-page.tsx` — Rewired from mock data to useMilestoneData hook with loading/error/empty states
- `src/pages/costs-page.tsx` — Rewired from mock data to useMilestoneData hook with loading/error/empty states
- `src/pages/__tests__/pages.test.tsx` — Updated mocks for useMilestoneData + useProjectStore, added 9 tests for conditional states
