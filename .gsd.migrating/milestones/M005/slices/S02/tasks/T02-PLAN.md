---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T02: Wire Diagnostics panels into router

Add routes for the 4 Diagnostics panels so they are navigable at /pro-tools/log-viewer, /pro-tools/debugger, /pro-tools/metrics, /pro-tools/trace-viewer. Add route tests.

Steps:
1. Import the 4 panels in src/router.tsx from the panels barrel export.
2. Add child routes under /pro-tools for each panel id matching the paths in panelCategories.
3. Add tests in src/router.test.tsx verifying each diagnostics route renders the correct panel heading.
4. Run full test suite to confirm no regressions (235+ tests pass).

## Inputs

- ``src/components/pro-tools/panels/index.ts` — barrel export with new panels`
- ``src/router.tsx` — existing router to add routes to`
- ``src/router.test.tsx` — existing route tests to extend`

## Expected Output

- ``src/router.tsx` — updated with 4 diagnostics panel routes`
- ``src/router.test.tsx` — updated with diagnostics route tests`

## Verification

npx vitest --run
