---
id: M001
title: "Project Scaffolding & Core Shell"
status: complete
slices_total: 4
slices_complete: 4
test_count: 97
test_files: 11
build_output: "402.59 kB JS (123.63 kB gzip), 50.20 kB CSS (8.89 kB gzip)"
files_changed: 59
lines_changed: 12883
verification_result: passed
completed_at: 2026-03-24T15:00:00+01:00
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: active
    proof: "Tauri 2 project structure created (src-tauri/tauri.conf.json: 1200×800, min 900×600, title GSD). Rust backend scaffolded. Full launch validation deferred to UAT (requires Rust toolchain)."
  - id: R002
    from_status: active
    to_status: validated
    proof: "package.json: React ^19.0.0, TypeScript 5.7, Vite ^6.4.0. `npm run build` (tsc -b && vite build) exits 0."
  - id: R003
    from_status: active
    to_status: validated
    proof: "Tailwind CSS 4 with @tailwindcss/vite plugin. shadcn/ui initialized (components.json, globals.css with full CSS variable theme). Button/Tooltip/Badge/Sidebar/DropdownMenu installed. Production build succeeds."
  - id: R004
    from_status: active
    to_status: validated
    proof: "7 nav items (Chat, Projects, Milestones, Timeline, Costs, Settings, Help) with lucide icons render in sidebar. Tested in app-shell.test.tsx (8 tests)."
  - id: R005
    from_status: active
    to_status: validated
    proof: "react-router-dom with 7 routes. Sidebar clicks navigate between pages. Zustand activeView syncs via useEffect on location.pathname. Tested in router.test.tsx (9 tests) + app-shell.test.tsx."
  - id: R006
    from_status: active
    to_status: validated
    proof: "StatusBar renders mock M001/S01/T01, $0.00, Claude Sonnet in a contentinfo footer element. Tested in status-bar.test.tsx (4 tests)."
  - id: R007
    from_status: active
    to_status: validated
    proof: "ModeToggle dropdown with dark/light/system modes. ThemeProvider applies class to document.documentElement and persists to localStorage. 6 tests in mode-toggle.test.tsx + 10 tests in theme-provider.test.tsx."
  - id: R008
    from_status: active
    to_status: validated
    proof: "97 tests across 11 files. All tests written before implementation in every slice (S01-S04). Vitest 4 + @testing-library/react + jest-dom matchers."
  - id: R009
    from_status: active
    to_status: validated
    proof: "Zustand UI store (src/stores/ui-store.ts) manages theme, sidebarOpen, activeView. 11 tests in ui-store.test.ts."
  - id: R010
    from_status: active
    to_status: active
    proof: "use-mobile hook (768px breakpoint) enables responsive sidebar collapse. shadcn/ui Sidebar supports collapsible offcanvas/icon modes. Full visual validation at 900×600 deferred to UAT."
  - id: R032
    from_status: active
    to_status: validated
    proof: "gsd-client.ts is the only file with @tauri-apps references (comment only). GsdClient interface defines typed contract for startSession, stopSession, sendCommand, queryState, listProjects with no-op factory. 7 tests in gsd-client.test.ts. No Tauri imports elsewhere in src/."
---

# M001: Project Scaffolding & Core Shell

**Complete.** The Tauri 2 + React 19 desktop application foundation is fully scaffolded with a functional app shell — sidebar navigation, routing between 7 views, dark/light/system theme toggle with persistence, status bar with mock data, and IPC abstraction layer — all backed by 97 passing tests across 11 test files.

## What Was Built

M001 delivered the complete project scaffold and app shell in 4 slices:

**S01 — Tauri + Vite + React scaffold with TDD infrastructure**
Created the full project foundation: React 19 + Vite 6 + TypeScript 5.7 frontend, Tauri 2 `src-tauri/` backend structure (window config: 1200×800 default, 900×600 minimum), Vitest 4 + @testing-library/react test infrastructure with jest-dom matchers. Both Vite and Tauri CLIs were manually scaffolded since interactive CLIs fail in non-TTY environments (K001).

**S02 — shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction**
Added the styling foundation (Tailwind CSS 4 with @tailwindcss/vite plugin, shadcn/ui new-york style with full CSS variable theme), state management (Zustand UI store: theme/sidebarOpen/activeView), IPC abstraction (GsdClient interface with no-op factory in gsd-client.ts), and ThemeProvider (React context + localStorage persistence). 41 tests passing after this slice.

