---
estimated_steps: 4
estimated_files: 4
skills_used:
  - test
---

# T03: Set up Vitest + @testing-library/react with smoke test

**Slice:** S01 — Tauri + Vite + React scaffold with TDD infrastructure
**Milestone:** M001

## Description

Install and configure the test infrastructure that every subsequent slice depends on. Vitest provides the test runner, @testing-library/react provides component testing utilities, and jsdom provides the browser environment. A smoke test verifies the full chain works: React component renders in jsdom via Vitest with testing-library assertions. This proves R008 (TDD constraint) is achievable from the very first slice.

## Steps

1. Install test dependencies: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`. Verify they appear in `package.json` devDependencies.
2. Create `vitest.config.ts` at project root. Configure: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`, path alias resolution matching vite.config.ts (`'@': path.resolve(__dirname, './src')`), and `css: true`. Use `defineConfig` from `vitest/config`. Include pattern `'src/**/*.{test,spec}.{ts,tsx}'`.
3. Create `src/test/setup.ts` that imports `'@testing-library/jest-dom/vitest'`. This auto-registers matchers like `toBeInTheDocument()`, `toHaveTextContent()`, etc.
4. Write `src/App.test.tsx`: import `{ render, screen }` from `@testing-library/react`, import `App` from `@/App`, write a test `'renders without crashing'` that calls `render(<App />)` and asserts `expect(screen.getByText('GSD')).toBeInTheDocument()`. Add test scripts to package.json: `"test": "vitest run"` and `"test:watch": "vitest"`.

## Must-Haves

- [ ] Vitest configured with jsdom environment and setup file
- [ ] @testing-library/react and @testing-library/jest-dom installed and working
- [ ] Path aliases (`@/`) resolve correctly in test files
- [ ] `src/test/setup.ts` imports jest-dom matchers
- [ ] `src/App.test.tsx` smoke test exists and passes
- [ ] `npm run test` script runs vitest and exits 0

## Verification

- `npm run test` exits 0 with at least 1 passing test
- `test -f vitest.config.ts` (config file exists)
- `test -f src/test/setup.ts` (setup file exists)
- `test -f src/App.test.tsx` (smoke test exists)

## Observability Impact

- Signals added/changed: none — test infrastructure only, no runtime behavior
- How a future agent inspects this: `npm run test` exit code and test result output
- Failure state exposed: Vitest reports failing tests with file paths, line numbers, and assertion diffs

## Inputs

- `package.json` — project manifest from T01/T02
- `vite.config.ts` — Vite config with path aliases from T01 (vitest config must mirror the alias setup)
- `tsconfig.app.json` — TypeScript config with path aliases from T01
- `src/App.tsx` — App component to test, from T01

## Expected Output

- `vitest.config.ts` — Vitest configuration file
- `src/test/setup.ts` — test setup with jest-dom matchers
- `src/App.test.tsx` — smoke test for App component
- `package.json` — updated with test dependencies and test scripts
