---
estimated_steps: 4
estimated_files: 10
skills_used: []
---

# T01: Scaffold React 19 + Vite 6 + TypeScript frontend with path aliases

**Slice:** S01 — Tauri + Vite + React scaffold with TDD infrastructure
**Milestone:** M001

## Description

Initialize a React 19 + Vite 6 + TypeScript project from scratch in the empty project directory. Configure TypeScript path aliases (`@/` → `src/`) in both the Vite config and TypeScript config. Clean up boilerplate demo content. After this task, `npm run build` produces a successful Vite production build and `npm run dev` starts the dev server.

## Steps

1. Initialize the project: run `npm create vite@latest . -- --template react-ts` in `D:/AiProjects/gsd-ui`. If the command fails interactively, scaffold manually by creating the necessary files directly (package.json, vite.config.ts, tsconfig files, index.html, src/main.tsx, src/App.tsx).
2. Verify React 19 is installed (not React 18 — the template may default to 18). If React 18 was installed, upgrade: `npm install react@19 react-dom@19` and `npm install -D @types/react@19 @types/react-dom@19`. Confirm `package.json` shows `"react": "^19"`.
3. Configure TypeScript path aliases: in `tsconfig.app.json`, add `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`. In `vite.config.ts`, add `resolve: { alias: { "@": path.resolve(__dirname, "./src") } }` (import `path` from `node:path`).
4. Clean up boilerplate: remove the default Vite counter demo content from `src/App.tsx`. Replace with a minimal component that renders `<h1>GSD</h1>`. Clear demo styles from `src/App.css` (keep file but empty it). Keep `src/main.tsx` with its React root render. Run `npm run build` to confirm everything compiles.

## Must-Haves

- [ ] React 19 (not 18) is installed with matching @types packages
- [ ] TypeScript path alias `@/` → `src/` works in both tsc and Vite
- [ ] `npm run build` succeeds (Vite production build)
- [ ] `npm run dev` script exists and starts Vite dev server
- [ ] Boilerplate demo code (counter, logos) is removed

## Verification

- `npm run build` exits 0 (Vite build succeeds)
- `node -e "import {readFile} from 'fs/promises'; readFile('package.json','utf8').then(d=>{const p=JSON.parse(d);process.exit(p.dependencies.react.includes('19')?0:1)})"` (React 19 installed)

## Observability Impact

- Signals added/changed: none — pure scaffolding, no runtime behavior
- How a future agent inspects this: `npm run build` exit code; Vite error output on stderr
- Failure state exposed: Vite build errors surface on stdout/stderr with file paths and line numbers

## Inputs

- `GSD-UI-ARCHITECTURE.md` — project architecture spec (technology stack, directory structure)
- `.gitignore` — existing gitignore to preserve

## Expected Output

- `package.json` — project manifest with React 19, Vite 6, TypeScript, dev scripts
- `package-lock.json` — lockfile from npm install
- `vite.config.ts` — Vite config with path aliases
- `tsconfig.json` — root TypeScript config
- `tsconfig.app.json` — app-specific TS config with path aliases
- `tsconfig.node.json` — node-specific TS config for Vite
- `index.html` — Vite entry HTML
- `src/main.tsx` — React app entry point
- `src/App.tsx` — minimal App component rendering `<h1>GSD</h1>`
- `src/App.css` — cleaned CSS (empty, no boilerplate)
