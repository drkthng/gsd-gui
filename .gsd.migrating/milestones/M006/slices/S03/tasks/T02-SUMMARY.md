---
id: T02
parent: S03
milestone: M006
key_files:
  - src/components/milestones/milestone-grouped-list.tsx
  - src/components/milestones/milestone-grouped-list.test.tsx
  - src/pages/milestones-page.tsx
  - src/pages/__tests__/pages.test.tsx
key_decisions:
  - Group headers use Radix Collapsible with all-expanded-by-default via an inverted collapsed record (collapsed[label] defaults to falsy = expanded)
  - FilterBar button queries in tests scoped via within(role='group') to avoid collision with identically-named collapsible trigger buttons
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:48:30.477Z
blocker_discovered: false
---

# T02: Wire milestone filtering into MilestonesPage with grouped collapsible sections and 14 new tests

**Wire milestone filtering into MilestonesPage with grouped collapsible sections and 14 new tests**

## What Happened

Built MilestoneGroupedList component (test-first) and integrated it with MilestoneFilterBar into MilestonesPage, replacing the flat ProgressDashboard with a filtered grouped view.

**MilestoneGroupedList** (`milestone-grouped-list.tsx`) receives `StatusGroup[]` from the T01 filtering utilities and renders each group as a Radix Collapsible section. Each group header shows the label, a count badge, and a chevron indicator. Groups are all expanded by default (tracked via a `collapsed` record keyed by label). ProgressDashboard renders milestone trees inside each group, maintaining the existing expand-to-slices-and-tasks behavior.

**MilestonesPage** now holds a `useState<StatusFilter>('all')` for the active filter. When milestones are loaded, it derives filtered milestones, groups, and status counts, then renders FilterBar above MilestoneGroupedList. All conditional states (no-project, loading, error, empty) remain unchanged — the FilterBar only appears when data is ready.

**Tests:** 7 tests for MilestoneGroupedList covering group rendering, collapsible toggle, re-expand, empty groups, and count badges. 7 tests for MilestonesPage filter integration covering filter bar presence, grouped display, Active/Complete/All filter clicks changing displayed milestones, and filter bar absence in no-project/loading states. Used `within()` scoping on the filter bar's `role="group"` to disambiguate filter buttons from collapsible trigger buttons that share the same text labels.

## Verification

Ran `npx vitest run src/components/milestones/milestone-grouped-list.test.tsx` — 7/7 pass. Ran `npx vitest run src/pages/__tests__/pages.test.tsx` — 38/38 pass (31 existing + 7 new). Ran full suite `npx vitest run` — 381/381 pass (367 existing + 14 new, zero regressions). TypeScript type check `npx tsc --noEmit` — clean.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run src/components/milestones/milestone-grouped-list.test.tsx` | 0 | ✅ pass (7/7) | 8600ms |
| 2 | `npx vitest run src/pages/__tests__/pages.test.tsx` | 0 | ✅ pass (38/38) | 11700ms |
| 3 | `npx vitest run` | 0 | ✅ pass (381/381 tests, 55 files) | 110700ms |
| 4 | `npx tsc --noEmit` | 0 | ✅ pass | 3100ms |


## Deviations

Used `within()` scoping in page integration tests to disambiguate FilterBar buttons from collapsible trigger buttons — both contain text like "Active" and "Complete". This wasn't anticipated in the plan but is the correct testing-library pattern for this component composition.

## Known Issues

None.

## Files Created/Modified

- `src/components/milestones/milestone-grouped-list.tsx`
- `src/components/milestones/milestone-grouped-list.test.tsx`
- `src/pages/milestones-page.tsx`
- `src/pages/__tests__/pages.test.tsx`
