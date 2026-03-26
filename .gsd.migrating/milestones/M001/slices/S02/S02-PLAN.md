# S02: shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction

**Goal:** Tailwind CSS 4 configured and working, shadcn/ui initialized with baseline components (Button, Tooltip, Badge), Zustand UI store managing theme/sidebar/activeView state, IPC abstraction interface defined with no-op implementation, and ThemeProvider wired into the app — all with tests.
**Demo:** A shadcn/ui Button renders with correct Tailwind styling in the Vitest test harness. Zustand store actions (setTheme, toggleSidebar, setActiveView) work in tests. IPC abstraction interface has typed methods (startSession, stopSession, sendCommand, queryState, listProjects) returning no-op results. ThemeProvider applies dark/light/system classes to the document root.

## Must-Haves

- Tailwind CSS 4 installed with `@tailwindcss/vite` plugin, `@import "tailwindcss"` in globals.css
- shadcn/ui `components.json` configured for Vite (no RSC, CSS variables, neutral base color, `@/` aliases)
- `src/lib/utils.ts` exports `cn()` function using `clsx` + `tailwind-merge`
- `src/styles/globals.css` contains full shadcn/ui CSS variables theme with light/dark mode support
- shadcn/ui Button, Tooltip, Badge components installed in `src/components/ui/`
- `src/stores/ui-store.ts` — Zustand store with theme, sidebarOpen, activeView state + setTheme, toggleSidebar, setActiveView actions
- `src/services/gsd-client.ts` — typed IPC interface with startSession, stopSession, sendCommand, queryState, listProjects + no-op implementation
- `src/components/theme-provider.tsx` — ThemeProvider context + useTheme hook applying dark/light/system to document root
- All modules have tests written before implementation (TDD — R008)
- No Tauri-specific imports outside `gsd-client.ts` (R032)
- `npm run build` passes (tsc + Vite)
- `npm run test` passes with all new tests green

## Proof Level

- This slice proves: contract (Tailwind + shadcn/ui render correctly, stores/services have tested interfaces)
- Real runtime required: no (all verified via Vitest + jsdom)
- Human/UAT required: no (visual inspection of styled Button deferred to S03/S04 assembly)

## Verification

- `npm run test` — all tests pass (existing smoke test + new tests for ui-store, gsd-client, theme-provider, Button render)
- `npm run build` — tsc + Vite production build succeeds (proves Tailwind CSS 4 + shadcn/ui compile correctly)
- `test -f src/styles/globals.css` — globals.css exists with Tailwind imports and CSS variables
- `test -f components.json` — shadcn/ui config exists at project root
- `test -f src/components/ui/button.tsx` — Button component installed
- `test -f src/stores/ui-store.ts` — Zustand store exists
- `test -f src/services/gsd-client.ts` — IPC abstraction exists
- `test -f src/components/theme-provider.tsx` — ThemeProvider exists
- `npm run build 2>&1 | tail -5` — build output ends with success message (no Tailwind/tsc errors suppressed)

## Observability / Diagnostics

- **Build failure signals:** `npm run build` exits non-zero with tsc/Vite/Tailwind error output on stdout/stderr — captures CSS parse errors, missing theme variables, and type errors in one pass.
- **Test failure signals:** `npm run test` exits non-zero with Vitest output showing which test file/assertion failed, including component render errors and store action mismatches.
- **CSS variable inspection:** Browser DevTools → Elements → `:root` computed styles shows all `--background`, `--foreground`, etc. variables; `.dark` class toggles dark theme values. Vitest jsdom tests verify `document.documentElement.classList` contains expected theme class.
- **Failure-path check:** `npm run build 2>&1 | head -50` surfaces first error in Tailwind CSS compilation, shadcn component type errors, or missing imports. Vitest `--reporter=verbose` shows per-test pass/fail for granular diagnosis.
- **Redaction:** No secrets or credentials in this slice — all configuration is CSS variables, component source, and store state.

## Integration Closure

- Upstream surfaces consumed: `vite.config.ts` (adding Tailwind plugin), `vitest.config.ts` (@/ alias), `tsconfig.app.json` (paths), `index.html` or `src/main.tsx` (CSS import), `package.json` (new dependencies)
- New wiring introduced in this slice: Tailwind CSS Vite plugin in `vite.config.ts`, globals.css imported in `src/main.tsx`, ThemeProvider wrapping App in `src/App.tsx`
- What remains before the milestone is truly usable end-to-end: S03 (app shell — sidebar, routing, content area, status bar) and S04 (theme toggle UI, placeholder pages, polish)

## Tasks