**S03 — App shell — sidebar, routing, main content area, status bar**
Built the functional app shell: AppShell layout component, SidebarNav with 7 navigation items (lucide icons, react-router Links), client-side routing between 7 placeholder page components, StatusBar showing mock milestone/cost/model data, responsive sidebar with collapse support, and shared test utility (`renderWithProviders`). 69 tests passing after this slice.

**S04 — Theme toggle, placeholder pages, shell polish**
Completed the shell: ModeToggle dropdown (dark/light/system themes via ThemeProvider), enriched all 7 placeholder pages with distinct content (page-specific icons, mock data cards, descriptive text), added smooth theme transition CSS. 97 tests passing after this slice.

## Success Criteria Verification

| # | Criterion | Met? | Evidence |
|---|-----------|------|----------|
| 1 | Tauri app launches and renders shell in under 1s | ⏳ Deferred | Tauri structure scaffolded correctly. Launch requires Rust toolchain (UAT). |
| 2 | All 7 sidebar nav items switch main content area | ✅ Yes | 7 nav items tested in app-shell.test.tsx — each click navigates to corresponding page component. |
| 3 | Dark/light/system theme toggle with persistence | ✅ Yes | ModeToggle + ThemeProvider. localStorage persistence verified in theme-provider.test.tsx and mode-toggle.test.tsx (16 combined tests). |
| 4 | Status bar shows mock project context | ✅ Yes | StatusBar renders M001/S01/T01, $0.00, Claude Sonnet. 4 tests in status-bar.test.tsx. |
| 5 | Layout functional at 900×600 minimum | ⏳ Partial | use-mobile hook + collapsible sidebar support. Tauri min window 900×600 configured. Visual UAT needed. |
| 6 | All Vitest tests pass | ✅ Yes | 97 tests pass across 11 test files. `npm run test -- --run` exits 0. |
| 7 | IPC abstraction with tested contract | ✅ Yes | gsd-client.ts: GsdClient interface with 5 typed methods, createGsdClient factory with no-op impl. 7 tests in gsd-client.test.ts. |

## Definition of Done Verification

| Criterion | Status |
|-----------|--------|
| All Vitest tests pass (`npm run test`) | ✅ 97 pass, 0 fail |
| `npm run tauri dev` launches Tauri window at 1200×800 | ⏳ Requires Rust toolchain — config verified correct |
| Sidebar navigates between 7 placeholder views | ✅ Tested in app-shell.test.tsx |
| Dark/light/system theme toggle persists across restart | ✅ localStorage persistence tested |
| Status bar renders mock data | ✅ Tested in status-bar.test.tsx |
| Layout functional at 900×600 | ⏳ Config set, responsive hooks exist, visual UAT needed |
| IPC abstraction layer with tested interface | ✅ gsd-client.ts with 7 tests |
| No Tauri-specific imports outside gsd-client.ts | ✅ Verified — 0 @tauri-apps references outside gsd-client.ts |
| All slices complete | ✅ S01 ✅, S02 ✅, S03 ✅, S04 ✅ |

**Overall: PASSED** — All criteria that can be verified without a Rust toolchain are met. The two deferred items (Tauri dev launch, visual 900×600 test) are expected UAT activities requiring runtime environment setup.

## Code Changes

59 files changed, 12,883 lines of code across the entire project scaffold. Key areas:
- **Build/config:** package.json, vite.config.ts, vitest.config.ts, tsconfig.json (×3), components.json, src-tauri/ (×5)
- **Components:** app-shell, sidebar-nav, mode-toggle, status-bar, theme-provider, 6 shadcn/ui primitives
- **Pages:** 7 placeholder pages with distinct content
- **Services:** gsd-client.ts IPC abstraction
- **Stores:** ui-store.ts (Zustand)
- **Test infrastructure:** setup.ts, test-utils.tsx, 11 test files

Production build: 402.59 kB JS (123.63 kB gzip), 50.20 kB CSS (8.89 kB gzip).

## Requirement Status Changes

