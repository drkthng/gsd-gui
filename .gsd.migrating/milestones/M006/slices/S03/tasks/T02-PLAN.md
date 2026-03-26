---
estimated_steps: 31
estimated_files: 4
skills_used: []
---

# T02: Wire filtering into MilestonesPage with grouped collapsible sections

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

## Inputs

- ``src/lib/milestone-filters.ts` — Filtering/grouping utilities from T01`
- ``src/components/milestones/milestone-filter-bar.tsx` — FilterBar component from T01`
- ``src/components/dashboard/progress-dashboard.tsx` — Existing milestone tree renderer`
- ``src/hooks/use-milestone-data.ts` — Data hook already consumed by MilestonesPage`
- ``src/pages/milestones-page.tsx` — Current page to modify`
- ``src/pages/__tests__/pages.test.tsx` — Existing page tests to update`
- ``src/test/mock-data.ts` — mockMilestones with mixed statuses`
- ``src/components/ui/collapsible.tsx` — shadcn Collapsible for group expand/collapse`

## Expected Output

- ``src/components/milestones/milestone-grouped-list.tsx` — Grouped collapsible milestone sections`
- ``src/components/milestones/milestone-grouped-list.test.tsx` — Tests for grouped list rendering and collapse`
- ``src/pages/milestones-page.tsx` — Updated with filter state, FilterBar, and MilestoneGroupedList`
- ``src/pages/__tests__/pages.test.tsx` — Updated with filter integration tests`

## Verification

npm run test -- --run src/components/milestones/milestone-grouped-list.test.tsx src/pages/__tests__/pages.test.tsx && npm run test -- --run
