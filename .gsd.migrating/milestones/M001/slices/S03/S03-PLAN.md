# S03: App shell — sidebar, routing, main content area, status bar

**Goal:** The Tauri app renders a complete app shell with a sidebar containing 7 navigation items, client-side routing between 7 placeholder views, a status bar showing mock data, and responsive layout down to 900×600.
**Demo:** Click each of the 7 sidebar icons → the main content area switches to the corresponding placeholder page. The status bar shows mock milestone/cost/model info. Resize to 900×600 → sidebar collapses, layout remains functional.

## Must-Haves

- react-router-dom installed and configured with 7 routes matching the View type (`chat`, `projects`, `milestones`, `timeline`, `costs`, `settings`, `help`)
- shadcn/ui Sidebar component installed with its dependencies (separator, sheet, input, skeleton, use-mobile hook)
- Shared test utility wrapping ThemeProvider + MemoryRouter with matchMedia mock (K009)
- 7 placeholder page components in `src/pages/` with distinct titles
- AppShell layout component composing Sidebar + main content area (router Outlet) + StatusBar
- Sidebar with 7 navigation items using lucide-react icons, wired to react-router-dom navigation and synced with Zustand `activeView`
- StatusBar component showing mock milestone, cost, and model data
- Responsive layout: sidebar collapses at narrow widths, layout functional at 900×600 minimum
- All components have tests written before implementation (TDD — R008)

## Proof Level

- This slice proves: integration (sidebar routing, layout composition, responsive behavior)
- Real runtime required: yes (visual inspection in Tauri webview)
- Human/UAT required: yes (visual inspection of sidebar collapse, responsive behavior)

## Verification

- `npm run test` — all existing tests still pass, plus new tests for: routing config, 7 page components, StatusBar, AppShell layout, sidebar navigation
- `src/components/app-shell/app-shell.test.tsx` — verifies sidebar renders 7 nav items, clicking a nav item changes the route/content, StatusBar is visible
- `src/components/status-bar/status-bar.test.tsx` — verifies mock milestone/cost/model data renders
- `src/pages/__tests__/pages.test.tsx` — verifies each page component renders its title
- `src/router.test.tsx` — verifies all 7 routes resolve to the correct page component

## Observability / Diagnostics

- **Runtime signals:** Active route path is visible in the browser URL bar and reflected in the Zustand `activeView` state. Sidebar highlight indicates the current route. StatusBar renders mock data that is inspectable via React DevTools.
- **Inspection surfaces:** `useUIStore.getState().activeView` returns the current view. Route config is exported from `src/router.tsx` as `appRoutes` / `pageRoutes` for programmatic inspection. Browser DevTools Network tab shows no failed requests on navigation.
- **Failure visibility:** Missing route renders no page content (blank main area). Sidebar navigation failure is visible as no route change. StatusBar data absence is immediately visible in the bottom bar.
- **Redaction constraints:** No secrets or sensitive data in this slice — all data is mock/static.

## Integration Closure

- Upstream surfaces consumed: `src/stores/ui-store.ts` (useUIStore, View type, setActiveView, toggleSidebar, sidebarOpen), `src/components/theme-provider.tsx` (ThemeProvider), `src/components/ui/button.tsx`, `src/components/ui/tooltip.tsx`, `src/components/ui/badge.tsx`, `src/lib/utils.ts` (cn), `src/styles/globals.css` (CSS variables including sidebar-* vars)
- New wiring introduced in this slice: `src/App.tsx` rewritten to use BrowserRouter + AppShell as the root layout; react-router-dom added as dependency; shadcn/ui Sidebar primitives added
- What remains before the milestone is truly usable end-to-end: S04 adds theme toggle UI, placeholder page content polish, and visual polish

## Tasks

