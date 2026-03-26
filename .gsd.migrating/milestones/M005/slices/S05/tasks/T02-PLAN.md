---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T02: Write 7 E2E tests covering core app flows

Write 7 Playwright E2E test files covering: (1) app launch and default route, (2) sidebar navigation across all 7 views, (3) Pro Tools grid and panel navigation, (4) keyboard shortcuts (Ctrl+1-7 tab switching), (5) settings page interaction, (6) toast notifications on GSD events, (7) deep-link routing to pro-tool panels. Each test uses the shared fixtures from T01.

## Inputs

- ``playwright.config.ts` — Playwright configuration from T01`
- ``e2e/fixtures.ts` — shared fixtures from T01`
- ``e2e/smoke.spec.ts` — pattern reference from T01`
- ``src/router.tsx` — route definitions for navigation tests`
- ``src/components/app-shell/sidebar-nav.tsx` — nav items for sidebar tests`
- ``src/hooks/use-keyboard-shortcuts.ts` — shortcut bindings for keyboard tests`

## Expected Output

- ``e2e/app-launch.spec.ts` — test: app loads, redirects to /chat, shows heading`
- ``e2e/sidebar-navigation.spec.ts` — test: click each of 7 sidebar nav items, verify URL and heading`
- ``e2e/pro-tools.spec.ts` — test: pro tools grid renders categories, click into a panel`
- ``e2e/keyboard-shortcuts.spec.ts` — test: Ctrl+1-7 switches tabs, Escape triggers action`
- ``e2e/settings.spec.ts` — test: settings page renders, theme toggle works`
- ``e2e/toast-notifications.spec.ts` — test: toast appears on relevant GSD event`
- ``e2e/routing.spec.ts` — test: deep-link to /pro-tools/log-viewer renders correct panel`

## Verification

npx playwright test --reporter=list
