---
id: T01
parent: S01
milestone: M001
provides:
  - React 19 + Vite 6 + TypeScript frontend scaffold
  - TypeScript path alias @/ → src/ in tsc and Vite
  - npm run build / npm run dev scripts
key_files:
  - package.json
  - vite.config.ts
  - tsconfig.app.json
  - src/main.tsx
  - src/App.tsx
  - index.html
key_decisions:
  - Manually scaffolded Vite project instead of using npm create vite (worktree directory is non-empty)
  - Used fileURLToPath(import.meta.url) for __dirname in ESM vite.config.ts
patterns_established:
  - Path alias @/ → src/ configured in tsconfig.app.json (baseUrl + paths) and vite.config.ts (resolve.alias)
  - ESM-compatible Vite config using import.meta.url for directory resolution
observability_surfaces:
  - npm run build exit code and stderr for build health
duration: 8m
verification_result: passed
completed_at: 2026-03-24T14:31:00+01:00
blocker_discovered: false
---

# T01: Scaffold React 19 + Vite 6 + TypeScript frontend with path aliases

**Scaffolded React 19 + Vite 6 + TypeScript project with @/ path aliases and clean minimal App component**

## What Happened

Created the complete frontend scaffold from scratch — package.json with React 19, Vite 6, and TypeScript 5.7; three tsconfig files (root, app, node); vite.config.ts with React plugin and `@/` path alias; index.html entry point; and minimal `src/` directory with App.tsx rendering `<h1>GSD</h1>`. Installed `@types/node` for Node.js type support in vite.config.ts. Verified the `@/` path alias works end-to-end by importing `@/App` in main.tsx and confirming `tsc -b && vite build` succeeds.

## Verification

- `npm run build` exits 0 — TypeScript compilation and Vite production build both succeed
- React 19 confirmed in package.json dependencies (`"react": "^19.0.0"`)
- Path alias `@/` verified working: `src/main.tsx` imports `@/App` and `@/App.css`, build passes
- Boilerplate removed: App.tsx is a minimal component, App.css is empty

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 3.1s |
| 2 | `node -e "...react.includes('19')..."` | 0 | ✅ pass | 0.1s |
| 3 | `npm run test` (slice check) | 1 | ⏳ expected fail (T03) | 0.1s |
| 4 | `test -f src-tauri/tauri.conf.json` (slice check) | 1 | ⏳ expected fail (T02) | 0.1s |

## Diagnostics

- Build health: `npm run build` — exit 0 means tsc + vite both pass; stderr shows file-level errors on failure
- Dev server: `npm run dev` starts Vite dev server (not tested in CI, requires interactive terminal)

## Deviations

- Scaffolded manually instead of running `npm create vite@latest` — the worktree directory is non-empty (contains .gsd, .gitignore, architecture doc) which makes the interactive scaffolder unreliable.
- Used `fileURLToPath(new URL(".", import.meta.url))` in vite.config.ts instead of bare `__dirname` — Node.js ESM modules don't have `__dirname` and TypeScript flags it as an error under strict checking.
- Installed `@types/node` as devDependency — required for `node:path` and `node:url` imports in vite.config.ts to pass tsc.

## Known Issues

None.

## Files Created/Modified

- `package.json` — project manifest with React 19, Vite 6, TypeScript 5.7, @types/node
- `package-lock.json` — npm lockfile (72 packages)
- `index.html` — Vite entry HTML with root div and module script
- `vite.config.ts` — Vite config with React plugin and @/ path alias
- `tsconfig.json` — root TS config referencing app and node configs
- `tsconfig.app.json` — app TS config with baseUrl/paths for @/ alias
- `tsconfig.node.json` — node TS config for vite.config.ts with @types/node
- `src/main.tsx` — React app entry, renders App in StrictMode
- `src/App.tsx` — minimal component rendering `<h1>GSD</h1>`
- `src/App.css` — empty CSS file (boilerplate cleared)
- `src/vite-env.d.ts` — Vite client type reference