- [x] **T01: Install Tailwind CSS 4 + shadcn/ui with baseline components and verified styling** `est:45m`
  - Why: Foundation for all styling in the app. Tailwind CSS 4 + shadcn/ui integration is the highest-risk item in this slice — if this doesn't work, nothing else can.
  - Files: `package.json`, `vite.config.ts`, `vitest.config.ts`, `src/styles/globals.css`, `src/lib/utils.ts`, `components.json`, `index.html`, `src/main.tsx`, `src/components/ui/button.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/badge.tsx`, `src/lib/utils.test.ts`, `src/components/ui/button.test.tsx`
  - Do: Install `tailwindcss @tailwindcss/vite tw-animate-css clsx tailwind-merge lucide-react class-variance-authority radix-ui`. Add `tailwindcss()` plugin to `vite.config.ts`. Create `src/styles/globals.css` with `@import "tailwindcss"`, `@import "tw-animate-css"`, CSS variables theme (light + dark), `@theme inline` block, base layer styles. Create `components.json` for Vite (rsc: false, no tailwind.config path for v4, css: `src/styles/globals.css`, neutral base, cssVariables: true, `@/` aliases). Create `src/lib/utils.ts` with `cn()`. Update `src/main.tsx` to import `@/styles/globals.css` instead of `@/App.css`. Try `npx shadcn@latest add button tooltip badge --yes --overwrite`; if non-TTY fails, manually create the component files from shadcn/ui source. Write tests: `cn()` merges classes correctly, Button renders with expected variant classes. K001 applies — be prepared to manually scaffold.
  - Verify: `npm run build && npm run test`
  - Done when: `npm run build` exits 0, `npm run test` exits 0 with Button render test and cn() test passing, `components.json` exists, all three UI components exist in `src/components/ui/`

- [x] **T02: Create Zustand UI store and IPC abstraction with TDD** `est:30m`
  - Why: Closes R009 (Zustand state management) and R032 (IPC abstraction). These are pure TypeScript modules — straightforward to test-drive.
  - Files: `src/stores/ui-store.ts`, `src/stores/ui-store.test.ts`, `src/services/gsd-client.ts`, `src/services/gsd-client.test.ts`, `package.json`
  - Do: Install `zustand`. Write tests first (TDD): ui-store tests for initial state (theme: 'system', sidebarOpen: true, activeView: 'chat'), setTheme changes theme, toggleSidebar flips sidebarOpen, setActiveView changes activeView. Then implement the store. Write gsd-client tests: interface has startSession/stopSession/sendCommand/queryState/listProjects methods, no-op implementation returns expected defaults. Then implement the service. No Tauri imports — only typed interfaces with no-op stubs.
  - Verify: `npm run test`
  - Done when: `npm run test` exits 0 with all ui-store and gsd-client tests passing, no Tauri-specific imports in any file

- [x] **T03: Create ThemeProvider component, wire into App, and run full integration check** `est:25m`
  - Why: Closes the slice by wiring ThemeProvider into the app and proving the complete stack works together — Tailwind + shadcn/ui + Zustand + ThemeProvider all compose correctly.
  - Files: `src/components/theme-provider.tsx`, `src/components/theme-provider.test.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/App.css`
  - Do: Write ThemeProvider test first (TDD): renders children, provides theme context, setTheme updates theme, applies class to document root. Implement ThemeProvider using React context (following shadcn/ui Vite dark mode pattern): reads/writes localStorage, applies light/dark class to `document.documentElement`, listens for system preference changes. Wire ThemeProvider into App.tsx wrapping all content. Update App.test.tsx: existing smoke test still passes, add test that renders a shadcn/ui Button inside ThemeProvider and verifies it's in the document. Delete `src/App.css` (replaced by globals.css). Run full `npm run build && npm run test`.
  - Verify: `npm run build && npm run test`
  - Done when: `npm run build` exits 0, all tests pass, ThemeProvider wraps App content, App.css is removed, a Button renders inside ThemeProvider in test

## Files Likely Touched

- `package.json` — new dependencies (tailwindcss, @tailwindcss/vite, tw-animate-css, clsx, tailwind-merge, lucide-react, class-variance-authority, radix-ui, zustand)
- `vite.config.ts` — add tailwindcss Vite plugin
- `vitest.config.ts` — may need css config adjustment for Tailwind
- `index.html` — possibly add dark class support
- `src/main.tsx` — import globals.css instead of App.css
- `src/App.tsx` — wrap with ThemeProvider
- `src/App.css` — deleted (replaced by globals.css)
- `src/App.test.tsx` — updated smoke test with ThemeProvider wrapper
- `src/styles/globals.css` — Tailwind imports + CSS variables theme
- `src/lib/utils.ts` — cn() utility
- `src/lib/utils.test.ts` — cn() tests
- `components.json` — shadcn/ui config
- `src/components/ui/button.tsx` — shadcn/ui Button
- `src/components/ui/button.test.tsx` — Button render test
- `src/components/ui/tooltip.tsx` — shadcn/ui Tooltip
- `src/components/ui/badge.tsx` — shadcn/ui Badge
- `src/components/theme-provider.tsx` — ThemeProvider context
- `src/components/theme-provider.test.tsx` — ThemeProvider tests
- `src/stores/ui-store.ts` — Zustand UI store
- `src/stores/ui-store.test.ts` — UI store tests
- `src/services/gsd-client.ts` — IPC abstraction
- `src/services/gsd-client.test.ts` — IPC abstraction tests
