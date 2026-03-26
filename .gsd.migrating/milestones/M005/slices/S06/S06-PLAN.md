# S06: Packaging & CI

**Goal:** GitHub Actions CI workflow builds Windows, macOS, and Linux installers on push/tag
**Demo:** GitHub Actions workflow builds Windows/macOS/Linux installers

## Must-Haves

- `.github/workflows/build.yml` exists with a matrix build for Windows, macOS, Linux
- Workflow triggers on push to main and version tags
- Each OS job: installs Rust + Node, runs `npm run build`, runs `cargo tauri build`
- Build artifacts (`.msi`, `.dmg`, `.deb`, `.AppImage`) uploaded via `actions/upload-artifact`
- `tauri.conf.json` bundle config validated (targets, icons, identifier all present)
- Local `npm run build` succeeds (frontend compiles)

## Proof Level

- This slice proves: operational — proves CI config is syntactically valid and frontend builds; full CI proof requires GitHub runners

## Integration Closure

- Upstream: `src-tauri/tauri.conf.json` (existing bundle config), `package.json` (existing build scripts)
- New wiring: `.github/workflows/build.yml` orchestrates the full build pipeline
- Remains: actual CI run on GitHub (cannot be tested locally), macOS code signing (deferred per roadmap)

## Verification

- none

## Tasks

- [x] **T01: Create GitHub Actions build workflow and update bundle config** `est:45m`
  Create `.github/workflows/build.yml` with a matrix strategy for Windows (windows-latest), macOS (macos-latest), and Linux (ubuntu-22.04). Each job installs Rust stable, Node 20, caches cargo/npm, runs `npm ci`, `npm run build`, then `npx tauri build`. Artifacts are uploaded. Also review and update `tauri.conf.json` bundle section if needed (identifier, category, short description). Add `scripts/verify-build.sh` that validates the workflow YAML syntax and checks frontend build succeeds.
  - Files: `.github/workflows/build.yml`, `src-tauri/tauri.conf.json`, `scripts/verify-build.sh`
  - Verify: node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('.github/workflows/build.yml','utf8'));console.log('YAML valid')" && npm run build

## Files Likely Touched

- .github/workflows/build.yml
- src-tauri/tauri.conf.json
- scripts/verify-build.sh
