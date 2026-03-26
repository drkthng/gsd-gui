---
id: T02
parent: S01
milestone: M001
provides:
  - Tauri 2 desktop shell (src-tauri/) with Rust backend scaffold
  - Tauri window config: 1200×800 default, 900×600 minimum, title "GSD"
  - npm run tauri script for Tauri CLI access
  - Vite dev server pinned to port 1420 matching Tauri devUrl
key_files:
  - src-tauri/tauri.conf.json
  - src-tauri/Cargo.toml
  - src-tauri/src/main.rs
  - src-tauri/src/lib.rs
  - src-tauri/build.rs
  - package.json
  - vite.config.ts
key_decisions:
  - Manually scaffolded src-tauri/ instead of npx @tauri-apps/cli init (CLI requires interactive terminal, fails in non-TTY)
  - Installed @tauri-apps/cli as devDependency so "tauri" script resolves without npx
  - Pinned Vite dev server to port 1420 with strictPort to match Tauri devUrl convention
patterns_established:
  - Tauri 2 lib.rs exports pub fn run() called from main.rs — standard desktop/mobile split pattern
  - Vite server.port and server.strictPort ensure consistent devUrl for Tauri integration
observability_surfaces:
  - Check src-tauri/tauri.conf.json for window config values
  - npm run tauri info will show Tauri environment diagnostics (requires Rust toolchain)
duration: 5m
verification_result: passed
completed_at: 2026-03-24T14:34:00+01:00
blocker_discovered: false
---

# T02: Initialize Tauri 2 backend and configure app window

**Added Tauri 2 desktop shell with src-tauri/ Rust backend, GSD window config (1200×800, min 900×600), and npm tauri script**

## What Happened

Manually scaffolded the `src-tauri/` directory with all required Tauri 2 files since `npx @tauri-apps/cli init` fails in non-interactive terminals ("failed to prompt input: IO error: not a terminal"). Created `tauri.conf.json` with the exact window dimensions (1200×800 default, 900×600 minimum), title "GSD", productName "GSD", devUrl pointing to `http://localhost:1420`, and frontendDist pointing to `../dist`. Created `Cargo.toml` with tauri 2 and tauri-build 2 dependencies, `build.rs` calling `tauri_build::build()`, `src/lib.rs` with the standard `run()` function using `tauri::Builder`, and `src/main.rs` calling `gsd_ui_lib::run()`. Updated `vite.config.ts` to pin the dev server to port 1420 with `strictPort: true` to match the Tauri devUrl. Added the `"tauri": "tauri"` script to `package.json` and installed `@tauri-apps/cli` as a devDependency.

## Verification

All task-level and applicable slice-level checks pass:
- `src-tauri/tauri.conf.json` exists and contains "GSD"
- `src-tauri/Cargo.toml` exists with tauri 2 dependencies
- All Rust source files (main.rs, lib.rs, build.rs) present
- Window config values verified programmatically: title, width, height, minWidth, minHeight, devUrl, frontendDist all correct
- `npm run build` still passes (Vite production build succeeds)
- `npm run test` fails as expected (test script not yet added — T03)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f src-tauri/tauri.conf.json` | 0 | ✅ pass | 0.0s |
| 2 | `grep -q '"GSD"' src-tauri/tauri.conf.json` | 0 | ✅ pass | 0.0s |
| 3 | `test -f src-tauri/Cargo.toml` | 0 | ✅ pass | 0.0s |
| 4 | `npm run build` (slice check) | 0 | ✅ pass | 2.9s |
| 5 | `npm run test` (slice check) | 1 | ⏳ expected fail (T03) | 0.1s |
| 6 | Config value validation (node script) | 0 | ✅ pass | 0.1s |

## Diagnostics

- Inspect `src-tauri/tauri.conf.json` for window dimensions, devUrl, and frontendDist
- `npm run tauri info` shows Tauri environment status (requires Rust toolchain installed)
- `npm run build` exit code confirms frontend build health (Tauri does not compile Rust in this task)

## Deviations

- Manually scaffolded `src-tauri/` instead of using `npx @tauri-apps/cli init` — the CLI requires interactive terminal input even when flags are provided, and the non-TTY environment causes it to fail with "IO error: not a terminal".
- Added `@tauri-apps/cli` as a devDependency rather than relying on npx — ensures `npm run tauri` resolves the binary directly from `node_modules/.bin/`.
- Pinned Vite dev server to port 1420 with `strictPort: true` in `vite.config.ts` — Tauri's default devUrl convention uses 1420, which differs from Vite's default 5173.

## Known Issues

None.

## Files Created/Modified

- `src-tauri/tauri.conf.json` — Tauri config with window dimensions, title "GSD", devUrl, frontendDist
- `src-tauri/Cargo.toml` — Rust project manifest with tauri 2 and serde dependencies
- `src-tauri/build.rs` — Tauri build script calling tauri_build::build()
- `src-tauri/src/lib.rs` — Tauri lib with run() function using Builder::default()
- `src-tauri/src/main.rs` — Desktop entry point calling gsd_ui_lib::run()
- `package.json` — added "tauri" script and @tauri-apps/cli devDependency
- `vite.config.ts` — added server.port 1420 and server.strictPort for Tauri integration
