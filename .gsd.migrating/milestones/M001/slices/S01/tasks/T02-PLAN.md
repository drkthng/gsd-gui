---
estimated_steps: 3
estimated_files: 6
skills_used: []
---

# T02: Initialize Tauri 2 backend and configure app window

**Slice:** S01 — Tauri + Vite + React scaffold with TDD infrastructure
**Milestone:** M001

## Description

Add the Tauri 2 desktop shell around the React + Vite frontend created in T01. Scaffold the `src-tauri/` directory with Rust backend files and configure the Tauri window to the correct dimensions and title. After this task, `src-tauri/` exists with a valid `tauri.conf.json` and the project is ready for `npm run tauri dev`.

## Steps

1. Run `npx @tauri-apps/cli init` in the project root to scaffold `src-tauri/`. If the command prompts interactively for app name and window title, provide "GSD". If it fails, scaffold the `src-tauri/` files manually (Cargo.toml, src/main.rs, src/lib.rs, tauri.conf.json, build.rs).
2. Configure the Tauri window in `src-tauri/tauri.conf.json`: set `app.windows[0].title` to `"GSD"`, `app.windows[0].width` to `1200`, `app.windows[0].height` to `800`, `app.windows[0].minWidth` to `900`, `app.windows[0].minHeight` to `600`. Set `productName` to `"GSD"`. Ensure the `devUrl` points to the Vite dev server (`http://localhost:1420`) and `frontendDist` points to `../dist`.
3. Ensure `package.json` has a `"tauri"` script: `"tauri": "tauri"`. This enables `npm run tauri dev` and `npm run tauri build`. Do NOT run `cargo build` or `npm run tauri dev` — just verify the config is correct.

## Must-Haves

- [ ] `src-tauri/` directory exists with valid Cargo.toml and tauri.conf.json
- [ ] Tauri window config: 1200×800 default, 900×600 minimum, title "GSD"
- [ ] `productName` set to "GSD" in tauri.conf.json
- [ ] `devUrl` points to Vite dev server, `frontendDist` points to `../dist`
- [ ] `npm run tauri` script available in package.json

## Verification

- `test -f src-tauri/tauri.conf.json` (Tauri config exists)
- `grep -q '"GSD"' src-tauri/tauri.conf.json` (window title set)
- `test -f src-tauri/Cargo.toml` (Rust project exists)

## Observability Impact

- Signals added/changed: none — Tauri scaffold only, no runtime behavior yet
- How a future agent inspects this: check `src-tauri/tauri.conf.json` for window config values
- Failure state exposed: `npx @tauri-apps/cli init` errors surface on stderr

## Inputs

- `package.json` — project manifest from T01
- `vite.config.ts` — Vite config from T01 (Tauri needs to know the dev server port)

## Expected Output

- `src-tauri/tauri.conf.json` — Tauri config with window dimensions and title
- `src-tauri/src/main.rs` — Tauri main entry
- `src-tauri/src/lib.rs` — Tauri lib with command definitions
- `src-tauri/Cargo.toml` — Rust dependencies
- `src-tauri/build.rs` — Tauri build script
- `package.json` — updated with `tauri` script
