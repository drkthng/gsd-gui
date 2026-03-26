---
id: T01
parent: S03
milestone: M006
key_files:
  - src/lib/milestone-filters.ts
  - src/lib/milestone-filters.test.ts
  - src/components/milestones/milestone-filter-bar.tsx
  - src/components/milestones/milestone-filter-bar.test.tsx
key_decisions:
  - StatusFilter uses 'all' | 'active' | 'complete' | 'planned' — maps to CompletionStatus groups rather than raw status values
  - Planned category groups both 'pending' and 'blocked' milestones together
  - FilterBar uses data-active attribute for selected state rather than aria-pressed to match shadcn patterns
  - groupMilestonesByStatus returns stable order: Active → Complete → Planned
duration: ""
verification_result: passed
completed_at: 2026-03-26T09:40:04.933Z
blocker_discovered: false
---

# T01: Add milestone filtering utility (groupBy/filter/count) and FilterBar component with 22 TDD tests

**Add milestone filtering utility (groupBy/filter/count) and FilterBar component with 22 TDD tests**

## What Happened

Built the pure milestone filtering/grouping utility and FilterBar UI component following strict TDD — tests written before implementation in both cases.

**milestone-filters.ts** provides three functions: `groupMilestonesByStatus` groups milestones into Active (in-progress), Complete (done), and Planned (pending + blocked) categories, returning only non-empty groups. `filterMilestonesByStatus` filters by status category with 'all' returning everything. `getStatusCounts` returns counts per filter for badge display. All three are pure functions with no side effects.

**MilestoneFilterBar** renders a row of toggle buttons (All/Active/Complete/Planned) with count badges. Uses `data-active` attribute for selected state, shadcn Button + Badge components, and calls `onChange` with the `StatusFilter` value on click. Fully accessible with role="group" and aria-label.

Tests cover: empty input, single-status grouping, mixed-status grouping, blocked-with-planned grouping, all filter categories, badge rendering, click interactions, zero-count edge case. 16 utility tests + 6 component tests = 22 new tests.

## Verification

Ran `npx vitest run src/lib/milestone-filters.test.ts src/components/milestones/milestone-filter-bar.test.tsx` — 22/22 pass. Ran full suite `npx vitest run` — 367/367 pass (345 existing + 22 new, zero regressions). TypeScript type check `npx tsc --noEmit` — clean, no errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run src/lib/milestone-filters.test.ts src/components/milestones/milestone-filter-bar.test.tsx` | 0 | ✅ pass | 6720ms |
| 2 | `npx vitest run` | 0 | ✅ pass (367/367 tests) | 105870ms |
| 3 | `npx tsc --noEmit` | 0 | ✅ pass | 3400ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/milestone-filters.ts`
- `src/lib/milestone-filters.test.ts`
- `src/components/milestones/milestone-filter-bar.tsx`
- `src/components/milestones/milestone-filter-bar.test.tsx`
