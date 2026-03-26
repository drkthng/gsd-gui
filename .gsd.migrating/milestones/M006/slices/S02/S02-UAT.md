# S02: Live Dashboard Wiring — UAT

**Milestone:** M006
**Written:** 2026-03-26T09:30:27.675Z

# S02: Live Dashboard Wiring — UAT

**Milestone:** M006
**Written:** 2026-03-25

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: All wiring is tested via mocked IPC — no real Tauri runtime required for contract verification. Pages render conditionally based on hook state, which is fully mockable.

## Preconditions

- Project built successfully (`npm run build` passes)
- All 345 tests pass (`npm run test -- --run`)
- A real .gsd/ project directory exists on disk for runtime testing (if Tauri app is available)

## Smoke Test

Run `npm run test -- --run src/hooks/use-milestone-data.test.ts src/pages/__tests__/pages.test.tsx` — all 40 tests pass, confirming hook and page wiring work end-to-end through mocked IPC.

## Test Cases

### 1. No project selected — milestones page

1. Render MilestonesPage with no activeProject in useProjectStore
2. **Expected:** EmptyState component with "Select a project" message and FolderOpen icon is displayed. No loading spinner, no milestone data.

### 2. No project selected — timeline page

1. Render TimelinePage with no activeProject in useProjectStore
2. **Expected:** EmptyState component with "Select a project" message. No timeline data displayed.

### 3. No project selected — costs page

1. Render CostsPage with no activeProject in useProjectStore
2. **Expected:** EmptyState component with "Select a project" message. No cost data displayed.

### 4. Loading state renders correctly

1. Mock useMilestoneData to return `{ isLoading: true, milestones: [], costData: null, error: null }`
2. Render any of the three pages with an activeProject set
3. **Expected:** Loading spinner visible. No data content, no error, no empty state.

### 5. Error state renders correctly

1. Mock useMilestoneData to return `{ error: "Failed to parse milestones", isLoading: false, milestones: [], costData: null }`
2. Render any of the three pages with an activeProject set
3. **Expected:** Error message "Failed to parse milestones" visible with AlertCircle icon. No data content, no spinner.

### 6. Milestones page shows real milestone data

1. Mock useMilestoneData to return milestones with id "M001", title "Rust process manager", status "complete"
2. Render MilestonesPage with an activeProject set
3. **Expected:** Milestone "M001" and "Rust process manager" text visible in the page content.

### 7. Timeline page shows real slice data

1. Mock useMilestoneData to return milestones containing slices
2. Render TimelinePage with an activeProject set
3. **Expected:** Slice data from the milestones is rendered in the timeline view.

### 8. Costs page shows cost data

1. Mock useMilestoneData to return costData with phases and slices
2. Render CostsPage with an activeProject set
3. **Expected:** Cost data rendered in the cost overview component, showing "Cost by Phase" heading.

### 9. Project switch triggers new data fetch

1. Start with project A selected, hook returns milestones for A
2. Switch activeProject to project B in useProjectStore
3. **Expected:** Hook re-fetches milestones for project B's path. Old data cleared, loading state shown, then new data rendered.

## Edge Cases

### Rapid project switching

1. Switch activeProject rapidly between 3 projects in quick succession
2. **Expected:** Only the final project's data is displayed (fetch generation ref discards stale responses). No race condition artifacts.

### Project deselection

1. Start with a project selected and milestones loaded
2. Set activeProject to null
3. **Expected:** milestones cleared to [], costData cleared to null, no loading state, no error. Pages show "Select a project" empty state.

### Mock data purged from production

1. Search production page files for "mock-data" imports: `rg "mock-data" src/pages/milestones-page.tsx src/pages/timeline-page.tsx src/pages/costs-page.tsx`
2. **Expected:** Zero matches. mock-data.ts only used in test files.

## Failure Signals

- Any of the 345 tests failing
- `npm run build` fails (TypeScript errors or import resolution failures)
- Production page files importing from mock-data
- Pages rendering raw "undefined" or crashing when no project is selected
- Loading spinner stuck indefinitely (hook error not propagated)

## Requirements Proved By This UAT

- R008 — Tests written before implementation for all new modules (derive-cost-data, use-milestone-data, page state tests)
- R009 — Zustand stores used for activeProject state that drives data fetching
- R032 — Pages use GsdClient abstraction through useMilestoneData hook, no direct Tauri imports

## Not Proven By This UAT

- Real Tauri runtime IPC (hook tested with mocked GsdClient, not actual invoke calls)
- Actual .gsd/ file parsing end-to-end (covered by S01's Rust tests, not this slice's scope)
- Real cost data display (costs default to 0.0 from parser — no cost data source exists yet)

## Notes for Tester

- The costs page will show zeros for all cost values — this is expected because the .gsd parser doesn't extract real cost data. The deriveCostData function handles this with fallback logic.
- The act() warnings in some tests (project-gallery, router) are pre-existing from earlier milestones and don't indicate failures.
- mock-data.ts still exists and is used by test files — only its imports from production pages were removed.
