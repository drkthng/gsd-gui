---
id: T02
parent: S03
milestone: M005
key_files:
  - src/components/pro-tools/panels/benchmarks-panel.tsx
  - src/components/pro-tools/panels/benchmarks-panel.test.tsx
  - src/components/pro-tools/panels/resource-monitor-panel.tsx
  - src/components/pro-tools/panels/resource-monitor-panel.test.tsx
  - src/components/pro-tools/panels/prompt-lab-panel.tsx
  - src/components/pro-tools/panels/prompt-lab-panel.test.tsx
  - src/components/pro-tools/panels/ab-testing-panel.tsx
  - src/components/pro-tools/panels/ab-testing-panel.test.tsx
  - src/components/pro-tools/panels/index.ts
  - src/router.tsx
key_decisions:
  - Followed debugger-panel pattern exactly: interface + mock array + ProToolPanel wrapper + Card/Badge layout + data-testid
duration: ""
verification_result: passed
completed_at: 2026-03-25T13:38:42.195Z
blocker_discovered: false
---

# T02: Add benchmarks, resource-monitor, prompt-lab, and ab-testing panels with tests and routes

**Add benchmarks, resource-monitor, prompt-lab, and ab-testing panels with tests and routes**

## What Happened

Created 4 Data & Tuning category panels following the established debugger-panel pattern: BenchmarksPanel (mock benchmark results with duration/status/score), ResourceMonitorPanel (CPU/Memory/Disk/Network with usage and health status), PromptLabPanel (prompt experiments with model/tokens/score), and AbTestingPanel (A/B test configs with variants and winner). Each panel uses ProToolPanel wrapper, Card/Badge layout, and data-testid attributes. Added co-located tests (4 tests per panel), updated barrel exports in index.ts, and wired 4 new routes in router.tsx.

## Verification

Ran vitest on all 4 new test files — 16/16 tests passed across benchmarks-panel, resource-monitor-panel, prompt-lab-panel, and ab-testing-panel.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest --run --reporter=verbose benchmarks-panel resource-monitor-panel prompt-lab-panel ab-testing-panel` | 0 | ✅ pass | 7080ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/components/pro-tools/panels/benchmarks-panel.tsx`
- `src/components/pro-tools/panels/benchmarks-panel.test.tsx`
- `src/components/pro-tools/panels/resource-monitor-panel.tsx`
- `src/components/pro-tools/panels/resource-monitor-panel.test.tsx`
- `src/components/pro-tools/panels/prompt-lab-panel.tsx`
- `src/components/pro-tools/panels/prompt-lab-panel.test.tsx`
- `src/components/pro-tools/panels/ab-testing-panel.tsx`
- `src/components/pro-tools/panels/ab-testing-panel.test.tsx`
- `src/components/pro-tools/panels/index.ts`
- `src/router.tsx`
