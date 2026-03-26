---
id: T03
parent: S01
milestone: M001
provides:
  - Vitest 4 test runner with jsdom environment and @testing-library/react
  - @testing-library/jest-dom matchers auto-registered via setup file
  - Passing smoke test proving React component rendering in test environment
  - npm scripts: test (vitest run) and test:watch (vitest)
key_files:
  - vitest.config.ts
  - src/test/setup.ts
  - src/App.test.tsx
  - package.json
key_decisions:
  - Separate vitest.config.ts rather than inlining test config in vite.config.ts — keeps build and test concerns decoupled
  - Added vitest/globals types to tsconfig.app.json to support globals:true without explicit imports (though smoke test uses explicit imports for clarity)
patterns_established:
  - Test setup file at src/test/setup.ts imports @testing-library/jest-dom/vitest for auto-registered matchers
  - Vitest config mirrors vite.config.ts path aliases so @/ works in test files
  - Test files co-located with source files using .test.tsx naming convention
observability_surfaces:
  - "npm run test exit code and Vitest output — 0 means all tests pass, non-zero shows failures with file:line and assertion diffs"
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T03: Set up Vitest + @testing-library/react with smoke test

**Installed Vitest 4 + @testing-library/react test infrastructure with jsdom environment, jest-dom matchers, @/ path alias support, and a passing App smoke test**

## What Happened

Installed five test dev dependencies (vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event). Created `vitest.config.ts` with jsdom environment, globals enabled, setup file reference, and path alias resolution matching `vite.config.ts`. Created `src/test/setup.ts` importing `@testing-library/jest-dom/vitest` for auto-registered matchers. Wrote `src/App.test.tsx` smoke test that renders `<App />` and asserts `screen.getByText("GSD")` is in the document. Added `test` and `test:watch` scripts to package.json. Also added `vitest.config.ts` to `tsconfig.node.json` include list and `vitest/globals` types to `tsconfig.app.json` so TypeScript fully understands the test environment.

## Verification

- `npm run test` — exits 0, 1 test file, 1 test passed (App smoke test)
- `npm run build` — exits 0, tsc + vite build succeed with zero errors
- `test -f vitest.config.ts` — PASS
- `test -f src/test/setup.ts` — PASS
- `test -f src/App.test.tsx` — PASS
- `test -f src-tauri/tauri.conf.json` — PASS
- `grep -q '"GSD"' src-tauri/tauri.conf.json` — PASS

All slice-level verification checks pass. This is the final task of S01; all checks are green.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test` | 0 | ✅ pass | 10.4s |
| 2 | `npm run build` | 0 | ✅ pass | 5.6s |
| 3 | `test -f src-tauri/tauri.conf.json` | 0 | ✅ pass | <1s |
| 4 | `grep -q '"GSD"' src-tauri/tauri.conf.json` | 0 | ✅ pass | <1s |
| 5 | `test -f vitest.config.ts` | 0 | ✅ pass | <1s |
| 6 | `test -f src/test/setup.ts` | 0 | ✅ pass | <1s |
| 7 | `test -f src/App.test.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- `npm run test` — run all tests, exit code 0 = healthy, non-zero = failures with file:line detail
- `npm run test:watch` — interactive watch mode for development
- Vitest output includes transform time, setup time, and environment init time for performance diagnosis

## Deviations

- Added `vitest/globals` types to `tsconfig.app.json` — not in plan but necessary for TypeScript to recognize global test APIs like `describe`, `it`, `expect` when `globals: true` is set
- Added `vitest.config.ts` to `tsconfig.node.json` include list — not in plan but necessary for TypeScript project references to recognize the config file

## Known Issues

None.

## Files Created/Modified

- `vitest.config.ts` — new, Vitest configuration with jsdom, globals, setup file, path aliases, and CSS support
- `src/test/setup.ts` — new, imports @testing-library/jest-dom/vitest for matcher registration
- `src/App.test.tsx` — new, smoke test rendering App component and asserting "GSD" text
- `package.json` — added test dependencies and test/test:watch scripts
- `tsconfig.app.json` — added vitest/globals types for global test API recognition
- `tsconfig.node.json` — added vitest.config.ts to include list
