---
estimated_steps: 9
estimated_files: 7
skills_used:
  - test
---

# T02: Build AppShell layout with Sidebar navigation, StatusBar, and responsive wiring

**Slice:** S03 — App shell — sidebar, routing, main content area, status bar
**Milestone:** M001

## Description

This is the core integration task for S03. It composes the full app shell layout: a shadcn/ui Sidebar with 7 navigation items, a main content area rendering the active route via react-router-dom's Outlet, and a StatusBar showing mock milestone/cost/model data. The sidebar items use lucide-react icons, link to routes, and sync with the Zustand `activeView` state for active highlighting. App.tsx is rewritten to use BrowserRouter wrapping the new AppShell layout with route children.

The shadcn/ui Sidebar component has built-in responsive behavior via the `use-mobile` hook — on mobile-width viewports it renders as a Sheet (slide-out drawer) instead of an inline sidebar. This handles the R010 responsive requirement for sidebar collapse at narrow widths.

## Steps

1. **Write StatusBar tests** (`src/components/status-bar/status-bar.test.tsx`): TDD — tests first. Test that StatusBar renders mock milestone text (e.g. "M001 / S01 / T01"), mock cost text (e.g. "$0.00"), and mock model text (e.g. "Claude Sonnet"). Use `renderWithProviders` from `src/test/test-utils.tsx`.

2. **Implement StatusBar component** (`src/components/status-bar/status-bar.tsx`): A horizontal bar at the bottom of the viewport. Uses Tailwind CSS for styling — `h-8`, border-top, muted background. Displays three sections: current context (milestone/slice/task), accumulated cost, and active model. All values are hardcoded mock data for M001. Uses the Badge component from `src/components/ui/badge.tsx` for status items.

3. **Write AppShell tests** (`src/components/app-shell/app-shell.test.tsx`): TDD — tests first. Use `renderWithProviders` from the shared test utility. Test: (a) The sidebar renders 7 navigation items with correct labels (Chat, Projects, Milestones, Timeline, Costs, Settings, Help). (b) Clicking a nav item navigates to the correct route path (e.g. clicking "Projects" navigates to /projects and renders the Projects page content). (c) The StatusBar is visible. (d) The default route shows the Chat page.

4. **Create SidebarNav component** (`src/components/app-shell/sidebar-nav.tsx`): A component rendering the 7 sidebar menu items using shadcn/ui's `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` primitives. Each item has: a lucide-react icon, a label, and wraps a react-router-dom `Link`. Suggested icon mapping: Chat→MessageSquare, Projects→FolderKanban, Milestones→Flag, Timeline→Clock, Costs→DollarSign, Settings→Settings, Help→HelpCircle. On click, also calls `useUIStore.getState().setActiveView(view)` to sync Zustand state. The active item is highlighted based on the current route path (use `useLocation` from react-router-dom to determine active state, or read from `useUIStore`).

5. **Build AppShell layout** (`src/components/app-shell/app-shell.tsx`): Compose the full layout using shadcn/ui `SidebarProvider` and `Sidebar`. Structure:
   ```
   SidebarProvider
     ├── Sidebar (with SidebarHeader, SidebarContent containing SidebarNav, SidebarFooter)
     └── SidebarInset (main area)
           ├── main content area (Outlet from react-router-dom)
           └── StatusBar
   ```
   The `SidebarProvider` manages open/close state. Use `defaultOpen={true}`. The main content area should use `flex-1 overflow-auto` to fill available space. The overall layout is `min-h-screen` with flex. Import and use `Outlet` from react-router-dom to render the matched child route.

6. **Create an index barrel** (`src/components/app-shell/index.ts`): Re-export AppShell from the directory for clean imports.

7. **Rewrite App.tsx**: Replace the current placeholder content with:
   ```tsx
   <BrowserRouter>
     <ThemeProvider defaultTheme="system" storageKey="gsd-ui-theme">
       <Routes>
         <Route element={<AppShell />}>
           {/* child routes from router.tsx */}
         </Route>
       </Routes>
     </ThemeProvider>
   </BrowserRouter>
   ```
   Import the route children from `src/router.tsx` and render them inside the AppShell layout route. The root `/` path should redirect to `/chat`.

8. **Update App.test.tsx**: The existing tests check for "GSD" heading and a "Get Started" button — both will be gone. Rewrite to test: (a) The app renders without crashing. (b) The sidebar is visible. (c) The default view is Chat. Use `renderWithProviders` or render App directly with necessary mocks.

