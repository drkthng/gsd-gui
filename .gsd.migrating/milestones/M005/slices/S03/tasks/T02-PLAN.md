---
estimated_steps: 7
estimated_files: 10
skills_used: []
---

# T02: Build benchmarks, resource-monitor, prompt-lab, and ab-testing panels

Create 4 Tuning category panels following the same established pattern. Add co-located tests. Wire routes into router.tsx and barrel exports.

Panel specs:
- benchmarks: Mock benchmark results with id, name, duration (ms), status (passed/failed/running), score
- resource-monitor: Mock resource entries with id, resource (CPU/Memory/Disk/Network), usage (percentage string), status (healthy/warning/critical)
- prompt-lab: Mock prompt experiments with id, name, model, tokens, score
- ab-testing: Mock A/B test configs with id, name, variantA, variantB, winner (A/B/pending)

Follow exact same pattern as T01 panels and existing debugger-panel.tsx.

## Inputs

- ``src/components/pro-tools/panels/debugger-panel.tsx` — reference pattern`
- ``src/components/pro-tools/panels/debugger-panel.test.tsx` — test pattern`
- ``src/components/pro-tools/pro-tool-panel.tsx` — wrapper component`
- ``src/components/pro-tools/panels/index.ts` — barrel export from T01`
- ``src/router.tsx` — routes from T01`

## Expected Output

- ``src/components/pro-tools/panels/benchmarks-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/benchmarks-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/resource-monitor-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/resource-monitor-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/prompt-lab-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/prompt-lab-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/ab-testing-panel.tsx` — new panel`
- ``src/components/pro-tools/panels/ab-testing-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/index.ts` — updated barrel with 4 more exports`
- ``src/router.tsx` — 4 more routes added`

## Verification

npx vitest --run -- benchmarks-panel resource-monitor-panel prompt-lab-panel ab-testing-panel && npx vitest --run
