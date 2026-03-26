---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Create GitHub Actions build workflow and update bundle config

Create `.github/workflows/build.yml` with a matrix strategy for Windows (windows-latest), macOS (macos-latest), and Linux (ubuntu-22.04). Each job installs Rust stable, Node 20, caches cargo/npm, runs `npm ci`, `npm run build`, then `npx tauri build`. Artifacts are uploaded. Also review and update `tauri.conf.json` bundle section if needed (identifier, category, short description). Add `scripts/verify-build.sh` that validates the workflow YAML syntax and checks frontend build succeeds.

## Inputs

- ``src-tauri/tauri.conf.json` — existing bundle configuration`
- ``package.json` — existing build scripts and dependencies`
- ``src-tauri/Cargo.toml` — Rust dependencies and build profile`

## Expected Output

- ``.github/workflows/build.yml` — CI workflow with 3-OS matrix build`
- ``src-tauri/tauri.conf.json` — updated bundle config if needed`
- ``scripts/verify-build.sh` — local verification script`

## Verification

node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('.github/workflows/build.yml','utf8'));console.log('YAML valid')" && npm run build
