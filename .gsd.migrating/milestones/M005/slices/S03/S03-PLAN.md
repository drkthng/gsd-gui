# S03: Data & Tuning panels

**Goal:** All 12 remaining Pro Tools panels render with mock data, tests pass, and routes are wired
**Demo:** Knowledge, Decisions, Requirements, Skills, Budget Pressure, Hooks, MCP, Custom Models, Remote Questions, Runtime, Agents, Visualizer panels all render

## Must-Haves

- All 12 new panels render inside ProToolPanel wrapper with mock data
- Each panel has a co-located test file with at least 3 tests
- All 12 routes added to router.tsx
- Barrel export updated in panels/index.ts
- All tests pass (255+ baseline maintained)

## Proof Level

- This slice proves: contract — unit tests confirm rendering

## Integration Closure

- Upstream: ProToolPanel wrapper from S01, Card/Badge from shadcn/ui, panel constants from pro-tools-page.tsx
- New wiring: 12 routes in router.tsx, 12 exports in panels/index.ts
- Remaining: nothing — all 19 panels complete after this slice

## Verification

- none

## Tasks

- [x] **T01: Build session-manager, state-inspector, secrets, and config-editor panels** `est:45m`
  Create 4 panels (session-manager, state-inspector, secrets, config-editor) following the established pattern from debugger-panel.tsx: mock data array, Card+Badge layout, ProToolPanel wrapper. Add co-located tests. Wire routes into router.tsx and add barrel exports to panels/index.ts.

Pattern to follow (from debugger-panel.tsx):
- Define a TypeScript interface for the mock data shape
- Create a MOCK_* const array with 3-5 items
- Use ProToolPanel with title and status='ready'
- Render Cards with CardHeader (title + Badge) and CardContent
- Add data-testid on each card

Panel specs:
- session-manager: Mock active sessions with id, name, status (active/idle/terminated), startedAt
- state-inspector: Mock state entries with id, key, value, type (string/number/boolean/object)
- secrets: Mock secrets with id, name, source (env/vault/config), masked value (****)
- config-editor: Mock config items with id, key, value, category (agent/project/system)

Test pattern (from debugger-panel.test.tsx): render panel, assert title heading, assert mock items render, assert status badges.
  - Files: `src/components/pro-tools/panels/session-manager-panel.tsx`, `src/components/pro-tools/panels/session-manager-panel.test.tsx`, `src/components/pro-tools/panels/state-inspector-panel.tsx`, `src/components/pro-tools/panels/state-inspector-panel.test.tsx`, `src/components/pro-tools/panels/secrets-panel.tsx`, `src/components/pro-tools/panels/secrets-panel.test.tsx`, `src/components/pro-tools/panels/config-editor-panel.tsx`, `src/components/pro-tools/panels/config-editor-panel.test.tsx`, `src/components/pro-tools/panels/index.ts`, `src/router.tsx`
  - Verify: npx vitest --run -- session-manager-panel state-inspector-panel secrets-panel config-editor-panel && npx vitest --run

- [x] **T02: Build benchmarks, resource-monitor, prompt-lab, and ab-testing panels** `est:45m`
  Create 4 Tuning category panels following the same established pattern. Add co-located tests. Wire routes into router.tsx and barrel exports.

Panel specs:
- benchmarks: Mock benchmark results with id, name, duration (ms), status (passed/failed/running), score
- resource-monitor: Mock resource entries with id, resource (CPU/Memory/Disk/Network), usage (percentage string), status (healthy/warning/critical)
- prompt-lab: Mock prompt experiments with id, name, model, tokens, score
- ab-testing: Mock A/B test configs with id, name, variantA, variantB, winner (A/B/pending)

