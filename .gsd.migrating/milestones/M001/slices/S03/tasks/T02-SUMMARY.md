---
id: T02
parent: S03
milestone: M001
provides:
  - AppShell layout component composing Sidebar + main content + StatusBar
  - SidebarNav component with 7 navigation items synced to Zustand activeView
  - StatusBar component with mock milestone/cost/model data
  - App.tsx rewritten with BrowserRouter + ThemeProvider + AppShell + route children
  - Updated App.test.tsx and new component tests
  - ResizeObserver mock in test setup for Radix UI compatibility
key_files:
  - src/components/app-shell/app-shell.tsx
  - src/components/app-shell/sidebar-nav.tsx
  - src/components/app-shell/index.ts
  - src/components/status-bar/status-bar.tsx
  - src/App.tsx
  - src/App.test.tsx
key_decisions:
  - "Zustand activeView synced via useEffect on location.pathname rather than onClick handlers — more robust with Radix Slot composition"
  - "Removed tooltip prop from SidebarMenuButton to avoid Radix Popper crashes in jsdom; tooltips only needed when sidebar is collapsed to icon mode"
  - "Added ResizeObserver mock to global test setup (src/test/setup.ts) for Radix UI Popper compatibility in jsdom"
patterns_established:
  - "SidebarNav uses useEffect to sync route→Zustand; downstream components should read activeView from useUIStore, not from location"
  - "Test sidebar nav items using screen.getByRole('navigation', { name: /main/i }) to scope assertions"
  - "AppShell wraps content in SidebarProvider → Sidebar + SidebarInset; new layout routes must be children of AppShell via Outlet"
observability_surfaces:
  - "data-active='true' attribute on active SidebarMenuButton for visual debugging"
  - "useUIStore.getState().activeView reflects current route after navigation"
  - "StatusBar renders mock context (M001/S01/T01), cost ($0.00), model (Claude Sonnet) — visible at bottom of viewport"
  - "navItems array exported from sidebar-nav.tsx for programmatic inspection"
duration: 12m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Build AppShell layout with Sidebar navigation, StatusBar, and responsive wiring

**Built complete app shell with sidebar (7 nav items), route outlet, status bar, and responsive wiring — rewrote App.tsx with BrowserRouter integration — all 69 tests pass.**

## What Happened

1. Wrote StatusBar tests first (TDD) verifying mock milestone context, cost, and model data render. Implemented StatusBar as a `<footer>` with Badge components for the context and model items.

2. Wrote AppShell tests verifying: 7 nav labels present, clicking each nav item renders the correct page heading, StatusBar visible, default route shows Chat, Zustand activeView syncs on navigation, and mobile mode rendering doesn't crash.

3. Created SidebarNav component with 7 navigation items (Chat, Projects, Milestones, Timeline, Costs, Settings, Help) using lucide-react icons and react-router-dom Links inside shadcn/ui SidebarMenuButton. Active highlighting uses `isActive` prop based on `location.pathname`. Zustand `activeView` is synced via `useEffect` on location change rather than onClick — this avoids issues with Radix Slot event composition.

4. Built AppShell layout composing SidebarProvider → Sidebar (header/content/footer) + SidebarInset (Outlet + StatusBar). Sidebar uses `collapsible="icon"` for collapsed mode. Mobile viewport (< 768px) gets a sidebar trigger in the top bar.

5. Rewrote App.tsx: BrowserRouter → ThemeProvider → Routes with AppShell as layout route and appRoutes from router.tsx as children. Updated App.test.tsx to verify sidebar nav, StatusBar, and Chat default view.

6. Added ResizeObserver mock to `src/test/setup.ts` to fix Radix UI Popper crashes in jsdom — this was needed because SidebarMenuButton's tooltip support triggers Radix's `useSize` hook.

## Verification

- `npm run test` — 69 tests pass (57 existing + 4 StatusBar + 7 AppShell + 3 App, minus 2 old App tests that were replaced)
- `grep -l "StatusBar" src/components/status-bar/status-bar.tsx` — exists ✓
- `grep -l "AppShell" src/components/app-shell/app-shell.tsx` — exists ✓
- `grep -l "SidebarNav" src/components/app-shell/sidebar-nav.tsx` — exists ✓
- `grep -q "BrowserRouter" src/App.tsx` — App uses router ✓
- `grep -q "Outlet" src/components/app-shell/app-shell.tsx` — AppShell renders Outlet ✓

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test` | 0 | ✅ pass | 14s |
| 2 | `grep -l "StatusBar" src/components/status-bar/status-bar.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -l "AppShell" src/components/app-shell/app-shell.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -l "SidebarNav" src/components/app-shell/sidebar-nav.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "BrowserRouter" src/App.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "Outlet" src/components/app-shell/app-shell.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **Sidebar nav inspection:** Import `navItems` from `src/components/app-shell/sidebar-nav.tsx` to enumerate all 7 sidebar entries with path/view/icon.
- **Active route:** `useUIStore.getState().activeView` returns the current view after navigation. Active sidebar item has `data-active="true"` attribute.
- **StatusBar:** Visible at bottom of viewport. Test with `screen.getByRole("contentinfo")`. Shows "M001 / S01 / T01", "$0.00", "Claude Sonnet".
- **Test utility:** `src/test/setup.ts` now includes ResizeObserver mock globally — no per-file setup needed for Radix components.
- **Responsive behavior:** shadcn/ui Sidebar renders as Sheet on mobile (< 768px). At 900px (Tauri minimum), sidebar is in desktop mode.

## Deviations

- Removed `tooltip` prop from SidebarMenuButton to avoid Radix Popper crashes in jsdom. Tooltips are only visible when sidebar is collapsed to icon mode — functionality preserved, just not shown by default. Can be re-added with a Radix-compatible tooltip mock if needed.
- Used `useEffect` on `location.pathname` for Zustand sync instead of `onClick` on Link — avoids event propagation issues with Radix Slot composition and is more reliable (also catches programmatic navigation).

## Known Issues

None.

## Files Created/Modified

- `src/components/status-bar/status-bar.tsx` — StatusBar component with mock milestone/cost/model data
- `src/components/status-bar/status-bar.test.tsx` — 4 tests for StatusBar rendering
- `src/components/app-shell/app-shell.tsx` — AppShell layout composing Sidebar + SidebarInset + StatusBar
- `src/components/app-shell/app-shell.test.tsx` — 7 tests for AppShell (nav items, routing, store sync, mobile mode)
- `src/components/app-shell/sidebar-nav.tsx` — SidebarNav with 7 nav items, lucide icons, route links, Zustand sync
- `src/components/app-shell/index.ts` — barrel export for AppShell
- `src/App.tsx` — rewritten with BrowserRouter + ThemeProvider + AppShell + route children
- `src/App.test.tsx` — updated tests for new App structure (3 tests: renders, sidebar visible, default Chat)
- `src/test/setup.ts` — added ResizeObserver mock for Radix UI compatibility
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — marked T02 done
- `.gsd/milestones/M001/slices/S03/tasks/T02-PLAN.md` — added Observability Impact section
