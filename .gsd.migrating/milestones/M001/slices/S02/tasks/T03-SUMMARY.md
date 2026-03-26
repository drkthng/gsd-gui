---
id: T03
parent: S02
milestone: M001
provides:
  - ThemeProvider React context component with dark/light/system theme modes
  - useTheme() hook for consuming theme state anywhere in the component tree
  - localStorage persistence of theme preference under "gsd-ui-theme" key
  - App.tsx wrapped with ThemeProvider as top-level provider
  - shadcn/ui Button rendered inside ThemeProvider proving full stack integration
key_files:
  - src/components/theme-provider.tsx
  - src/components/theme-provider.test.tsx
  - src/App.tsx
  - src/App.test.tsx
key_decisions:
  - Initialized ThemeProviderContext with undefined (not a default state object) so useTheme() can detect usage outside ThemeProvider and throw a clear error
patterns_established:
  - ThemeProvider must wrap all app content in App.tsx; useTheme() throws if used outside
  - matchMedia must be mocked in vitest beforeEach for any test that renders ThemeProvider (jsdom doesn't implement it)
observability_surfaces:
  - document.documentElement.classList in browser shows "dark" or "light" based on active theme
  - localStorage.getItem("gsd-ui-theme") in browser console returns persisted theme value
  - npx vitest run src/components/theme-provider.test.tsx — 10 tests covering class application, persistence, system detection, context error
  - npx vitest run src/App.test.tsx — 2 tests verifying ThemeProvider wraps app and Button renders
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T03: Create ThemeProvider component, wire into App, and run full integration check

**Built ThemeProvider with dark/light/system modes and localStorage persistence, wired it into App.tsx with a shadcn/ui Button, and verified the complete S02 stack (41 tests pass, production build succeeds).**

## What Happened

1. Wrote 10 ThemeProvider tests first (TDD) in `src/components/theme-provider.test.tsx` covering: renders children, useTheme() returns theme/setTheme, defaults to "system", setTheme("dark") applies class, setTheme("light") applies class, persists to localStorage, reads from localStorage on mount, applies system theme class via matchMedia, removes previous class on theme switch, throws error when useTheme() is used outside ThemeProvider.

2. Implemented `src/components/theme-provider.tsx` with `ThemeProvider` and `useTheme` exports. Key design choice: context initialized with `undefined` rather than a default state object, so `useTheme()` can detect and throw when called outside the provider. Uses `"gsd-ui-theme"` as the localStorage key.

3. Updated `src/App.tsx` to wrap content with `<ThemeProvider defaultTheme="system" storageKey="gsd-ui-theme">` and added a `<Button>Get Started</Button>` to prove shadcn/ui + ThemeProvider integration.

4. Updated `src/App.test.tsx` with matchMedia mock in beforeEach (required since ThemeProvider uses matchMedia for system theme detection) and added a second test verifying the Button renders with correct role.

5. Deleted `src/App.css` (empty, no references, replaced by `globals.css` since T01).

## Verification

All task-level and slice-level checks pass:
- `npm run test` — 41 tests pass across 6 files (utils: 6, theme-provider: 10, App: 2, gsd-client: 7, ui-store: 11, Button: 5)
- `npm run build` — tsc + Vite production build succeeds (226.61 kB JS, 22.10 kB CSS)
- `! test -f src/App.css` — old CSS file removed
- `grep -q "ThemeProvider" src/App.tsx` — ThemeProvider wired into App
- All 9 slice file existence checks pass (globals.css, components.json, button.tsx, ui-store.ts, gsd-client.ts, theme-provider.tsx)
- `npm run build 2>&1 | tail -5` — ends with "✓ built in 1.96s"

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test` | 0 | ✅ pass | 8.7s |
| 2 | `npm run build` | 0 | ✅ pass | 6.0s |
| 3 | `! test -f src/App.css` | 0 | ✅ pass | <1s |
| 4 | `grep -q "ThemeProvider" src/App.tsx` | 0 | ✅ pass | <1s |
| 5 | `test -f src/styles/globals.css` | 0 | ✅ pass | <1s |
| 6 | `test -f components.json` | 0 | ✅ pass | <1s |
| 7 | `test -f src/components/ui/button.tsx` | 0 | ✅ pass | <1s |
| 8 | `test -f src/stores/ui-store.ts` | 0 | ✅ pass | <1s |
| 9 | `test -f src/services/gsd-client.ts` | 0 | ✅ pass | <1s |
| 10 | `test -f src/components/theme-provider.tsx` | 0 | ✅ pass | <1s |
| 11 | `npm run build 2>&1 \| tail -5` | 0 | ✅ pass (ends with "built in") | <1s |

## Diagnostics

- `npx vitest run src/components/theme-provider.test.tsx` — runs only ThemeProvider tests; failures show which theme operation broke
- `npx vitest run src/App.test.tsx` — runs only App integration tests; verifies ThemeProvider wraps app correctly
- `document.documentElement.classList` in browser console — shows active theme class ("dark" or "light")
- `localStorage.getItem("gsd-ui-theme")` in browser console — shows persisted theme value

## Deviations

- **Context initial value changed to `undefined`:** The task plan showed initializing `ThemeProviderContext` with a default state object (`{ theme: "system", setTheme: () => null }`). I used `undefined` instead so the "throw error outside provider" check actually works — with a non-undefined default, `useContext()` would silently return the default and never enter the `=== undefined` branch.

## Known Issues

None.

## Files Created/Modified

- `src/components/theme-provider.tsx` — new ThemeProvider context component with useTheme hook
- `src/components/theme-provider.test.tsx` — 10 tests for ThemeProvider behavior
- `src/App.tsx` — wrapped with ThemeProvider, added Button component
- `src/App.test.tsx` — updated with matchMedia mock and Button render test
- `src/App.css` — deleted (replaced by globals.css)
- `.gsd/milestones/M001/slices/S02/tasks/T03-PLAN.md` — added Observability Impact section
- `.gsd/milestones/M001/slices/S02/S02-PLAN.md` — marked T03 as done
