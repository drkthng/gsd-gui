# S05: E2E test infrastructure

**Goal:** Playwright runs 7 core flow E2E tests against the Vite dev server, covering navigation, sidebar, pro tools, keyboard shortcuts, toasts, settings, and routing.
**Demo:** Playwright runs 7 core flow tests against the dev build

## Must-Haves

- Playwright installed and configured to test against http://localhost:1420
- 7 E2E test files exist covering core app flows
- `npx playwright test` passes all 7 test files
- Test helpers/fixtures established for reuse

## Proof Level

- This slice proves: Contract — E2E tests exercise the real React frontend via Playwright browser automation against the Vite dev server.

## Integration Closure

- Upstream consumed: Vite dev server (localhost:1420), all routes from src/router.tsx, keyboard shortcuts from S04
- New wiring: Playwright config pointing at Vite dev server with webServer auto-start
- Remaining for milestone: S06 (packaging/CI)

## Verification

- None — test infrastructure only, no runtime changes.

## Tasks

- [x] **T01: Install Playwright and configure E2E test infrastructure** `est:30m`
  Install Playwright as a dev dependency, create playwright.config.ts pointing at the Vite dev server (localhost:1420) with webServer auto-start, create shared test fixtures/helpers, and write one smoke test to prove the infrastructure works.
  - Files: `package.json`, `playwright.config.ts`, `e2e/fixtures.ts`, `e2e/smoke.spec.ts`
  - Verify: npx playwright test e2e/smoke.spec.ts --reporter=list

- [x] **T02: Write 7 E2E tests covering core app flows** `est:1h`
  Write 7 Playwright E2E test files covering: (1) app launch and default route, (2) sidebar navigation across all 7 views, (3) Pro Tools grid and panel navigation, (4) keyboard shortcuts (Ctrl+1-7 tab switching), (5) settings page interaction, (6) toast notifications on GSD events, (7) deep-link routing to pro-tool panels. Each test uses the shared fixtures from T01.
  - Files: `e2e/app-launch.spec.ts`, `e2e/sidebar-navigation.spec.ts`, `e2e/pro-tools.spec.ts`, `e2e/keyboard-shortcuts.spec.ts`, `e2e/settings.spec.ts`, `e2e/toast-notifications.spec.ts`, `e2e/routing.spec.ts`
  - Verify: npx playwright test --reporter=list

## Files Likely Touched

- package.json
- playwright.config.ts
- e2e/fixtures.ts
- e2e/smoke.spec.ts
- e2e/app-launch.spec.ts
- e2e/sidebar-navigation.spec.ts
- e2e/pro-tools.spec.ts
- e2e/keyboard-shortcuts.spec.ts
- e2e/settings.spec.ts
- e2e/toast-notifications.spec.ts
- e2e/routing.spec.ts
