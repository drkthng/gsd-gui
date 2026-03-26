# S01: Tauri + Vite + React scaffold with TDD infrastructure

**Goal:** Establish the complete project scaffold — Tauri 2 desktop app with React 19 + Vite 6 + TypeScript, path aliases, and a working Vitest + @testing-library/react test setup.
**Demo:** `npm run dev` launches Vite dev server, `npm run tauri dev` opens a Tauri window rendering a blank React app, `npm run test` runs Vitest with a passing smoke test.

## Must-Haves

- Tauri 2 project structure with `src-tauri/` Rust backend and `src/` React frontend
- React 19 + TypeScript 5.7+ with Vite 6 as the build tool
- TypeScript path aliases (`@/` → `src/`) configured in both `tsconfig.json` and `vite.config.ts`
- Tauri window config: 1200×800 default, 900×600 minimum, title "GSD"
- Vitest configured with @testing-library/react and jsdom environment
- Test setup file at `src/test/setup.ts` importing @testing-library/jest-dom matchers
- A passing smoke test that verifies React renders in the test environment
- Package scripts: `dev`, `build`, `test`, `tauri dev`, `tauri build`

## Proof Level

- This slice proves: integration (Tauri 2 + React 19 + Vite 6 + Vitest work together)
- Real runtime required: yes (Tauri dev mode must launch)
- Human/UAT required: no

## Verification

- `npm run test` — all Vitest tests pass; specifically `src/App.test.tsx` smoke test proves React + testing-library + jsdom work
- `npm run build` — Vite production build succeeds with zero errors
- `test -f src-tauri/tauri.conf.json` — Tauri config exists with correct window dimensions
- `grep -q '"GSD"' src-tauri/tauri.conf.json` — Window title is "GSD"

## Observability / Diagnostics

- Runtime signals: none — this is a scaffolding slice with no runtime behavior
- Inspection surfaces: `npm run build` exit code, `npm run test` exit code
- Failure visibility: Vite and Vitest error output on stderr
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced in this slice: Tauri + Vite dev server bridge, TypeScript path alias resolution in both Vite and tsc
- What remains before the milestone is truly usable end-to-end: S02 (Tailwind + shadcn/ui + Zustand + IPC), S03 (app shell + routing), S04 (theme + polish)

## Tasks

- [x] **T01: Scaffold React 19 + Vite 6 + TypeScript frontend with path aliases** `est:30m`
  - Why: Creates the frontend foundation — every subsequent task depends on a working React + Vite + TypeScript project with path aliases.
  - Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/vite-env.d.ts`
  - Do: Initialize with `npm create vite@latest . -- --template react-ts`. Upgrade to React 19 if template installs 18. Configure path alias `@/` → `src/` in both `vite.config.ts` and `tsconfig.app.json`. Clean up boilerplate counter/logo content from App.tsx — replace with minimal `<h1>GSD</h1>`. Clear demo styles from App.css.
  - Verify: `npm run build` succeeds with zero errors
  - Done when: `npm run build` exits 0 and `package.json` shows React 19 in dependencies.

- [x] **T02: Initialize Tauri 2 backend and configure app window** `est:20m`
  - Why: Adds the Tauri 2 desktop shell around the Vite+React frontend. Proves R001 (Tauri 2 app) by creating the Rust backend and window configuration.
  - Files: `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `package.json`
  - Do: Run `npx @tauri-apps/cli init` to scaffold `src-tauri/`. Configure window in `tauri.conf.json`: title "GSD", width 1200, height 800, minWidth 900, minHeight 600. Set `productName` to "GSD". Ensure `package.json` has `tauri` script. Do NOT run `cargo build` or `npm run tauri dev` — just verify the config files are correct.
  - Verify: `test -f src-tauri/tauri.conf.json && grep -q '"GSD"' src-tauri/tauri.conf.json`
  - Done when: `src-tauri/` directory exists with valid `tauri.conf.json` showing correct window dimensions and title.

- [x] **T03: Set up Vitest + @testing-library/react with smoke test** `est:30m`
  - Why: Establishes the TDD infrastructure that every subsequent slice depends on. R008 (TDD constraint) requires test tooling before any implementation.
  - Files: `vitest.config.ts`, `src/test/setup.ts`, `src/App.test.tsx`, `package.json`
  - Do: Install vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom as dev dependencies. Create `vitest.config.ts` with jsdom environment, path alias resolution matching vite.config.ts, and setup file pointing to `src/test/setup.ts`. Create `src/test/setup.ts` that imports `@testing-library/jest-dom/vitest`. Write `src/App.test.tsx` — a smoke test that renders `<App />` and asserts `screen.getByText('GSD')` is in the document. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to package.json.
  - Verify: `npm run test` passes with the smoke test green
  - Done when: `npm run test` exits 0 with at least 1 passing test reported.

## Files Likely Touched

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/App.test.tsx`
- `src/vite-env.d.ts`
- `src/test/setup.ts`
- `vitest.config.ts`
- `src-tauri/tauri.conf.json`
- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/Cargo.toml`
- `src-tauri/build.rs`
