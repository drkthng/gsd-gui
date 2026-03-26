---
estimated_steps: 29
estimated_files: 4
skills_used: []
---

# T01: Create milestone filtering utility, FilterBar component, and tests (TDD)

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

## Inputs

- ``src/lib/types.ts` — MilestoneInfo, CompletionStatus types used by filtering functions`
- ``src/test/test-utils.tsx` — renderWithProviders for component tests`
- ``src/test/mock-data.ts` — mockMilestones fixture with mixed statuses for test data`
- ``src/components/ui/badge.tsx` — Badge component for count display`

## Expected Output

- ``src/lib/milestone-filters.ts` — Pure filtering/grouping utility functions`
- ``src/lib/milestone-filters.test.ts` — Tests for grouping, filtering, and counting logic`
- ``src/components/milestones/milestone-filter-bar.tsx` — FilterBar component with status toggles and counts`
- ``src/components/milestones/milestone-filter-bar.test.tsx` — Tests for FilterBar rendering and interaction`

## Verification

npm run test -- --run src/lib/milestone-filters.test.ts src/components/milestones/milestone-filter-bar.test.tsx && npm run test -- --run
