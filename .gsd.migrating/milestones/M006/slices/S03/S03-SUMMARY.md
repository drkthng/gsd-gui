---
id: S03
parent: M006
milestone: M006
provides:
  - Milestone filtering by status (all/active/complete/planned)
  - Collapsible grouped milestone display
  - MilestoneFilterBar reusable component
  - MilestoneGroupedList reusable component
  - milestone-filters.ts pure utility functions
requires:
  - slice: S02
    provides: useMilestoneData hook, MilestoneInfo types, ProgressDashboard component
affects:
  []
key_files:
  - src/lib/milestone-filters.ts
  - src/lib/milestone-filters.test.ts
  - src/components/milestones/milestone-filter-bar.tsx
  - src/components/milestones/milestone-filter-bar.test.tsx
  - src/components/milestones/milestone-grouped-list.tsx
  - src/components/milestones/milestone-grouped-list.test.tsx
  - src/pages/milestones-page.tsx
  - src/pages/__tests__/pages.test.tsx
key_decisions:
  - StatusFilter maps to CompletionStatus groups (Active=in-progress, Complete=done, Planned=pending+blocked) rather than raw status values
  - Group headers use Radix Collapsible with all-expanded-by-default via inverted collapsed record
  - FilterBar uses data-active attribute for selected state to match shadcn patterns
patterns_established:
  - Pure filtering/grouping utility + UI component pattern: logic in src/lib, component in src/components, wired in page — clean separation of concerns
  - Radix Collapsible for expandable group sections with count badges
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M006/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:54:14.182Z
blocker_discovered: false
---

# S03: Milestone Filtering & Polish

**Added milestone status filtering with collapsible grouped sections (Active/Complete/Planned) and 36 new TDD tests.**

## What Happened

S03 delivered the milestone filtering feature across two tasks, both following strict TDD per R008.

T01 built the pure logic layer and FilterBar component. `milestone-filters.ts` provides three pure functions: `groupMilestonesByStatus` groups milestones into Active (in-progress), Complete (done), and Planned (pending + blocked) categories, returning only non-empty groups in stable order. `filterMilestonesByStatus` handles the 'all' pass-through and category-specific filtering. `getStatusCounts` provides badge counts. MilestoneFilterBar renders a row of toggle buttons with count badges using shadcn Button + Badge, with `data-active` for selected state and `role="group"` for accessibility. 22 tests (16 utility + 6 component).

T02 built MilestoneGroupedList and wired everything into MilestonesPage. Each status group renders as a Radix Collapsible section with header (label + count + chevron), all expanded by default. Collapse state tracked via a `collapsed` record keyed by label. ProgressDashboard renders milestone trees inside each group, preserving the existing expand-to-slices-and-tasks behavior. MilestonesPage holds filter state, derives filtered/grouped/counts, and renders FilterBar + GroupedList only when data is ready — all conditional states (no-project, loading, error, empty) remain untouched. 14 tests (7 grouped-list + 7 page integration). Used `within()` scoping on filter bar's `role="group"` to disambiguate filter buttons from collapsible trigger buttons sharing the same text labels.

Final count: 381 tests across 55 files (345 pre-existing + 36 new), all passing. TypeScript clean.

## Verification

Full test suite: 381/381 tests pass across 55 files (npm run test -- --run). TypeScript type check: npx tsc --noEmit clean, zero errors. New test files: milestone-filters.test.ts (16 tests), milestone-filter-bar.test.tsx (6 tests), milestone-grouped-list.test.tsx (7 tests), pages.test.tsx (7 new tests added to existing 31). No regressions in any existing test file.

## Requirements Advanced

- R008 — All 36 new tests written before implementation code (TDD) — filter utilities, FilterBar, GroupedList, and page integration tests all written test-first

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T02 used within() scoping in page integration tests to disambiguate FilterBar buttons from collapsible trigger buttons sharing the same text labels (e.g., "Active", "Complete"). Not anticipated in the plan but is the correct testing-library pattern for this component composition.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `src/lib/milestone-filters.ts` — New pure utility: groupMilestonesByStatus, filterMilestonesByStatus, getStatusCounts
- `src/lib/milestone-filters.test.ts` — 16 tests for milestone filtering/grouping utilities
- `src/components/milestones/milestone-filter-bar.tsx` — New FilterBar component with All/Active/Complete/Planned toggle buttons and count badges
- `src/components/milestones/milestone-filter-bar.test.tsx` — 6 tests for FilterBar rendering and interactions
- `src/components/milestones/milestone-grouped-list.tsx` — New GroupedList component with Radix Collapsible sections per status category
- `src/components/milestones/milestone-grouped-list.test.tsx` — 7 tests for grouped list rendering, collapse/expand, and count badges
- `src/pages/milestones-page.tsx` — Replaced flat ProgressDashboard with FilterBar + GroupedList, added filter state
- `src/pages/__tests__/pages.test.tsx` — 7 new integration tests for filter bar presence, filter interactions, and conditional rendering
