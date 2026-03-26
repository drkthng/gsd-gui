---
estimated_steps: 17
estimated_files: 9
skills_used: []
---

# T01: Build 4 Diagnostics panels with tests

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

## Inputs

- ``src/components/pro-tools/panels/parallel-panel.tsx` — reference pattern for panel structure`
- ``src/components/pro-tools/panels/parallel-panel.test.tsx` — reference pattern for panel tests`
- ``src/components/pro-tools/pro-tool-panel.tsx` — ProToolPanel wrapper component`
- ``src/components/pro-tools/panels/index.ts` — barrel export to update`

## Expected Output

- ``src/components/pro-tools/panels/log-viewer-panel.tsx` — Log Viewer panel component`
- ``src/components/pro-tools/panels/log-viewer-panel.test.tsx` — Log Viewer tests`
- ``src/components/pro-tools/panels/debugger-panel.tsx` — Debugger panel component`
- ``src/components/pro-tools/panels/debugger-panel.test.tsx` — Debugger tests`
- ``src/components/pro-tools/panels/metrics-panel.tsx` — Metrics panel component`
- ``src/components/pro-tools/panels/metrics-panel.test.tsx` — Metrics tests`
- ``src/components/pro-tools/panels/trace-viewer-panel.tsx` — Trace Viewer panel component`
- ``src/components/pro-tools/panels/trace-viewer-panel.test.tsx` — Trace Viewer tests`
- ``src/components/pro-tools/panels/index.ts` — updated barrel export`

## Verification

npx vitest --run -- log-viewer-panel debugger-panel metrics-panel trace-viewer-panel
