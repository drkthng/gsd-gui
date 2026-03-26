---
id: S01
parent: M001
milestone: M001
provides:
  - Tauri 2 project structure with src-tauri/ Rust backend and src/ React frontend
  - Vite 6 config with @/ path alias and port 1420 for Tauri integration
  - React 19 entry point (src/main.tsx, src/App.tsx) rendering minimal GSD heading
  - TypeScript 5.7+ config (tsconfig.json, tsconfig.app.json, tsconfig.node.json)
  - Vitest 4 + @testing-library/react + jsdom test infrastructure
  - Test setup file (src/test/setup.ts) with jest-dom matchers auto-registered
  - Passing smoke test (src/App.test.tsx)
  - Package scripts: dev, build, test, test:watch, tauri
requires:
  - slice: none
    provides: first slice — no upstream dependencies
affects:
  - S02
key_files:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.app.json
  - tsconfig.node.json
  - index.html
  - src/main.tsx
  - src/App.tsx
  - src/App.css
  - src/App.test.tsx
  - src/vite-env.d.ts
  - src/test/setup.ts
  - vitest.config.ts
  - src-tauri/tauri.conf.json
  - src-tauri/Cargo.toml
  - src-tauri/build.rs
  - src-tauri/src/main.rs
  - src-tauri/src/lib.rs
key_decisions:
  - Manually scaffolded Vite project and src-tauri/ instead of using interactive CLIs (npm create vite, npx @tauri-apps/cli init) — both fail in non-TTY environments
  - Separate vitest.config.ts rather than inlining test config in vite.config.ts — keeps build and test concerns decoupled
  - Pinned Vite dev server to port 1420 with strictPort to match Tauri devUrl convention
  - Installed @tauri-apps/cli as devDependency so "tauri" script resolves without npx
  - Used fileURLToPath(import.meta.url) for __dirname equivalent in ESM vite.config.ts
patterns_established:
  - Path alias @/ → src/ configured in tsconfig.app.json (baseUrl + paths) and vite.config.ts (resolve.alias) — must be mirrored in vitest.config.ts too
  - ESM-compatible Vite config using import.meta.url for directory resolution (no __dirname in ESM)
  - Tauri 2 lib.rs exports pub fn run() called from main.rs — standard desktop/mobile split pattern
  - Vite server.port 1420 + server.strictPort ensures consistent devUrl for Tauri integration
  - Test setup file at src/test/setup.ts imports @testing-library/jest-dom/vitest for auto-registered matchers
  - Test files co-located with source files using .test.tsx naming convention
observability_surfaces:
  - "npm run build exit code — 0 means tsc + vite both pass"
  - "npm run test exit code and Vitest output — 0 means all tests pass"
  - "npm run tauri info — shows Tauri environment diagnostics (requires Rust toolchain)"
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: 21m
verification_result: passed
completed_at: 2026-03-24T14:38:00+01:00
---

# S01: Tauri + Vite + React scaffold with TDD infrastructure

**Complete project scaffold — Tauri 2 desktop shell + React 19 + Vite 6 + TypeScript + Vitest test infrastructure with passing smoke test**

## What Happened

Built the full project foundation in three tasks. T01 scaffolded the React 19 + Vite 6 + TypeScript frontend — package.json with all dependencies, three tsconfig files, vite.config.ts with React plugin and `@/` path alias, index.html entry point, and a minimal `src/App.tsx` rendering `<h1>GSD</h1>`. Both the Vite project and src-tauri/ were scaffolded manually rather than using interactive CLIs, since `npm create vite` and `npx @tauri-apps/cli init` both fail in non-TTY agent environments.

T02 added the Tauri 2 desktop shell — `src-tauri/` directory with `tauri.conf.json` (window: 1200×800 default, 900×600 minimum, title "GSD"), `Cargo.toml` with tauri 2 dependencies, and Rust source files (`main.rs`, `lib.rs`, `build.rs`). Vite's dev server was pinned to port 1420 with `strictPort: true` to match Tauri's devUrl convention. `@tauri-apps/cli` was installed as a devDependency for the `npm run tauri` script.

T03 completed the TDD infrastructure — Vitest 4 with jsdom environment, @testing-library/react, jest-dom matchers auto-registered via `src/test/setup.ts`, and a passing smoke test in `src/App.test.tsx` that renders `<App />` and asserts `screen.getByText("GSD")` is in the document. The vitest.config.ts mirrors the path alias from vite.config.ts so `@/` works in test files. Added `vitest/globals` types to tsconfig.app.json for global test API recognition.

## Verification

All slice-level checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `npm run test` — Vitest runs, 1 test passes | ✅ pass (exit 0) |
| 2 | `npm run build` — tsc + Vite production build | ✅ pass (exit 0) |
| 3 | `src-tauri/tauri.conf.json` exists | ✅ pass |
| 4 | `tauri.conf.json` contains "GSD" | ✅ pass |
| 5 | Window config: 1200×800, min 900×600, title "GSD" | ✅ pass (verified programmatically) |
| 6 | React 19 in package.json | ✅ pass |
| 7 | `vitest.config.ts` exists | ✅ pass |
| 8 | `src/test/setup.ts` exists | ✅ pass |
| 9 | `src/App.test.tsx` exists | ✅ pass |

