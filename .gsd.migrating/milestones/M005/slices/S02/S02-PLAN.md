# S02: Diagnostics panels

**Goal:** Build the 4 Diagnostics category panels (Log Viewer, Debugger, Metrics, Trace Viewer) with mock data, loading/error states via ProToolPanel wrapper, and wire them into the router.
**Demo:** Forensics, Doctor, Activity Logs, Routing History panels render with loading/error states

## Must-Haves

- All 4 Diagnostics panels render with mock data inside ProToolPanel wrapper
- Each panel has tests covering rendering and content
- Panels are routable at /pro-tools/{panel-id}
- All tests pass (235+ baseline preserved)
- Barrel export updated

## Proof Level

- This slice proves: Contract — unit tests verify panel rendering and content

## Integration Closure

Consumes ProToolPanel wrapper and Card/Badge components from S01. Panels added to barrel export and router. No downstream consumers.

## Verification

- None — pure UI panels with mock data

## Tasks

- [x] **T01: Build 4 Diagnostics panels with tests** `est:45m`
  Create LogViewerPanel, DebuggerPanel, MetricsPanel, and TraceViewerPanel components following the established Card+Badge pattern from S01 orchestration panels. Each panel wraps content in ProToolPanel with status='ready' and displays mock data. Write co-located tests for each panel. Update the panels barrel export.

The Diagnostics category panels are defined in pro-tools-page.tsx panelCategories array:
- log-viewer: 'Stream and filter agent logs'
- debugger: 'Step-through agent execution debugger'
- metrics: 'Real-time performance metrics'
- trace-viewer: 'Distributed trace visualization'

Follow the exact pattern from parallel-panel.tsx: define mock data interface, create MOCK_ constant array, use ProToolPanel wrapper with title and status='ready', render Cards with Badge status indicators.

Steps:
1. Create src/components/pro-tools/panels/log-viewer-panel.tsx — mock log entries with timestamp, level (info/warn/error), message, source. Show level badges with appropriate variants.
2. Create src/components/pro-tools/panels/log-viewer-panel.test.tsx — test renders heading, shows mock entries, shows level badges.
3. Create src/components/pro-tools/panels/debugger-panel.tsx — mock debug sessions with id, status (paused/running/stopped), current step, agent name.
4. Create src/components/pro-tools/panels/debugger-panel.test.tsx
5. Create src/components/pro-tools/panels/metrics-panel.tsx — mock metrics with name, value, unit, trend (up/down/stable).
6. Create src/components/pro-tools/panels/metrics-panel.test.tsx
7. Create src/components/pro-tools/panels/trace-viewer-panel.tsx — mock traces with id, operation, duration, status, span count.
8. Create src/components/pro-tools/panels/trace-viewer-panel.test.tsx
9. Update src/components/pro-tools/panels/index.ts barrel export to include all 4 new panels.
  - Files: `src/components/pro-tools/panels/log-viewer-panel.tsx`, `src/components/pro-tools/panels/log-viewer-panel.test.tsx`, `src/components/pro-tools/panels/debugger-panel.tsx`, `src/components/pro-tools/panels/debugger-panel.test.tsx`, `src/components/pro-tools/panels/metrics-panel.tsx`, `src/components/pro-tools/panels/metrics-panel.test.tsx`, `src/components/pro-tools/panels/trace-viewer-panel.tsx`, `src/components/pro-tools/panels/trace-viewer-panel.test.tsx`, `src/components/pro-tools/panels/index.ts`
  - Verify: npx vitest --run -- log-viewer-panel debugger-panel metrics-panel trace-viewer-panel

- [x] **T02: Wire Diagnostics panels into router** `est:20m`
  Add routes for the 4 Diagnostics panels so they are navigable at /pro-tools/log-viewer, /pro-tools/debugger, /pro-tools/metrics, /pro-tools/trace-viewer. Add route tests.

Steps:
1. Import the 4 panels in src/router.tsx from the panels barrel export.
2. Add child routes under /pro-tools for each panel id matching the paths in panelCategories.
3. Add tests in src/router.test.tsx verifying each diagnostics route renders the correct panel heading.
4. Run full test suite to confirm no regressions (235+ tests pass).
  - Files: `src/router.tsx`, `src/router.test.tsx`
  - Verify: npx vitest --run

## Files Likely Touched

- src/components/pro-tools/panels/log-viewer-panel.tsx
- src/components/pro-tools/panels/log-viewer-panel.test.tsx
- src/components/pro-tools/panels/debugger-panel.tsx
- src/components/pro-tools/panels/debugger-panel.test.tsx
- src/components/pro-tools/panels/metrics-panel.tsx
- src/components/pro-tools/panels/metrics-panel.test.tsx
- src/components/pro-tools/panels/trace-viewer-panel.tsx
- src/components/pro-tools/panels/trace-viewer-panel.test.tsx
- src/components/pro-tools/panels/index.ts
- src/router.tsx
- src/router.test.tsx
