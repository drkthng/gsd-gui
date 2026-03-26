---
id: T03
parent: S03
milestone: M005
key_files:
  - src/components/pro-tools/panels/dependency-graph-panel.tsx
  - src/components/pro-tools/panels/dependency-graph-panel.test.tsx
  - src/components/pro-tools/panels/coverage-map-panel.tsx
  - src/components/pro-tools/panels/coverage-map-panel.test.tsx
  - src/components/pro-tools/panels/token-usage-panel.tsx
  - src/components/pro-tools/panels/token-usage-panel.test.tsx
  - src/components/pro-tools/panels/theme-preview-panel.tsx
  - src/components/pro-tools/panels/theme-preview-panel.test.tsx
  - src/components/pro-tools/panels/index.ts
  - src/router.tsx
  - src/router.test.tsx
key_decisions:
  - Followed debugger-panel pattern exactly: interface + mock array + ProToolPanel wrapper + Card/Badge layout + data-testid
duration: ""
verification_result: passed
completed_at: 2026-03-25T14:02:34.189Z
blocker_discovered: false
---

# T03: Add dependency-graph, coverage-map, token-usage, and theme-preview panels with tests and routes

**Add dependency-graph, coverage-map, token-usage, and theme-preview panels with tests and routes**

## What Happened

Created the final 4 Visualization category panels following the established debugger-panel pattern. Each panel has an interface, mock data array, ProToolPanel wrapper with Card/Badge layout, and data-testid attributes. Added 16 new tests (4 per panel). Updated barrel export in panels/index.ts to include all 19 panels. Added 4 new routes in router.tsx. Fixed router.test.tsx route count assertion from 16 to 24. Fixed token-usage test to handle locale-dependent number formatting in jsdom.

## Verification

All 4 new panel tests pass (16/16). Full test suite passes: 303 tests across 49 suites, up from 287 tests in 45 suites before this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest --run -- dependency-graph-panel coverage-map-panel token-usage-panel theme-preview-panel` | 0 | ✅ pass | 8320ms |
| 2 | `npx vitest --run` | 0 | ✅ pass | 90000ms |


## Deviations

Fixed token-usage test regex to handle toLocaleString() inconsistency in jsdom (no comma separators). Updated router.test.tsx route count from 16 to 24.

## Known Issues

None.

## Files Created/Modified

- `src/components/pro-tools/panels/dependency-graph-panel.tsx`
- `src/components/pro-tools/panels/dependency-graph-panel.test.tsx`
- `src/components/pro-tools/panels/coverage-map-panel.tsx`
- `src/components/pro-tools/panels/coverage-map-panel.test.tsx`
- `src/components/pro-tools/panels/token-usage-panel.tsx`
- `src/components/pro-tools/panels/token-usage-panel.test.tsx`
- `src/components/pro-tools/panels/theme-preview-panel.tsx`
- `src/components/pro-tools/panels/theme-preview-panel.test.tsx`
- `src/components/pro-tools/panels/index.ts`
- `src/router.tsx`
- `src/router.test.tsx`
