---
estimated_steps: 5
estimated_files: 7
skills_used: []
---

# T01: Build ModeToggle component with TDD and wire into sidebar footer

**Slice:** S04 — Theme toggle, placeholder pages, shell polish
**Milestone:** M001

## Description

Create the ModeToggle dropdown component that lets users switch between dark, light, and system theme modes. The ThemeProvider context and useTheme hook already exist (from S02) — this task builds the UI control and wires it into the AppShell sidebar footer. Uses shadcn/ui DropdownMenu for the dropdown. TDD: tests first, then implementation.

The ThemeProvider already handles:
- Reading initial theme from `localStorage` (key: `gsd-ui-theme`)
- Persisting theme changes to `localStorage`
- Applying `dark`/`light` class to `document.documentElement`
- Resolving `system` to the OS preference via `matchMedia`

So ModeToggle just needs to: (1) show a sun/moon icon button, (2) open a dropdown with 3 options, (3) call `setTheme()` from `useTheme()`.

## Steps

1. **Add shadcn/ui DropdownMenu component.** Run `npx shadcn@latest add dropdown-menu`. If the CLI creates files under a literal `@/` directory (K006), move them to `src/components/ui/` and delete the `@/` folder. Verify `src/components/ui/dropdown-menu.tsx` exists with the standard shadcn DropdownMenu exports (DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem).

2. **Write ModeToggle tests (TDD).** Create `src/components/mode-toggle/mode-toggle.test.tsx`:
   - Test: renders a button with accessible label (e.g., "Toggle theme")
   - Test: clicking the trigger button opens a dropdown menu
   - Test: dropdown contains 3 items: "Light", "Dark", "System"
   - Test: clicking "Dark" calls `setTheme("dark")` — mock `useTheme` or use the real ThemeProvider and check `document.documentElement.classList`
   - Test: clicking "Light" calls `setTheme("light")`
   - Test: clicking "System" calls `setTheme("system")`
   - Use `renderWithProviders` from `src/test/test-utils.tsx` and `userEvent` for interactions.
   - NOTE: DropdownMenu uses Radix Popper internally. The global ResizeObserver mock (K010) in `src/test/setup.ts` handles this. If DismissableLayer or FocusScope cause issues in jsdom, consider testing via the real ThemeProvider state changes (check `document.documentElement.classList`) rather than mocking useTheme.

3. **Implement ModeToggle component.** Create `src/components/mode-toggle/mode-toggle.tsx`:
   - Import `useTheme` from `@/components/theme-provider`
   - Import `Sun`, `Moon` from `lucide-react`
   - Import DropdownMenu primitives from `@/components/ui/dropdown-menu`
   - Import `Button` from `@/components/ui/button`
   - Render: Button trigger with Sun icon (light) / Moon icon (dark), sr-only "Toggle theme" text
   - DropdownMenuContent with 3 DropdownMenuItems: Light, Dark, System
   - Each item calls `setTheme()` with the corresponding value
   - Create `src/components/mode-toggle/index.ts` barrel export.

4. **Wire ModeToggle into AppShell sidebar footer.** Edit `src/components/app-shell/app-shell.tsx`:
   - Import `ModeToggle` from `@/components/mode-toggle`
   - Place `<ModeToggle />` in the `<SidebarFooter>` next to the existing `<SidebarTrigger>`
   - Layout: flex row with gap, both items centered

5. **Update AppShell test and run full suite.** Update `src/components/app-shell/app-shell.test.tsx` to verify ModeToggle presence (a button with "Toggle theme" label exists). Run `npx vitest run` to confirm all tests pass.

## Must-Haves

- [ ] `src/components/ui/dropdown-menu.tsx` exists with standard shadcn DropdownMenu exports
- [ ] `src/components/mode-toggle/mode-toggle.test.tsx` has tests covering render, 3 theme options, and theme switching
- [ ] `src/components/mode-toggle/mode-toggle.tsx` implements the dropdown using useTheme() and DropdownMenu
- [ ] ModeToggle is rendered in AppShell's SidebarFooter
- [ ] All tests pass (existing 69 + new ModeToggle tests)
- [ ] Tests written before implementation (R008 TDD)

## Verification

- `npx vitest run` — all tests pass
- `npx vitest run src/components/mode-toggle/mode-toggle.test.tsx` — ModeToggle-specific tests pass
- `grep -l "ModeToggle" src/components/app-shell/app-shell.tsx` — confirms wiring

## Inputs

- `src/components/theme-provider.tsx` — provides useTheme() hook that ModeToggle calls
- `src/components/ui/button.tsx` — Button component used as the dropdown trigger
- `src/components/app-shell/app-shell.tsx` — where ModeToggle will be placed (sidebar footer)
- `src/components/app-shell/app-shell.test.tsx` — existing tests to extend
- `src/test/test-utils.tsx` — renderWithProviders utility for tests
- `src/test/setup.ts` — global test setup with ResizeObserver mock

## Expected Output

- `src/components/ui/dropdown-menu.tsx` — shadcn/ui DropdownMenu component
- `src/components/mode-toggle/mode-toggle.tsx` — ModeToggle component
- `src/components/mode-toggle/mode-toggle.test.tsx` — ModeToggle tests
- `src/components/mode-toggle/index.ts` — barrel export
- `src/components/app-shell/app-shell.tsx` — modified to include ModeToggle in sidebar footer
- `src/components/app-shell/app-shell.test.tsx` — updated with ModeToggle presence test

## Observability Impact

- **New signals:** ModeToggle renders with `aria-label="Toggle theme"` and `aria-expanded` (true/false) on the trigger button, allowing agents to detect dropdown state. Theme changes are reflected in `document.documentElement.classList` and `localStorage('gsd-ui-theme')`.
- **Inspection:** After this task, an agent can verify theme toggle works by: (1) clicking the button with label "Toggle theme", (2) checking `aria-expanded="true"` on the trigger, (3) clicking a menu item, (4) reading `document.documentElement.classList` for `dark`/`light`.
- **Failure state:** If ModeToggle is missing from the sidebar, the "Toggle theme" button won't appear in the accessibility tree. If useTheme context is broken, React error boundary catches the throw.
