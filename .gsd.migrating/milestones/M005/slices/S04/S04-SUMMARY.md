---
id: S04
parent: M005
milestone: M005
provides:
  - useKeyboardShortcuts hook for E2E test assertions
  - Toast notification system for E2E test assertions
requires:
  []
affects:
  - S05
key_files:
  - src/hooks/use-toast-notifications.ts
  - src/hooks/use-toast-notifications.test.ts
  - src/hooks/use-keyboard-shortcuts.ts
  - src/hooks/use-keyboard-shortcuts.test.tsx
  - src/App.tsx
  - src/components/app-shell/app-shell.tsx
key_decisions:
  - Used sonner with richColors for distinct toast variants (success/error/warning)
  - Tracked previous GSD state via useRef to prevent duplicate toasts on re-renders
  - Keyboard shortcuts skip input/textarea/contenteditable elements
  - View order for Ctrl+1-7 hardcoded to match sidebar-nav navItems array order
patterns_established:
  - useToastNotifications hook pattern: subscribe to Zustand store, compare previous state via useRef, fire toasts on delta
  - useKeyboardShortcuts hook pattern: global keydown listener with input element filtering and cleanup
observability_surfaces:
  - Toast notifications surface GSD events (task complete, errors, budget warnings) to the user in real-time
drill_down_paths:
  - .gsd/milestones/M005/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T14:36:19.688Z
blocker_discovered: false
---

# S04: Polish — toasts, keyboard shortcuts, skeletons

**Added sonner toast notifications wired to GSD events and keyboard shortcuts (Ctrl+N, Ctrl+1-7, Escape) for power-user navigation.**

## What Happened

T01 installed sonner and created a useToastNotifications hook that subscribes to GSD store state changes, firing toasts for task completion (success), errors (error), and budget warnings (warning). The Toaster component was added to App.tsx. T02 created a useKeyboardShortcuts hook with global keydown listeners for Ctrl+N (navigate to projects), Ctrl+1-7 (switch tabs matching sidebar nav order), and Escape (disconnect streaming session). Both hooks are wired into AppShell. Shortcuts skip input/textarea/contenteditable elements to avoid hijacking user typing. All 318 tests pass across 51 files and the production build succeeds.

## Verification

npm run test -- --run: 318 tests passed across 51 test files. npm run build: succeeded, producing dist/ with 1090 kB JS and 70 kB CSS.

## Requirements Advanced

- R030 — Keyboard shortcuts implemented: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)

## Requirements Validated

- R030 — Unit tests verify all shortcut bindings fire correct actions; 318 tests pass
- R008 — Both hooks developed TDD — tests written before implementation code

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Skeleton loading components mentioned in the slice title were not implemented as separate tasks — the existing ProToolPanel loading states from S01 already cover async content loading patterns.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `package.json` — Added sonner dependency
- `src/App.tsx` — Added Toaster component from sonner
- `src/hooks/use-toast-notifications.ts` — New hook subscribing to GSD store for toast notifications
- `src/hooks/use-toast-notifications.test.ts` — Tests for toast notification hook
- `src/hooks/use-keyboard-shortcuts.ts` — New hook for global keyboard shortcuts
- `src/hooks/use-keyboard-shortcuts.test.tsx` — Tests for keyboard shortcuts hook
- `src/components/app-shell/app-shell.tsx` — Wired useToastNotifications and useKeyboardShortcuts hooks
