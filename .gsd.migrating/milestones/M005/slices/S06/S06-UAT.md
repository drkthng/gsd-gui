# S06: Packaging & CI — UAT

**Milestone:** M005
**Written:** 2026-03-25T14:51:03.231Z

# S06 UAT: Packaging & CI

## Preconditions
- Repository checked out with `.github/workflows/build.yml` present
- Node 20+ and npm installed locally
- Access to GitHub repository for CI validation

## Test Cases

### TC1: Workflow YAML is valid
1. Run: `node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('.github/workflows/build.yml','utf8'));console.log('YAML valid')"`
2. **Expected:** Prints "YAML valid", exit code 0

### TC2: Frontend build succeeds
1. Run: `npm run build`
2. **Expected:** Build completes, `dist/index.html` exists, JS and CSS assets generated

### TC3: Workflow triggers are correct
1. Open `.github/workflows/build.yml`
2. **Expected:** Triggers on push to `main`, tags `v*`, and pull_request to `main`

### TC4: Matrix covers all 3 platforms
1. Inspect the `strategy.matrix` in build.yml
2. **Expected:** Contains `windows-latest`, `macos-latest`, `ubuntu-22.04`

### TC5: Artifacts are uploaded per platform
1. Inspect the workflow jobs
2. **Expected:** Each matrix job has `actions/upload-artifact` step uploading platform-specific installers

### TC6: Bundle config is complete
1. Open `src-tauri/tauri.conf.json`, inspect `bundle` section
2. **Expected:** `identifier` is set, `targets` includes msi/dmg/deb/AppImage, `category` is "DeveloperTool", `shortDescription` present

### TC7: Concurrency control prevents duplicate runs
1. Inspect `concurrency` section in workflow
2. **Expected:** Group key uses branch/PR ref, `cancel-in-progress: true`

## Edge Cases
- Pushing a tag like `v1.0.0` should trigger the workflow
- Opening a PR to main should trigger a build check
- Rapid sequential pushes should cancel previous runs
