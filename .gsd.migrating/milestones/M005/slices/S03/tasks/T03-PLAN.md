---
estimated_steps: 7
estimated_files: 10
skills_used: []
---

# T03: Build dependency-graph, coverage-map, token-usage, and theme-preview panels

Create the final 4 Visualization category panels. Add co-located tests. Wire routes into router.tsx and barrel exports. Run full test suite to verify all 255+ tests still pass plus the new ones.

Panel specs:
- dependency-graph: Mock dependency nodes with id, name, type (direct/dev/peer), version, dependents count
- coverage-map: Mock coverage entries with id, file, statements (%), branches (%), functions (%), status (covered/partial/uncovered)
- token-usage: Mock token usage records with id, model, inputTokens, outputTokens, cost, date
- theme-preview: Mock theme entries with id, name, primary color, mode (light/dark/system), active boolean

After this task, all 19 panels are built and routed. Full test suite must pass with 255+ baseline maintained.

## Inputs

- ``src/components/pro-tools/panels/debugger-panel.tsx` — reference pattern`
- ``src/components/pro-tools/panels/debugger-panel.test.tsx` — test pattern`
- ``src/components/pro-tools/pro-tool-panel.tsx` — wrapper component`
- ``src/components/pro-tools/panels/index.ts` — barrel export from T02`
- ``src/router.tsx` — routes from T02`

## Expected Output

- ``src/components/pro-tools/panels/dependency-graph-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/dependency-graph-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/coverage-map-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/coverage-map-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/token-usage-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/token-usage-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/theme-preview-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/theme-preview-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/index.ts` — final barrel with all 19 panel exports`
- ``src/router.tsx` — all 19 panel routes complete`

## Verification

npx vitest --run -- dependency-graph-panel coverage-map-panel token-usage-panel theme-preview-panel && npx vitest --run