## Requirements Advanced

- **R001** — Tauri 2 project structure created with correct window config (1200×800, min 900×600). Desktop shell scaffolded. Full validation requires `npm run tauri dev` launch (needs Rust toolchain, tested in UAT).
- **R002** — Validated. React 19 + TypeScript 5.7+ + Vite 6 confirmed. `npm run build` (tsc + vite) succeeds.
- **R008** — TDD infrastructure established. Vitest 4 + @testing-library/react + jest-dom matchers working. Smoke test passes. Every subsequent slice has the tooling to write tests before implementation.

## New Requirements Surfaced

- none

## Deviations

- Both Vite and Tauri scaffolders were bypassed in favor of manual file creation — the interactive CLIs require TTY input and fail in agent/non-interactive environments. This is a known pattern for CI and automation contexts.
- `@types/node` added as devDependency (not in original plan) — required for `node:path` and `node:url` imports in ESM vite.config.ts.
- `vitest/globals` types added to `tsconfig.app.json` (not in original plan) — necessary for TypeScript to recognize global test APIs when `globals: true` is set in vitest.config.ts.
- `vitest.config.ts` added to `tsconfig.node.json` include list (not in original plan) — necessary for TypeScript project references to recognize the config file.

## Known Limitations

- Rust compilation not tested — `src-tauri/` is scaffolded but `cargo build` was not run. Tauri dev mode requires a Rust toolchain installed on the machine. The Rust source files follow standard Tauri 2 patterns and should compile, but this is only proven when `npm run tauri dev` is first run (expected in UAT or S02).
- No CSS framework yet — App.css is empty. Tailwind CSS 4 and shadcn/ui are added in S02.
- No runtime behavior — the app renders a static `<h1>GSD</h1>`. All interactive behavior starts in S02+.

## Follow-ups

- none — all planned work completed successfully with no discovered issues.

## Files Created/Modified

- `package.json` — project manifest with React 19, Vite 6, TypeScript 5.7, Vitest 4, @testing-library/*, @tauri-apps/cli
- `package-lock.json` — npm lockfile
- `index.html` — Vite entry HTML with root div and module script
- `vite.config.ts` — Vite config with React plugin, @/ path alias, port 1420, strictPort
- `tsconfig.json` — root TS config referencing app and node configs
- `tsconfig.app.json` — app TS config with baseUrl/paths for @/ alias, vitest/globals types
- `tsconfig.node.json` — node TS config for vite.config.ts and vitest.config.ts
- `vitest.config.ts` — Vitest config with jsdom, globals, setup file, @/ path alias
- `src/main.tsx` — React app entry, renders App in StrictMode
- `src/App.tsx` — minimal component rendering `<h1>GSD</h1>`
- `src/App.css` — empty CSS file (cleared boilerplate)
- `src/App.test.tsx` — smoke test rendering App and asserting "GSD" text
- `src/vite-env.d.ts` — Vite client type reference
- `src/test/setup.ts` — imports @testing-library/jest-dom/vitest for matcher registration
- `src-tauri/tauri.conf.json` — Tauri config: window 1200×800, min 900×600, title "GSD", devUrl, frontendDist
- `src-tauri/Cargo.toml` — Rust project manifest with tauri 2, serde, tauri-build 2
- `src-tauri/build.rs` — Tauri build script
- `src-tauri/src/lib.rs` — Tauri lib with run() function
- `src-tauri/src/main.rs` — Desktop entry point calling gsd_ui_lib::run()

## Forward Intelligence

### What the next slice should know
- The `@/` path alias is configured in THREE places: `tsconfig.app.json`, `vite.config.ts`, and `vitest.config.ts`. When adding new aliases or changing the mapping, all three must be updated in sync.
- Vite dev server is pinned to port 1420 (`server.port` + `server.strictPort: true`). This matches `src-tauri/tauri.conf.json` devUrl. Do not change one without the other.
- The vitest.config.ts is separate from vite.config.ts by design. Don't try to merge them — test and build configs have different concerns (jsdom environment, globals, setup files vs. production build).

### What's fragile
- **Path alias sync across 3 files** — if `@/` resolution breaks in tests but works in dev, check that `vitest.config.ts` has the same `resolve.alias` as `vite.config.ts`. This is the most likely misconfiguration when adding new imports.
- **Tauri devUrl ↔ Vite port coupling** — `tauri.conf.json` hardcodes `http://localhost:1420` as devUrl. If Vite's port drifts (e.g., someone removes `strictPort`), the Tauri window will show a blank page.

### Authoritative diagnostics
- `npm run build` exit code — the single most reliable health check. If it passes, tsc and Vite are both happy. Run this after any config change.
- `npm run test` exit code — confirms the test toolchain works. Vitest output includes transform time, setup time, and environment init time for diagnosing slow tests.

### What assumptions changed
- **Original assumption: CLI scaffolders work in non-interactive environments** — they don't. Both `npm create vite` and `npx @tauri-apps/cli init` require interactive terminal input. Manual scaffolding is the reliable path for automated/agent workflows. This will likely apply to `npx shadcn@latest init` in S02 as well.
