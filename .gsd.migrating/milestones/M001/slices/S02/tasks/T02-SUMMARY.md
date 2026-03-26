---
id: T02
parent: S02
milestone: M001
provides:
  - Zustand UI store (useUIStore) with theme, sidebarOpen, activeView state and actions
  - Exported Theme, View, UIState types for use across the app
  - GsdClient interface and createGsdClient() no-op factory for IPC abstraction
  - GsdSession, CommandResult, ProjectInfo, GsdState exported types
key_files:
  - src/stores/ui-store.ts
  - src/stores/ui-store.test.ts
  - src/services/gsd-client.ts
  - src/services/gsd-client.test.ts
key_decisions:
  - Used Zustand getState()/setState() for testing instead of React rendering — pure store tests are faster and simpler
patterns_established:
  - Zustand store reset in tests via setState() without replace flag (replace: true drops action functions)
  - IPC abstraction boundary — gsd-client.ts is the ONLY file allowed to import @tauri-apps/api (R032); currently no-op
observability_surfaces:
  - npm run test covers 11 ui-store tests and 7 gsd-client tests; failures show specific state/action mismatch
  - useUIStore.getState() in browser console shows current UI state for debugging
  - grep -E "^import.*@tauri-apps/api" src/services/gsd-client.ts verifies R032 boundary (should return exit code 1)
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Create Zustand UI store and IPC abstraction with TDD

**Created Zustand UI store with theme/sidebar/activeView state and typed IPC abstraction with no-op implementation, both verified by 18 new unit tests.**

## What Happened

1. Installed `zustand@5.0.12` as a production dependency.

2. Wrote UI store tests first (`src/stores/ui-store.test.ts`) — 11 tests covering initial state values (theme=system, sidebarOpen=true, activeView=chat) and all three actions (setTheme, toggleSidebar, setActiveView). Used Zustand's `getState()` for direct store testing without React rendering.

3. Implemented `src/stores/ui-store.ts` with the `create<UIState>()` pattern. Exports the `useUIStore` hook and `Theme`, `View`, `UIState` types. The View type includes all 7 app views: chat, projects, milestones, timeline, costs, settings, help.

4. Wrote IPC abstraction tests (`src/services/gsd-client.test.ts`) — 7 tests covering the `createGsdClient()` factory, each method's return shape, and optional args handling.

5. Implemented `src/services/gsd-client.ts` with the `GsdClient` interface and `createGsdClient()` factory returning no-op implementations. All async methods return sensible defaults (empty arrays, null states, success results). Zero `@tauri-apps/api` imports — real Tauri IPC wiring is deferred to M002.

## Verification

- `npm run test` exits 0 — 30 tests pass across 5 files (utils: 6, App: 1, Button: 5, ui-store: 11, gsd-client: 7)
- `npm run build` exits 0 — tsc + Vite production build succeeds (194.54 kB JS, 21.43 kB CSS)
- No actual `@tauri-apps/api` import statements in gsd-client.ts (only a documentation comment)
- Both `src/stores/ui-store.ts` and `src/services/gsd-client.ts` exist

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test` | 0 | ✅ pass | 8.23s |
| 2 | `npm run build` | 0 | ✅ pass | 10.2s |
| 3 | `grep -E "^import.*@tauri-apps/api" src/services/gsd-client.ts` | 1 | ✅ pass (no matches) | <1s |
| 4 | `test -f src/stores/ui-store.ts && test -f src/services/gsd-client.ts` | 0 | ✅ pass | <1s |
| 5 | `test -f src/styles/globals.css` | 0 | ✅ pass | <1s |
| 6 | `test -f components.json` | 0 | ✅ pass | <1s |
| 7 | `test -f src/components/ui/button.tsx` | 0 | ✅ pass | <1s |
| 8 | `test -f src/components/theme-provider.tsx` | 1 | ⏳ expected (T03) | <1s |
| 9 | `npm run build 2>&1 \| tail -5` | 0 | ✅ pass (ends with "built in") | <1s |

## Diagnostics

- `npx vitest run src/stores/ui-store.test.ts` — runs only store tests; failures show which action/state assertion broke
- `npx vitest run src/services/gsd-client.test.ts` — runs only IPC tests; failures show which method returned unexpected shape
- `node -e "console.log(require('./package.json').dependencies.zustand)"` — confirms zustand version
- `grep -E "^import.*@tauri-apps/api" src/services/gsd-client.ts` — should always exit 1 (no matches); exit 0 means R032 violated

## Deviations

- **Zustand setState reset pattern:** The initial test used `setState(data, true)` (replace mode) which dropped action functions from the store. Fixed to use `setState(data)` (merge mode) which preserves the Zustand-created actions. This is a Zustand v5 gotcha worth knowing.

## Known Issues

None.

## Files Created/Modified

- `package.json` — added zustand@5.0.12 dependency
- `src/stores/ui-store.ts` — new Zustand UI store with theme, sidebarOpen, activeView state
- `src/stores/ui-store.test.ts` — 11 unit tests for store state and actions
- `src/services/gsd-client.ts` — new IPC abstraction with GsdClient interface and no-op factory
- `src/services/gsd-client.test.ts` — 7 unit tests for IPC client methods
- `.gsd/milestones/M001/slices/S02/tasks/T02-PLAN.md` — added Observability Impact section
