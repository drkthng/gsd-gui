# S01: Tauri + Vite + React scaffold with TDD infrastructure — UAT

**Milestone:** M001
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a scaffolding slice with no runtime behavior — verification is entirely through build outputs, test results, and config file inspection. No user-facing UI to interact with beyond a static heading.

## Preconditions

- Node.js 18+ installed
- npm available on PATH
- Working directory is the project root (where `package.json` lives)
- `npm install` has been run (node_modules populated)
- For Tauri dev check (test case 6): Rust toolchain installed (rustc, cargo)

## Smoke Test

Run `npm run test && npm run build` — both exit 0. This confirms the entire frontend toolchain (React 19, TypeScript, Vite 6, Vitest, @testing-library/react) works end-to-end.

## Test Cases

### 1. Vite production build succeeds

1. Run `npm run build`
2. **Expected:** Exit code 0. Output shows `tsc -b` succeeds followed by `vite build` producing files in `dist/`. No TypeScript errors, no Vite errors.

### 2. Vitest smoke test passes

1. Run `npm run test`
2. **Expected:** Exit code 0. Output shows 1 test file (`src/App.test.tsx`), 1 test passed. The smoke test renders `<App />` and finds "GSD" text in the document.

### 3. React 19 is the installed version

1. Run `node -e "const p=require('./package.json'); console.log(p.dependencies.react)"`
2. **Expected:** Output contains `^19` (e.g., `^19.0.0`).

### 4. Path alias @/ resolves correctly in build

1. Run `grep -r "@/App" src/main.tsx`
2. Run `npm run build`
3. **Expected:** `src/main.tsx` imports `@/App` and/or `@/App.css`. Build succeeds (exit 0), proving the `@/` alias resolves to `src/` in both tsc and Vite.

### 5. Tauri config has correct window dimensions and title

1. Run `node -e "const c=require('./src-tauri/tauri.conf.json'); const w=c.app.windows[0]; console.log(JSON.stringify({title:w.title,w:w.width,h:w.height,minW:w.minWidth,minH:w.minHeight}))"`
2. **Expected:** `{"title":"GSD","w":1200,"h":800,"minW":900,"minH":600}`

### 6. Tauri dev mode launches (requires Rust toolchain)

1. Run `npm run tauri dev`
2. Wait for Vite dev server to start on port 1420
3. Wait for Tauri window to appear
4. **Expected:** A native desktop window titled "GSD" opens at approximately 1200×800 pixels, showing `<h1>GSD</h1>` in the webview. The window cannot be resized below 900×600.
5. Close the window.

### 7. Vitest config mirrors Vite path aliases

1. Run `grep -A3 "resolve" vitest.config.ts`
2. Run `grep -A3 "resolve" vite.config.ts`
3. **Expected:** Both configs have `resolve.alias` mapping `@` to the `src` directory using the same path resolution pattern.

### 8. Test setup file registers jest-dom matchers

1. Run `cat src/test/setup.ts`
2. **Expected:** Contains `import "@testing-library/jest-dom/vitest"` (or equivalent). This auto-registers matchers like `toBeInTheDocument()`.

### 9. All required src-tauri files exist

1. Run `ls src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/build.rs src-tauri/src/main.rs src-tauri/src/lib.rs`
2. **Expected:** All 5 files listed without errors.

### 10. Tauri devUrl matches Vite server port

1. Run `node -e "console.log(require('./src-tauri/tauri.conf.json').build.devUrl)"`
2. Run `grep "port" vite.config.ts`
3. **Expected:** devUrl is `http://localhost:1420` and vite.config.ts has `port: 1420` with `strictPort: true`.

## Edge Cases

### Vite port conflict
- If port 1420 is already in use, `npm run dev` should fail immediately (due to `strictPort: true`) rather than silently switching to another port.
- **Expected:** Vite exits with error "Port 1420 is already in use" rather than falling back to 1421+.

### Missing node_modules
- If `node_modules/` is deleted and `npm run build` or `npm run test` is run without `npm install`:
- **Expected:** Clear error about missing dependencies, not a cryptic module resolution failure.

## Automated Verification Script

```bash
#!/bin/bash
set -e
echo "=== S01 UAT Verification ==="

echo "1. npm run build..."
npm run build
echo "✅ Build passed"

echo "2. npm run test..."
npm run test
echo "✅ Tests passed"

echo "3. React 19 check..."
node -e "const p=require('./package.json'); if(!p.dependencies.react.includes('19')) process.exit(1)"
echo "✅ React 19 confirmed"

echo "4. Tauri config check..."
node -e "
const c=require('./src-tauri/tauri.conf.json');
const w=c.app.windows[0];
if(w.title!=='GSD'||w.width!==1200||w.height!==800||w.minWidth!==900||w.minHeight!==600) process.exit(1);
if(c.build.devUrl!=='http://localhost:1420') process.exit(1);
"
echo "✅ Tauri config correct"

echo "5. Required files check..."
test -f vitest.config.ts
test -f src/test/setup.ts
test -f src/App.test.tsx
test -f src-tauri/tauri.conf.json
test -f src-tauri/Cargo.toml
test -f src-tauri/build.rs
test -f src-tauri/src/main.rs
test -f src-tauri/src/lib.rs
echo "✅ All required files present"

echo "=== All S01 UAT checks passed ==="
```
