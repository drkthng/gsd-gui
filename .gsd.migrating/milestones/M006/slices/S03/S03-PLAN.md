# S03: Milestone Filtering & Polish

**Goal:** User can filter milestones by status (active, complete, planned) with collapsible groups per status category on the Milestones page.
**Demo:** User can filter milestones by status (active, complete, planned). Collapsed/expanded groups.

## Must-Haves

- Milestones page shows a filter bar with status toggles (All, Active, Complete, Planned)
- Milestones are grouped by status into collapsible sections with counts
- Each group renders its milestones via the existing ProgressDashboard tree
- Filter toggles show/hide groups; "All" shows everything
- Existing page states (no-project, loading, error, empty) remain functional
- Tests written before implementation per R008
- All existing 345 tests continue to pass
- New tests cover: filtering utility, filter bar interactions, grouped rendering, page integration

## Proof Level

- This slice proves: Contract — component tests verify filtering logic and UI state transitions. No real runtime needed.

## Integration Closure

- Upstream surfaces consumed: `src/hooks/use-milestone-data.ts` (milestones array), `src/lib/types.ts` (MilestoneInfo, CompletionStatus)
- New wiring: MilestonesPage renders MilestoneFilterBar + MilestoneGroupedList instead of flat ProgressDashboard
- What remains for milestone: nothing — S03 is the final slice

## Verification

- None — pure UI filtering with no async, backend, or error-path changes.

## Tasks

- [x] **T01: Create milestone filtering utility, FilterBar component, and tests (TDD)** `est:45m`
  Build the pure filtering/grouping logic and the FilterBar UI component with tests written first per R008.

## Steps

1. Create `src/lib/milestone-filters.ts` with:
   - `StatusFilter` type: `'all' | 'active' | 'complete' | 'planned'`
   - `StatusGroup` interface: `{ label: string; status: CompletionStatus[]; milestones: MilestoneInfo[] }`
   - `groupMilestonesByStatus(milestones: MilestoneInfo[]): StatusGroup[]` — groups milestones into Active (in-progress), Complete (done), and Planned (pending + blocked) categories. Returns only non-empty groups.
   - `filterMilestonesByStatus(milestones: MilestoneInfo[], filter: StatusFilter): MilestoneInfo[]` — returns all milestones for 'all', or the subset matching the filter category.
   - `getStatusCounts(milestones: MilestoneInfo[]): Record<StatusFilter, number>` — counts per filter for badge display.

2. Create `src/lib/milestone-filters.test.ts` FIRST with tests:
   - groupMilestonesByStatus: empty input returns empty, single status returns one group, mixed statuses return multiple groups, blocked milestones grouped with planned
   - filterMilestonesByStatus: 'all' returns everything, 'active' returns only in-progress, 'complete' returns only done, 'planned' returns pending+blocked
   - getStatusCounts: correct counts for each category

3. Implement `src/lib/milestone-filters.ts` to pass all tests.

4. Create `src/components/milestones/milestone-filter-bar.test.tsx` FIRST with tests:
   - Renders All/Active/Complete/Planned buttons
   - 'All' is selected by default (aria-pressed or data-state)
   - Clicking a filter calls onChange with the correct StatusFilter
   - Counts are displayed as badges on each button
   - Active filter is visually distinguished

5. Create `src/components/milestones/milestone-filter-bar.tsx`:
   - Props: `{ counts: Record<StatusFilter, number>; activeFilter: StatusFilter; onChange: (filter: StatusFilter) => void }`
   - Renders a row of toggle buttons using shadcn Badge for counts
   - Uses data-active attribute or variant prop for selected state

## Must-Haves

- [ ] Tests written before implementation (R008)
- [ ] groupMilestonesByStatus handles all CompletionStatus values
- [ ] filterMilestonesByStatus handles 'all' filter
- [ ] FilterBar renders accessible buttons with counts
- [ ] All new tests pass alongside existing 345 tests
  - Files: `src/lib/milestone-filters.ts`, `src/lib/milestone-filters.test.ts`, `src/components/milestones/milestone-filter-bar.tsx`, `src/components/milestones/milestone-filter-bar.test.tsx`
  - Verify: npm run test -- --run src/lib/milestone-filters.test.ts src/components/milestones/milestone-filter-bar.test.tsx && npm run test -- --run

- [x] **T02: Wire filtering into MilestonesPage with grouped collapsible sections** `est:45m`
  Integrate the T01 filtering components into MilestonesPage, replacing the flat ProgressDashboard with a grouped view. Update page tests.

## Steps

1. Create `src/components/milestones/milestone-grouped-list.test.tsx` FIRST with tests:
   - Renders group headers with labels and milestone counts
   - Groups are collapsible (click header to toggle)
   - Each group renders milestones via ProgressDashboard
   - Empty groups are not rendered
   - All groups expanded by default

2. Create `src/components/milestones/milestone-grouped-list.tsx`:
   - Props: `{ groups: StatusGroup[] }`
   - Renders each group as a collapsible section with header showing label + count badge
   - Uses `useState` for expand/collapse per group (all expanded initially)
   - Delegates milestone rendering to existing ProgressDashboard inside each group
   - Uses Collapsible from shadcn/ui or simple div toggle

3. Update `src/pages/milestones-page.tsx`:
   - Add `useState<StatusFilter>('all')` for active filter
   - Import and use `filterMilestonesByStatus`, `groupMilestonesByStatus`, `getStatusCounts` from milestone-filters
   - Render MilestoneFilterBar above the milestone list (only when data is ready, not in loading/error/empty states)
   - Render MilestoneGroupedList with the filtered+grouped milestones
   - Keep all existing conditional states (no-project, loading, error, empty)

4. Update `src/pages/__tests__/pages.test.tsx`:
   - Add tests for milestones page filter integration: filter bar renders, clicking filter changes displayed milestones
   - Ensure existing 'no project', 'loading', 'error' tests still pass
   - Update the MilestonesPage 'renders page-specific content' test if the unique text lookup needs adjustment

5. Run full test suite to confirm no regressions.

## Must-Haves

- [ ] MilestoneGroupedList renders collapsible groups
- [ ] MilestonesPage shows FilterBar when data is ready
- [ ] Filter changes update displayed milestones
- [ ] All existing page states (no-project, loading, error, empty) unchanged
- [ ] All 345+ tests pass
  - Files: `src/components/milestones/milestone-grouped-list.tsx`, `src/components/milestones/milestone-grouped-list.test.tsx`, `src/pages/milestones-page.tsx`, `src/pages/__tests__/pages.test.tsx`
  - Verify: npm run test -- --run src/components/milestones/milestone-grouped-list.test.tsx src/pages/__tests__/pages.test.tsx && npm run test -- --run

## Files Likely Touched

- src/lib/milestone-filters.ts
- src/lib/milestone-filters.test.ts
- src/components/milestones/milestone-filter-bar.tsx
- src/components/milestones/milestone-filter-bar.test.tsx
- src/components/milestones/milestone-grouped-list.tsx
- src/components/milestones/milestone-grouped-list.test.tsx
- src/pages/milestones-page.tsx
- src/pages/__tests__/pages.test.tsx
