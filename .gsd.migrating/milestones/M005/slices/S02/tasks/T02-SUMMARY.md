---
id: T02
parent: S02
milestone: M005
key_files:
  - src/router.tsx
  - src/router.test.tsx
key_decisions:
  - (none)
duration: ""
verification_result: passed
completed_at: 2026-03-25T12:42:48.322Z
blocker_discovered: false
---

# T02: Wire 4 Diagnostics panels (LogViewer, Debugger, Metrics, TraceViewer) into router with route tests

**Wire 4 Diagnostics panels (LogViewer, Debugger, Metrics, TraceViewer) into router with route tests**

## What Happened

Added 4 new routes under /pro-tools for the diagnostics panels: /pro-tools/log-viewer, /pro-tools/debugger, /pro-tools/metrics, /pro-tools/trace-viewer. Imported panels from the barrel export. Extended router tests with 4 new route rendering assertions and updated the route count expectation from 8 to 12.

## Verification

Ran `npx vitest --run` — all 37 test suites pass (255 tests). Router tests verify each diagnostics panel route renders the correct h1 heading.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest --run` | 0 | ✅ pass | 63700ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/router.tsx`
- `src/router.test.tsx`