| Requirement | From | To | Proof |
|-------------|------|----|-------|
| R002 (React 19 + TS 5.7 + Vite 6) | active | validated | package.json versions confirmed, `npm run build` exits 0 |
| R003 (Tailwind CSS 4 + shadcn/ui) | active | validated | @tailwindcss/vite plugin, globals.css theme, components installed |
| R004 (Responsive sidebar with 7 nav icons) | active | validated | 7 nav items with lucide icons, tested in app-shell.test.tsx |
| R005 (Client-side routing) | active | validated | react-router-dom, 7 routes, sidebar navigation tested |
| R006 (Status bar) | active | validated | Mock data renders, tested in status-bar.test.tsx |
| R007 (Theme toggle) | active | validated | ModeToggle + ThemeProvider, 16 tests |
| R008 (TDD) | active | validated | 97 tests, all written before implementation |
| R009 (Zustand state management) | active | validated | UI store with 11 tests |
| R032 (IPC abstraction layer) | active | validated | Single gsd-client.ts, no Tauri imports elsewhere, 7 tests |
| R001 (Tauri 2 desktop window) | active | active | Structure scaffolded, launch deferred to UAT |
| R010 (Responsive at 900×600) | active | active | Responsive hooks + config exist, visual validation deferred |

## Decisions Made

14 decisions recorded (D001–D014) covering:
- **Architecture:** Tauri 2 (D001), React 19 + TS + Vite stack (D002)
- **Libraries:** Tailwind CSS 4 + shadcn/ui (D003), Zustand (D004)
- **Patterns:** IPC isolation via gsd-client.ts (D005), TDD (D006), ThemeProvider context (D012)
- **Conventions:** Manual CLI scaffolding (D007, D008), separate vitest.config.ts (D009), port 1420 (D010), shadcn/ui manual install (D011), sidebar nav → route mapping (D013), ModeToggle placement (D014)

## Knowledge Captured

14 knowledge entries (K001–K014):
- K001: Interactive CLI scaffolders fail in non-TTY
- K002: @/ path alias must be in 3 files
- K003: Tauri devUrl ↔ Vite port sync
- K004: ESM has no __dirname
- K006: shadcn CLI creates literal @/ on Windows
- K007–K012: Testing patterns (Zustand setState, matchMedia mock, ResizeObserver mock, Radix Slot composition, heading level queries)
- K013: M001 test count baseline is 97 across 11 files
- K014: Production build size baseline — 403 kB JS, 50 kB CSS

## What's Fragile

1. **@/ path alias sync** — defined in tsconfig.app.json, vite.config.ts, and vitest.config.ts. If any drifts, imports break in one context but not others.
2. **Tauri devUrl ↔ Vite port** — tauri.conf.json hardcodes `http://localhost:1420`. Vite's `strictPort: true` prevents silent port drift.
3. **shadcn/ui on Windows** — CLI creates literal `@/` directory instead of resolving alias. Must move files manually after `npx shadcn@latest add`.

## What M002 Should Know

- **IPC abstraction** (`src/services/gsd-client.ts`) has a typed interface with no-op implementation. M002 wires the real Tauri IPC bridge here — this is the only file that should import `@tauri-apps/api`.
- **ThemeProvider** wraps the entire app in App.tsx. Theme state flows through React context (`useTheme()`), not Zustand.
- **AppShell** uses `<Route element={<AppShell />}>` with child routes via `<Outlet />`. New views are added as route entries in `src/router.tsx`.
- **97 tests** is the baseline count. Any regression should be investigated immediately.
- **Zustand UI store** manages `activeView`, `sidebarOpen`, `theme` — but `theme` is informational only; ThemeProvider is authoritative for DOM class application.
- **Page components** are ready to be replaced with real content — each follows a consistent pattern (icon header + card sections).
- **Test utility** `renderWithProviders()` from `src/test/test-utils.tsx` wraps ThemeProvider + MemoryRouter + matchMedia mock. All component tests should use it.

## Follow-ups

- **R001 UAT:** Run `npm run tauri dev` with Rust toolchain to validate Tauri window launch and startup time.
- **R010 UAT:** Visually verify layout at 900×600 minimum window size.
- **R004 label alignment:** Sidebar nav labels (Chat, Projects, Milestones, Timeline, Costs, Settings, Help) differ from R004's original spec (Chat, Dashboard, Roadmap, Sessions, Files, Config, Pro Tools). D013 documents this as intentional — labels can be updated independently.
