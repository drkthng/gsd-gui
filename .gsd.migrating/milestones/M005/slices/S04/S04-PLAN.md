# S04: Polish — toasts, keyboard shortcuts, skeletons

**Goal:** Keyboard shortcuts functional (Ctrl+N, Ctrl+1-7, Escape), toast notifications wired to GSD events, skeleton loading on async content
**Demo:** Keyboard shortcuts functional, toast notifications wired, loading skeletons on async content

## Must-Haves

- `useKeyboardShortcuts` hook handles Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
- Toast notifications fire on task complete, errors, and budget warnings from GSD event stream
- Sonner toast provider integrated into App.tsx
- All new hooks and components have co-located tests (TDD per R008)
- All 303+ existing tests still pass
- `npm run build` succeeds

## Proof Level

- This slice proves: Contract — unit tests prove hook behavior and toast integration; no real Tauri runtime needed

## Integration Closure

- Upstream: `src/stores/ui-store.ts` (activeView, setActiveView), `src/stores/gsd-store.ts` (event handling), `src/router.tsx` (route paths), `src/App.tsx` (provider tree)
- New wiring: Sonner Toaster added to App.tsx, useKeyboardShortcuts called in AppShell, toast calls added to gsd-store event handlers
- Remains for E2E: S05 will test shortcuts and toasts via Playwright

## Verification

- Toast notifications themselves are the observability surface — they make GSD events (task complete, errors, budget warnings) visible to the user

## Tasks

- [x] **T01: Install sonner, create toast system, wire to GSD events** `est:45m`
  Install sonner (the shadcn/ui-recommended toast library), add Toaster to the provider tree in App.tsx, create a useToastNotifications hook that subscribes to GSD store state changes and fires toasts for task completion, errors, and budget warnings. Write tests first (TDD).
  - Files: `package.json`, `src/App.tsx`, `src/hooks/use-toast-notifications.ts`, `src/hooks/__tests__/use-toast-notifications.test.ts`, `src/components/app-shell/app-shell.tsx`, `src/App.test.tsx`
  - Verify: npm run test -- --run && npm run build

- [x] **T02: Create useKeyboardShortcuts hook with Ctrl+N, Ctrl+1-7, Escape** `est:45m`
  Create a useKeyboardShortcuts hook that registers global keydown listeners for: Ctrl+N (navigate to /projects to create new project), Ctrl+1 through Ctrl+7 (switch tabs matching sidebar nav order), Escape (set gsd-store sessionState to disconnected if streaming). Wire the hook into AppShell. Write comprehensive tests first (TDD). This directly delivers R030.
  - Files: `src/hooks/use-keyboard-shortcuts.ts`, `src/hooks/__tests__/use-keyboard-shortcuts.test.ts`, `src/components/app-shell/app-shell.tsx`
  - Verify: npm run test -- --run && npm run build

## Files Likely Touched

- package.json
- src/App.tsx
- src/hooks/use-toast-notifications.ts
- src/hooks/__tests__/use-toast-notifications.test.ts
- src/components/app-shell/app-shell.tsx
- src/App.test.tsx
- src/hooks/use-keyboard-shortcuts.ts
- src/hooks/__tests__/use-keyboard-shortcuts.test.ts