Follow exact same pattern as T01 panels and existing debugger-panel.tsx.
  - Files: `src/components/pro-tools/panels/benchmarks-panel.tsx`, `src/components/pro-tools/panels/benchmarks-panel.test.tsx`, `src/components/pro-tools/panels/resource-monitor-panel.tsx`, `src/components/pro-tools/panels/resource-monitor-panel.test.tsx`, `src/components/pro-tools/panels/prompt-lab-panel.tsx`, `src/components/pro-tools/panels/prompt-lab-panel.test.tsx`, `src/components/pro-tools/panels/ab-testing-panel.tsx`, `src/components/pro-tools/panels/ab-testing-panel.test.tsx`, `src/components/pro-tools/panels/index.ts`, `src/router.tsx`
  - Verify: npx vitest --run -- benchmarks-panel resource-monitor-panel prompt-lab-panel ab-testing-panel && npx vitest --run

- [x] **T03: Build dependency-graph, coverage-map, token-usage, and theme-preview panels** `est:45m`
  Create the final 4 Visualization category panels. Add co-located tests. Wire routes into router.tsx and barrel exports. Run full test suite to verify all 255+ tests still pass plus the new ones.

Panel specs:
- dependency-graph: Mock dependency nodes with id, name, type (direct/dev/peer), version, dependents count
- coverage-map: Mock coverage entries with id, file, statements (%), branches (%), functions (%), status (covered/partial/uncovered)
- token-usage: Mock token usage records with id, model, inputTokens, outputTokens, cost, date
- theme-preview: Mock theme entries with id, name, primary color, mode (light/dark/system), active boolean

After this task, all 19 panels are built and routed. Full test suite must pass with 255+ baseline maintained.
  - Files: `src/components/pro-tools/panels/dependency-graph-panel.tsx`, `src/components/pro-tools/panels/dependency-graph-panel.test.tsx`, `src/components/pro-tools/panels/coverage-map-panel.tsx`, `src/components/pro-tools/panels/coverage-map-panel.test.tsx`, `src/components/pro-tools/panels/token-usage-panel.tsx`, `src/components/pro-tools/panels/token-usage-panel.test.tsx`, `src/components/pro-tools/panels/theme-preview-panel.tsx`, `src/components/pro-tools/panels/theme-preview-panel.test.tsx`, `src/components/pro-tools/panels/index.ts`, `src/router.tsx`
  - Verify: npx vitest --run -- dependency-graph-panel coverage-map-panel token-usage-panel theme-preview-panel && npx vitest --run

## Files Likely Touched

- src/components/pro-tools/panels/session-manager-panel.tsx
- src/components/pro-tools/panels/session-manager-panel.test.tsx
- src/components/pro-tools/panels/state-inspector-panel.tsx
- src/components/pro-tools/panels/state-inspector-panel.test.tsx
- src/components/pro-tools/panels/secrets-panel.tsx
- src/components/pro-tools/panels/secrets-panel.test.tsx
- src/components/pro-tools/panels/config-editor-panel.tsx
- src/components/pro-tools/panels/config-editor-panel.test.tsx
- src/components/pro-tools/panels/index.ts
- src/router.tsx
- src/components/pro-tools/panels/benchmarks-panel.tsx
- src/components/pro-tools/panels/benchmarks-panel.test.tsx
- src/components/pro-tools/panels/resource-monitor-panel.tsx
- src/components/pro-tools/panels/resource-monitor-panel.test.tsx
- src/components/pro-tools/panels/prompt-lab-panel.tsx
- src/components/pro-tools/panels/prompt-lab-panel.test.tsx
- src/components/pro-tools/panels/ab-testing-panel.tsx
- src/components/pro-tools/panels/ab-testing-panel.test.tsx
- src/components/pro-tools/panels/dependency-graph-panel.tsx
- src/components/pro-tools/panels/dependency-graph-panel.test.tsx
- src/components/pro-tools/panels/coverage-map-panel.tsx
- src/components/pro-tools/panels/coverage-map-panel.test.tsx
- src/components/pro-tools/panels/token-usage-panel.tsx
- src/components/pro-tools/panels/token-usage-panel.test.tsx
- src/components/pro-tools/panels/theme-preview-panel.tsx
- src/components/pro-tools/panels/theme-preview-panel.test.tsx
