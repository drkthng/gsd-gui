---
id: T01
parent: S05
milestone: M005
key_files:
  - playwright.config.ts
  - e2e/fixtures.ts
  - e2e/smoke.spec.ts
  - package.json
key_decisions:
  - Used webServer config to auto-start Vite dev server rather than requiring manual startup
  - Installed only Chromium browser to keep CI fast
duration: ""
verification_result: passed
completed_at: 2026-03-25T14:39:01.991Z
blocker_discovered: false
---

# T01: Install Playwright, configure E2E test infrastructure with webServer auto-start, and verify with passing smoke test

**Install Playwright, configure E2E test infrastructure with webServer auto-start, and verify with passing smoke test**

## What Happened

Installed @playwright/test as a dev dependency and Chromium browser. Created playwright.config.ts pointing at the Vite dev server on localhost:1420 with webServer auto-start. Created shared fixtures in e2e/fixtures.ts with an appReady fixture for shell rendering. Wrote a smoke test in e2e/smoke.spec.ts that loads the app and verifies the shell renders. Added test:e2e npm script. The smoke test passes in 26s including dev server startup.

## Verification

Ran `npx playwright test e2e/smoke.spec.ts --reporter=list` — 1 test passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx playwright test e2e/smoke.spec.ts --reporter=list` | 0 | ✅ pass | 34100ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `playwright.config.ts`
- `e2e/fixtures.ts`
- `e2e/smoke.spec.ts`
- `package.json`
