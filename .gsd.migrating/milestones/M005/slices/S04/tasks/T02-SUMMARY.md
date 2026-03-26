---
id: T02
parent: S04
milestone: M005
key_files:
  - src/hooks/use-keyboard-shortcuts.ts
  - src/hooks/use-keyboard-shortcuts.test.tsx
  - src/components/app-shell/app-shell.tsx
  - src/components/app-shell/sidebar-nav.tsx
  - src/App.test.tsx
  - src/pages/__tests__/pages.test.tsx
key_decisions:
  - Keyboard shortcuts skip input/textarea/contenteditable to avoid hijacking user typing
  - View order hardcoded to match sidebar-nav navItems array order for Ctrl+1-7 mapping
duration: ""
verification_result: passed
completed_at: 2026-03-25T14:32:31.741Z
blocker_discovered: false
---

# T02: Create useKeyboardShortcuts hook with Ctrl+N, Ctrl+1-7, Escape and fix build/test failures

**Create useKeyboardShortcuts hook with Ctrl+N, Ctrl+1-7, Escape and fix build/test failures**

## What Happened

Created the useKeyboardShortcuts hook implementing global keyboard shortcuts: Ctrl+N navigates to /projects, Ctrl+1-7 switches sidebar tabs by index, Escape disconnects streaming sessions. The hook skips shortcuts when focus is in input/textarea/contenteditable elements. Wired into AppShell alongside existing hooks.

Also fixed pre-existing failures: removed stray `{ navItems }` line in sidebar-nav.tsx causing worker crashes, removed unused ProToolsPage import in pages.test.tsx causing build error, and fixed the Toaster test that relied on sonner rendering data-sonner-toaster in jsdom (it doesn't). Renamed test file to .tsx for JSX support.

## Verification

npm run build passes (exit 0), npm run test -- --run passes all 51 suites / 318 tests (exit 0). New keyboard shortcuts test covers: Ctrl+N navigation, Ctrl+1/3/7 tab switching, Escape disconnect when streaming, Escape no-op when not streaming, input/textarea focus guard, out-of-range Ctrl+8.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 10380ms |
| 2 | `npm run test -- --run` | 0 | ✅ pass | 80700ms |


## Deviations

Fixed pre-existing build failures (unused imports, stray code line, Toaster test) that were not part of the task plan but were blocking verification. Test file uses .tsx extension instead of .ts due to JSX wrapper component.

## Known Issues

None.

## Files Created/Modified

- `src/hooks/use-keyboard-shortcuts.ts`
- `src/hooks/use-keyboard-shortcuts.test.tsx`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/sidebar-nav.tsx`
- `src/App.test.tsx`
- `src/pages/__tests__/pages.test.tsx`
