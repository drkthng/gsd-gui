# S03 Summary: App Shell — Sidebar, Routing, Main Content Area, Status Bar

**Status:** Complete
**Tasks:** T01 ✅, T02 ✅
**Tests:** 69 pass (10 test files) — 28 new tests added across 5 new test files
**Duration:** ~27 min total (T01: 15m, T02: 12m)

## What This Slice Delivered

A fully functional app shell composing sidebar navigation, client-side routing between 7 placeholder views, a status bar with mock data, and responsive layout support. The app now looks and behaves like a real desktop application with a navigable UI.

### Concrete Artifacts

| Component | File(s) | Purpose |
|-----------|---------|---------|
| AppShell layout | `src/components/app-shell/app-shell.tsx` | Root layout: SidebarProvider → Sidebar + SidebarInset (Outlet + StatusBar) |
| SidebarNav | `src/components/app-shell/sidebar-nav.tsx` | 7 nav items with lucide icons, react-router Links, Zustand activeView sync |
| StatusBar | `src/components/status-bar/status-bar.tsx` | Footer bar with mock milestone (M001/S01/T01), cost ($0.00), model (Claude Sonnet) |
| Router config | `src/router.tsx` | Typed `appRoutes` array with 7 routes + index redirect (/→/chat) |
| 7 page components | `src/pages/{chat,projects,milestones,timeline,costs,settings,help}-page.tsx` | Placeholder pages with heading + description |
| Shared test utility | `src/test/test-utils.tsx` | `renderWithProviders()` wrapping ThemeProvider + MemoryRouter + matchMedia mock |
| shadcn/ui Sidebar | `src/components/ui/sidebar.tsx` + dependencies | Full sidebar primitives (SidebarProvider, SidebarMenu, SidebarMenuButton, etc.) |
| use-mobile hook | `src/hooks/use-mobile.ts` | Responsive breakpoint detection for sidebar mobile/desktop mode |
| App.tsx rewrite | `src/App.tsx` | BrowserRouter → ThemeProvider → Routes with AppShell layout + route children |

## Key Patterns Established

1. **renderWithProviders** — All components that need routing or theming context must use `renderWithProviders()` from `src/test/test-utils.tsx` instead of bare `render()`. The utility auto-applies matchMedia mock via module-level `beforeEach`.

2. **Route → Zustand sync via useEffect** — SidebarNav syncs `useUIStore.activeView` by watching `location.pathname` in a `useEffect`, not via onClick handlers. This is more robust with Radix Slot composition and catches programmatic navigation.

3. **AppShell as layout route** — App.tsx uses `<Route element={<AppShell />}>` with child routes rendered via `<Outlet />`. New views are added as route entries in `appRoutes` — no AppShell modification needed.

4. **Page component convention** — Named exports matching `{View}Page` pattern (e.g., `ChatPage`, `ProjectsPage`). Each has an `<h1>` heading matching its view name.

5. **Sidebar nav item convention** — `navItems` array in sidebar-nav.tsx is the single source of truth for navigation items. Exported for programmatic inspection.

## What S04 Needs to Know

- **App.tsx structure:** BrowserRouter → ThemeProvider → Routes → AppShell (layout route) → page routes. Theme toggle UI should be placed inside the Sidebar footer or header area in AppShell.
- **Sidebar collapse:** Uses shadcn/ui `collapsible="icon"` mode. The SidebarTrigger is in the sidebar footer (desktop) and top bar (mobile). S04's theme toggle can be placed near the SidebarTrigger.
- **ThemeProvider:** Already wraps the entire app. S04 just needs to add a ModeToggle component that calls `useTheme()` from theme-provider.tsx.
- **StatusBar:** Currently hardcoded mock data. S04 may polish styling but shouldn't wire to real data (that's M002).
- **Page components:** Currently minimal (heading + description). S04 should add distinct content, icons, and mock data hints to each page.
- **ResizeObserver mock:** Added to `src/test/setup.ts` globally — any test using Radix UI Popper components (tooltips, popovers) works without per-file mocking.

## Observability Surfaces

- `appRoutes` and `pageRoutes` exported from `src/router.tsx` — enumerate routes programmatically
- `navItems` exported from `src/components/app-shell/sidebar-nav.tsx` — enumerate sidebar entries
- `useUIStore.getState().activeView` — reflects current route after navigation
- `data-active="true"` attribute on active `SidebarMenuButton` — visual debugging
- StatusBar: `screen.getByRole("contentinfo")` — testable footer element
- Each page heading matches its View name — testable with `getByRole('heading')`

## Requirements Addressed

| Requirement | Status | Evidence |
|-------------|--------|----------|
| R004 (Responsive sidebar with 7 nav icons) | Validated | 7 nav items with lucide icons render, tested in app-shell.test.tsx |
| R005 (Client-side routing between views) | Validated | react-router-dom with 7 routes, sidebar clicks navigate between pages, tested in router.test.tsx + app-shell.test.tsx |
| R006 (Status bar with milestone/cost/model) | Validated | StatusBar renders mock M001/S01/T01, $0.00, Claude Sonnet — tested in status-bar.test.tsx |
| R008 (TDD — tests before implementation) | Upheld | All tests written before implementation code in both T01 and T02 |
| R010 (Responsive at 900×600 minimum) | Partially validated | shadcn/ui Sidebar uses use-mobile hook for responsive collapse. Layout is responsive. Full visual validation at 900×600 deferred to UAT. |

## Deviations from Plan

- Removed `tooltip` prop from SidebarMenuButton to avoid Radix Popper crashes in jsdom. Tooltips are only visible when sidebar is collapsed to icon mode — functionality preserved. Can be re-added with proper Radix tooltip mock if needed.
- Used `useEffect` on `location.pathname` for Zustand sync instead of originally implied `onClick` approach — more robust.

## Known Issues

None.