9. **Verify responsive behavior**: The shadcn/ui Sidebar's `use-mobile` hook detects viewport width < 768px and switches to Sheet mode. At 900×600 (Tauri minimum), the sidebar should be in desktop mode (900 > 768). The layout must remain functional — no overflow, no cropped content. The sidebar `collapsible="icon"` variant can be used to allow collapsing to icon-only mode. Test this in the AppShell test by mocking `use-mobile` to return true and verifying the sidebar still renders.

## Must-Haves

- [ ] StatusBar component renders mock milestone, cost, and model data
- [ ] AppShell layout composes Sidebar + main content area + StatusBar
- [ ] Sidebar shows 7 nav items with icons and labels
- [ ] Clicking a sidebar item navigates to the correct route and renders the correct page
- [ ] Sidebar nav syncs with Zustand `activeView` state
- [ ] App.tsx uses BrowserRouter + ThemeProvider + AppShell with route children
- [ ] All tests pass including new StatusBar, AppShell, and updated App tests
- [ ] Layout is responsive — sidebar uses shadcn/ui's built-in mobile behavior

## Verification

- `npm run test` exits 0 with all tests passing
- `grep -l "StatusBar" src/components/status-bar/status-bar.tsx` — StatusBar exists
- `grep -l "AppShell" src/components/app-shell/app-shell.tsx` — AppShell exists
- `grep -l "SidebarNav" src/components/app-shell/sidebar-nav.tsx` — SidebarNav exists
- `grep -q "BrowserRouter\|createBrowserRouter" src/App.tsx` — App uses router
- `grep -q "Outlet" src/components/app-shell/app-shell.tsx` — AppShell renders route outlet

## Inputs

- `src/router.tsx` — route configuration from T01
- `src/pages/chat-page.tsx` — placeholder page components from T01
- `src/pages/projects-page.tsx` — placeholder page components from T01
- `src/pages/milestones-page.tsx` — placeholder page components from T01
- `src/pages/timeline-page.tsx` — placeholder page components from T01
- `src/pages/costs-page.tsx` — placeholder page components from T01
- `src/pages/settings-page.tsx` — placeholder page components from T01
- `src/pages/help-page.tsx` — placeholder page components from T01
- `src/test/test-utils.tsx` — shared test utility from T01
- `src/components/ui/sidebar.tsx` — shadcn/ui Sidebar primitives from T01
- `src/components/ui/separator.tsx` — from T01
- `src/components/ui/badge.tsx` — existing component for StatusBar
- `src/hooks/use-mobile.ts` — mobile detection hook from T01
- `src/stores/ui-store.ts` — Zustand store with activeView, setActiveView, sidebarOpen, toggleSidebar
- `src/components/theme-provider.tsx` — ThemeProvider wrapping the app
- `src/App.tsx` — current entry point to rewrite
- `src/App.test.tsx` — current tests to update
- `src/lib/utils.ts` — cn() utility

## Expected Output

- `src/components/status-bar/status-bar.tsx` — StatusBar component with mock data
- `src/components/status-bar/status-bar.test.tsx` — StatusBar tests
- `src/components/app-shell/app-shell.tsx` — AppShell layout component
- `src/components/app-shell/app-shell.test.tsx` — AppShell integration tests
- `src/components/app-shell/sidebar-nav.tsx` — Sidebar navigation component
- `src/components/app-shell/index.ts` — barrel export
- `src/App.tsx` — rewritten to use BrowserRouter + AppShell
- `src/App.test.tsx` — updated tests for new App structure

## Observability Impact

- **New signals:** `useUIStore.getState().activeView` now syncs with the current route via a `useEffect` in SidebarNav. Clicking any nav item updates both the URL and the Zustand store.
- **Inspection surfaces:** Sidebar active state is reflected in `data-active="true"` on the active `SidebarMenuButton`. The StatusBar renders mock context (M001/S01/T01), cost ($0.00), and model (Claude Sonnet) — visually inspectable and testable via `screen.getByRole("contentinfo")`.
- **Failure visibility:** Missing or broken sidebar nav items cause navigation to stop working — visible as no route change and no heading update in the main content area. StatusBar absence is immediately visible at the bottom of the viewport. App.tsx compilation failure blocks the entire app from rendering.
- **Future agent inspection:** Import `navItems` from `src/components/app-shell/sidebar-nav.tsx` to enumerate all sidebar entries programmatically. Use `screen.getByRole("navigation", { name: /main/i })` in tests to scope assertions to the sidebar.
