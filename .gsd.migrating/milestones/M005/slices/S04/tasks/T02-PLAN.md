---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T02: Create useKeyboardShortcuts hook with Ctrl+N, Ctrl+1-7, Escape

Create a useKeyboardShortcuts hook that registers global keydown listeners for: Ctrl+N (navigate to /projects to create new project), Ctrl+1 through Ctrl+7 (switch tabs matching sidebar nav order), Escape (set gsd-store sessionState to disconnected if streaming). Wire the hook into AppShell. Write comprehensive tests first (TDD). This directly delivers R030.

## Inputs

- ``src/components/app-shell/app-shell.tsx` — where hook will be called`
- ``src/components/app-shell/sidebar-nav.tsx` — navItems array defining tab order for Ctrl+1-7`
- ``src/stores/ui-store.ts` — setActiveView action`
- ``src/stores/gsd-store.ts` — sessionState and disconnect for Escape`
- ``src/router.tsx` — route paths for navigation`

## Expected Output

- ``src/hooks/use-keyboard-shortcuts.ts` — hook with global keydown handler for Ctrl+N, Ctrl+1-7, Escape`
- ``src/hooks/__tests__/use-keyboard-shortcuts.test.ts` — tests covering all shortcut combos and edge cases`
- ``src/components/app-shell/app-shell.tsx` — updated to call useKeyboardShortcuts`

## Verification

npm run test -- --run && npm run build
