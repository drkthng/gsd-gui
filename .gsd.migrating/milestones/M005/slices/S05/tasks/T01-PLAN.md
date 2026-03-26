---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T01: Install Playwright and configure E2E test infrastructure

Install Playwright as a dev dependency, create playwright.config.ts pointing at the Vite dev server (localhost:1420) with webServer auto-start, create shared test fixtures/helpers, and write one smoke test to prove the infrastructure works.

## Inputs

- ``package.json` — add Playwright dev dependency`
- ``vite.config.ts` — reference for dev server port (1420)`
- ``src/router.tsx` — reference for available routes`

## Expected Output

- ``package.json` — updated with @playwright/test dependency and test:e2e script`
- ``playwright.config.ts` — Playwright config with webServer pointing to Vite dev`
- ``e2e/fixtures.ts` — shared test fixtures and helpers`
- ``e2e/smoke.spec.ts` — smoke test proving infrastructure works`

## Verification

npx playwright test e2e/smoke.spec.ts --reporter=list