- [x] **T01: Install routing and sidebar dependencies, create shared test utility, routing config, and 7 placeholder pages** `est:1h`
  - Why: Establishes the routing backbone and page primitives that the AppShell will render. S03 needs react-router-dom for client-side routing and shadcn/ui Sidebar component for the sidebar layout. A shared test utility (K009) avoids duplicating matchMedia mocks across every test file from S03 onward.
  - Files: `package.json`, `src/test/test-utils.tsx`, `src/router.tsx`, `src/router.test.tsx`, `src/pages/chat-page.tsx`, `src/pages/projects-page.tsx`, `src/pages/milestones-page.tsx`, `src/pages/timeline-page.tsx`, `src/pages/costs-page.tsx`, `src/pages/settings-page.tsx`, `src/pages/help-page.tsx`, `src/pages/__tests__/pages.test.tsx`, `src/components/ui/sidebar.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/input.tsx`, `src/components/ui/skeleton.tsx`, `src/hooks/use-mobile.ts`
  - Do: (1) Install react-router-dom. (2) Run `npx shadcn@latest add sidebar -y` and fix the literal `@/` directory issue (K006 — move files from `./@/` to `src/`). (3) Create `src/test/test-utils.tsx` with renderWithProviders helper wrapping ThemeProvider + MemoryRouter + matchMedia mock. (4) Write tests for 7 page components (each renders its view title). (5) Create 7 placeholder page components. (6) Write tests for router config (all 7 routes resolve). (7) Create `src/router.tsx` with route definitions.
  - Verify: `npm run test` passes with new page and router tests
  - Done when: react-router-dom and shadcn/ui Sidebar are installed, 7 page components exist with passing tests, router config exists with passing tests, shared test utility exists

- [x] **T02: Build AppShell layout with Sidebar navigation, StatusBar, and responsive wiring** `est:1h30m`
  - Why: This is the core integration task — composes Sidebar + main content area + StatusBar into the AppShell layout, wires sidebar items to routes, syncs with Zustand store, and ensures responsive behavior. Rewrites App.tsx to use the new AppShell as the root layout.
  - Files: `src/components/status-bar/status-bar.tsx`, `src/components/status-bar/status-bar.test.tsx`, `src/components/app-shell/app-shell.tsx`, `src/components/app-shell/app-shell.test.tsx`, `src/components/app-shell/sidebar-nav.tsx`, `src/App.tsx`, `src/App.test.tsx`
  - Do: (1) Write StatusBar tests (renders mock milestone, cost, model). (2) Implement StatusBar component with mock data. (3) Write AppShell tests (renders sidebar with 7 nav items, clicking nav changes route, StatusBar visible). (4) Build AppShell layout using shadcn/ui SidebarProvider + Sidebar + SidebarContent + SidebarMenu. (5) Create SidebarNav with 7 items — each has a lucide-react icon, label, and links to the route. Wire to Zustand setActiveView and sync activeView for highlighting. (6) Main content area uses react-router-dom Outlet. (7) Rewrite App.tsx to use BrowserRouter wrapping ThemeProvider wrapping AppShell with route children. (8) Update App.test.tsx to account for the new layout. (9) Verify responsive behavior — sidebar should collapse using shadcn/ui's built-in mobile behavior via the use-mobile hook.
  - Verify: `npm run test` — all tests pass including AppShell, StatusBar, and updated App tests
  - Done when: Full app shell renders with sidebar, main content area, and status bar. Clicking sidebar items navigates between pages. Layout is responsive. All tests pass.

## Files Likely Touched

- `package.json` (add react-router-dom)
- `src/test/test-utils.tsx` (shared test wrapper)
- `src/router.tsx` (route definitions)
- `src/router.test.tsx` (router tests)
- `src/pages/chat-page.tsx`
- `src/pages/projects-page.tsx`
- `src/pages/milestones-page.tsx`
- `src/pages/timeline-page.tsx`
- `src/pages/costs-page.tsx`
- `src/pages/settings-page.tsx`
- `src/pages/help-page.tsx`
- `src/pages/__tests__/pages.test.tsx`
- `src/components/ui/sidebar.tsx` (shadcn/ui Sidebar primitives)
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/skeleton.tsx`
- `src/hooks/use-mobile.ts`
- `src/components/status-bar/status-bar.tsx`
- `src/components/status-bar/status-bar.test.tsx`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/app-shell.test.tsx`
- `src/components/app-shell/sidebar-nav.tsx`
- `src/App.tsx`
- `src/App.test.tsx`
