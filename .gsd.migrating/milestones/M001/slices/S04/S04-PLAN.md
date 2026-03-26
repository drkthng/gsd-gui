# S04: Theme toggle, placeholder pages, shell polish

**Goal:** Dark/light/system theme toggle works with persistence, all 7 placeholder pages have distinct content, and the complete shell looks and feels like a real desktop app.
**Demo:** Click the theme toggle in the sidebar footer to switch between dark, light, and system modes. The theme persists across page reload. Each of the 7 placeholder pages shows a distinct icon, description, and mock data hint. The shell has consistent spacing, hover states, and transitions across both themes.

## Must-Haves

- ModeToggle component using shadcn/ui DropdownMenu and `useTheme()` from ThemeProvider
- ModeToggle placed in the sidebar footer area of AppShell
- Theme toggle cycles between dark, light, and system modes
- Theme selection persists to localStorage (already handled by ThemeProvider — ModeToggle just calls `setTheme`)
- All 7 placeholder pages have distinct content: page-specific icon, descriptive text, and mock data placeholder
- TDD: tests written before implementation for ModeToggle and enriched pages (R008)
- All existing 69 tests continue to pass

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes (UAT visual inspection of theme toggle and page content)
- Human/UAT required: yes (visual inspection across dark/light/system modes, responsive behavior)

## Verification

- `npx vitest run` — all tests pass (existing 69 + new tests for ModeToggle and enriched pages)
- `src/components/mode-toggle/mode-toggle.test.tsx` — ModeToggle renders, shows 3 theme options, calls setTheme on click
- `src/pages/__tests__/pages.test.tsx` — updated tests asserting each page has its distinct icon and descriptive content
- `npm run tauri dev` — visual UAT: toggle works, theme persists on reload, pages look distinct
- `npx vitest run --reporter=verbose 2>&1 | grep -E "(FAIL|Error|useTheme)"` — no ThemeProvider/useTheme errors in test output (failure-path diagnostic check)

## Observability / Diagnostics

- **Runtime signals:** Theme state is observable via `localStorage.getItem('gsd-ui-theme')` and `document.documentElement.classList` (contains `dark` or `light`). ModeToggle dropdown state is accessible via ARIA attributes (`aria-expanded` on trigger).
- **Inspection surfaces:** Browser DevTools → Application → Local Storage → `gsd-ui-theme` shows persisted value. The `<html>` element's class attribute shows the resolved theme. React DevTools can inspect ThemeProvider context value.
- **Failure visibility:** If ThemeProvider is missing, `useTheme()` throws "useTheme must be used within a ThemeProvider" — this error appears in both console and React error boundary. If DropdownMenu fails to render, the trigger button still renders but menu won't open (no crash).
- **Redaction:** No sensitive data in theme state. localStorage key is a simple string enum.

## Integration Closure

- Upstream surfaces consumed: `src/components/theme-provider.tsx` (useTheme hook), `src/components/app-shell/app-shell.tsx` (sidebar footer placement), all 7 page components from `src/pages/`, `src/components/ui/button.tsx`
- New wiring introduced in this slice: ModeToggle component composed into AppShell sidebar footer; DropdownMenu UI component added
- What remains before the milestone is truly usable end-to-end: nothing — S04 is the final M001 slice

## Tasks

- [x] **T01: Build ModeToggle component with TDD and wire into sidebar footer** `est:30m`
  - Why: R007 requires dark/light/system theme toggle. The ThemeProvider and useTheme hook exist from S02 but no UI toggle control exists yet. This task creates the ModeToggle dropdown and places it in the AppShell sidebar footer.
  - Files: `src/components/mode-toggle/mode-toggle.test.tsx`, `src/components/mode-toggle/mode-toggle.tsx`, `src/components/mode-toggle/index.ts`, `src/components/ui/dropdown-menu.tsx`, `src/components/app-shell/app-shell.tsx`, `src/components/app-shell/app-shell.test.tsx`
  - Do: (1) Add shadcn/ui DropdownMenu component via `npx shadcn@latest add dropdown-menu` (with K006 fix for Windows path issue). (2) Write tests for ModeToggle: renders a trigger button, clicking opens dropdown with 3 options (Light, Dark, System), clicking an option calls setTheme. (3) Implement ModeToggle using DropdownMenu + useTheme(). (4) Wire ModeToggle into AppShell's SidebarFooter next to SidebarTrigger. (5) Update app-shell tests to verify ModeToggle is present. (6) Run full test suite.
  - Verify: `npx vitest run`
  - Done when: ModeToggle renders in sidebar footer, all 3 theme options work, tests pass, existing tests unbroken

- [x] **T02: Enrich 7 placeholder pages with distinct content and apply shell polish** `est:35m`
  - Why: The roadmap demo says "all 7 placeholder pages have distinct content" and "the complete shell looks and feels like a real app." Currently all pages are identical heading+description. This task makes each page visually unique and adds polish.
  - Files: `src/pages/chat-page.tsx`, `src/pages/projects-page.tsx`, `src/pages/milestones-page.tsx`, `src/pages/timeline-page.tsx`, `src/pages/costs-page.tsx`, `src/pages/settings-page.tsx`, `src/pages/help-page.tsx`, `src/pages/__tests__/pages.test.tsx`, `src/components/status-bar/status-bar.tsx`
  - Do: (1) Update page tests first (TDD): each page test asserts on page-specific icon presence and a distinct mock data section/card. (2) Enrich each page component with: its own lucide icon in the header, 2-3 mock data cards/sections hinting at future functionality, consistent layout using Tailwind utility classes. (3) Add subtle visual polish to shell: transition classes on theme changes, consistent hover states on interactive elements in StatusBar, smooth sidebar transitions. (4) Run full test suite.
  - Verify: `npx vitest run`
  - Done when: Each page has visually distinct content (icon, cards/sections), shell has smooth transitions and hover states, all tests pass

## Files Likely Touched

- `src/components/mode-toggle/mode-toggle.tsx`
- `src/components/mode-toggle/mode-toggle.test.tsx`
- `src/components/mode-toggle/index.ts`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/app-shell.test.tsx`
- `src/pages/chat-page.tsx`
- `src/pages/projects-page.tsx`
- `src/pages/milestones-page.tsx`
- `src/pages/timeline-page.tsx`
- `src/pages/costs-page.tsx`
- `src/pages/settings-page.tsx`
- `src/pages/help-page.tsx`
- `src/pages/__tests__/pages.test.tsx`
- `src/components/status-bar/status-bar.tsx`
