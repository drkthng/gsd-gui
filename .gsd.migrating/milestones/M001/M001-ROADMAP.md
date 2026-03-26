# M001: Project Scaffolding & Core Shell

**Vision:** Establish the Tauri 2 + React 19 desktop application foundation with a complete app shell — sidebar navigation, routing, theme toggle, status bar — fully tested with TDD. No GSD integration; pure shell that M002 plugs into.

## Success Criteria

- The Tauri app launches in dev mode and renders the app shell in under 1 second
- All 7 sidebar navigation items switch the main content area to the corresponding placeholder view
- Dark/light/system theme toggle works and persists across app restart
- Status bar displays mock project context (milestone, cost, model)
- Layout remains functional when resized to 900×600 minimum
- All Vitest tests pass (`npm run test`)
- IPC abstraction interface exists with tested contract (no real Tauri calls)

## Key Risks / Unknowns

- Tauri 2 + shadcn/ui + Tailwind CSS 4 alias and config alignment — could cause build failures or missing styles
- shadcn/ui Sidebar component wiring with responsive collapse behavior

## Proof Strategy

- Tauri + shadcn/ui + Tailwind CSS 4 integration → retire in S01/S02 by proving a styled shadcn/ui Button renders correctly in the Tauri webview
- Sidebar complexity → retire in S03 by proving all 7 nav items route correctly and the sidebar collapses

## Verification Classes

- Contract verification: Vitest unit and component tests for every store, hook, and component
- Integration verification: `npm run tauri dev` launches and renders the full shell correctly
- Operational verification: none
- UAT / human verification: visual inspection of sidebar, theme toggle, status bar, responsive behavior

## Milestone Definition of Done

This milestone is complete only when all are true:

- All Vitest tests pass (`npm run test`)
- `npm run tauri dev` launches the Tauri window at 1200×800
- Sidebar navigates between 7 placeholder views
- Dark/light/system theme toggle persists across restart
- Status bar renders mock data
- Layout is functional at 900×600
- IPC abstraction layer exists with tested interface
- No Tauri-specific imports outside `gsd-client.ts`

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009, R010, R032
- Partially covers: none
- Leaves for later: R011-R031 (M002-M005)
- Orphan risks: none

## Slices

- [x] **S01: Tauri + Vite + React scaffold with TDD infrastructure** `risk:medium` `depends:[]`
  > After this: `npm run dev` launches Vite dev server, `npm run tauri dev` opens a Tauri window with a blank React app, `npm run test` runs Vitest with a passing smoke test. Proven by dev-mode launch and test run.

- [x] **S02: shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction** `risk:medium` `depends:[S01]`
  > After this: A shadcn/ui Button renders with correct Tailwind styling in the Tauri webview, Zustand UI store manages theme/sidebar state, IPC abstraction interface exists with tests. Proven by test run and visual inspection.

- [x] **S03: App shell — sidebar, routing, main content area, status bar** `risk:low` `depends:[S02]`
  > After this: Sidebar with 7 nav icons routes between placeholder views, status bar shows mock data, layout is responsive down to 900×600. Proven by test run and visual inspection.

- [x] **S04: Theme toggle, placeholder pages, shell polish** `risk:low` `depends:[S03]`
  > After this: Dark/light/system theme toggle works with persistence, all 7 placeholder pages have distinct content, the complete shell looks and feels like a real app. Proven by test run and visual inspection across theme modes.

## Boundary Map

### S01 → S02

Produces:
- Tauri 2 project structure (`src-tauri/`, `src/`)
- Vite 6 config with path aliases (`@/` → `src/`)
- React 19 entry point (`src/main.tsx`, `src/App.tsx`)
- TypeScript config (`tsconfig.json`, `tsconfig.app.json`)
- Vitest config + @testing-library/react setup (`vitest.config.ts`, `src/test/setup.ts`)
- Package scripts: `dev`, `build`, `test`, `tauri dev`, `tauri build`

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- Tailwind CSS 4 configured and working (`src/styles/globals.css`)
- shadcn/ui initialized with `components.json` and utility function (`src/lib/utils.ts`)
- shadcn/ui components installed: Button, Tooltip, Badge (baseline set)
- Zustand UI store (`src/stores/ui-store.ts`) — exports: `useUIStore`, actions: `setTheme`, `toggleSidebar`, `setActiveView`
- IPC abstraction interface (`src/services/gsd-client.ts`) — exports: typed interface for `startSession`, `stopSession`, `sendCommand`, `queryState`, `listProjects` with no-op implementation
- ThemeProvider component (`src/components/theme-provider.tsx`)

Consumes from S01:
- Vite path aliases for `@/` imports
- Vitest + testing-library setup

### S03 → S04

Produces:
- AppShell layout component (`src/components/app-shell/`) — SidebarProvider + Sidebar + main content area + status bar
- Sidebar component with 7 navigation items using shadcn/ui Sidebar primitives
- Client-side routing (react-router-dom) between 7 views
- StatusBar component (`src/components/status-bar/`) showing mock milestone/cost/model
- 7 placeholder page components (`src/pages/`)
- Responsive layout that collapses sidebar at narrow widths

Consumes from S02:
- shadcn/ui Sidebar, Button, Tooltip, Badge components
- Zustand UI store (`useUIStore`) for sidebar state and active view
- Tailwind CSS for all styling

### S04 (final slice)

Produces:
- ModeToggle component wired to ThemeProvider with dark/light/system modes
- Theme persistence via localStorage
- 7 placeholder pages with distinct content (title, description, icon, mock data hints)
- Visual polish: consistent spacing, proper dark mode colors, hover states, transitions
- Complete app shell ready for GSD integration in M002

Consumes from S03:
- AppShell layout, Sidebar, StatusBar, routing, all page components
- ThemeProvider from S02
