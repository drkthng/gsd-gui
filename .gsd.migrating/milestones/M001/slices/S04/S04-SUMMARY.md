# S04 Summary: Theme toggle, placeholder pages, shell polish

**Status:** Complete
**Tasks:** T01 ✅, T02 ✅
**Tests:** 97 pass across 11 test files (28 new tests added: 6 ModeToggle, 1 AppShell, 21 enriched pages)
**Duration:** ~30m total

## What This Slice Delivered

S04 is the final M001 slice. It completed the app shell by adding the theme toggle UI, enriching all placeholder pages with distinct content, and applying visual polish for smooth theme transitions.

### T01: ModeToggle component (6 new tests)
- Built `src/components/mode-toggle/mode-toggle.tsx` — a dropdown button with Sun/Moon icons that cycles dark/light/system themes via `useTheme()` from ThemeProvider
- Added shadcn/ui DropdownMenu primitive (`src/components/ui/dropdown-menu.tsx`) via CLI with K006 Windows path fix
- Wired ModeToggle into AppShell's SidebarFooter next to SidebarTrigger
- Tests use real ThemeProvider (no useTheme mocking) — verify theme changes via `document.documentElement.classList` and `localStorage`

### T02: Enriched pages + shell polish (22 new/updated tests)
- All 7 placeholder pages now have distinct content: page-specific lucide icon (`data-testid="page-icon"`), 2+ mock data cards/sections (`data-testid="mock-section"`), descriptive text hinting at future functionality
- Added `transition-colors duration-200` to StatusBar footer and main content area for smooth theme switching
- Fixed heading ambiguity across test files — all `getByRole("heading")` queries now use `{ level: 1 }` (documented as K012)

## Key Files

| File | Purpose |
|------|---------|
| `src/components/mode-toggle/mode-toggle.tsx` | Theme toggle dropdown (dark/light/system) |
| `src/components/mode-toggle/mode-toggle.test.tsx` | 6 tests for ModeToggle |
| `src/components/ui/dropdown-menu.tsx` | shadcn/ui DropdownMenu primitive |
| `src/components/app-shell/app-shell.tsx` | Updated — ModeToggle in SidebarFooter |
| `src/pages/*.tsx` | 7 enriched placeholder pages |
| `src/pages/__tests__/pages.test.tsx` | 28 tests for page content |
| `src/components/status-bar/status-bar.tsx` | Updated — transition-colors polish |

## Patterns Established

1. **ModeToggle pattern:** Call `useTheme().setTheme()` from DropdownMenuItem onClick; ThemeProvider handles persistence and DOM class application. No direct localStorage or classList manipulation needed.
2. **Page enrichment pattern:** Each page has a lucide icon with `data-testid="page-icon"`, 2+ mock sections with `data-testid="mock-section"`, using semantic Tailwind colors (`bg-card`, `text-card-foreground`, `text-muted-foreground`).
3. **Heading query convention (K012):** Always use `{ level: 1 }` when querying page main headings in tests to avoid ambiguity when sub-headings exist.

## Observability Surfaces

- **Theme state:** `localStorage.getItem('gsd-ui-theme')` → `"dark"`, `"light"`, or `"system"`
- **Resolved theme:** `document.documentElement.classList` contains `"dark"` or `"light"`
- **ModeToggle accessibility:** Button with `aria-label="Toggle theme"`, `aria-expanded` on dropdown trigger
- **Page identification:** `data-testid="page-icon"` and `data-testid="mock-section"` on each page

## Requirements Validated

- **R007** (theme toggle) → validated: ModeToggle with 3 modes, localStorage persistence, 6 tests
- **R008** (TDD constraint) → validated across all M001 slices: tests always written before implementation

## What the Next Slice Should Know

S04 completes M001. The app shell is fully functional:
- **97 tests pass** across 11 test files — this is the test count baseline for M002
- **ModeToggle** lives in SidebarFooter — any new sidebar footer controls should coordinate with this layout
- **ThemeProvider** is the single source of truth for theme state — components use `useTheme()`, never direct localStorage
- **Page components** are ready to be replaced with real content in M003/M004 — each has a consistent structure (icon header + card sections) that real implementations can follow or replace entirely
- **IPC abstraction** (`src/services/gsd-client.ts`) exists with no-op implementation — M002 will provide the real Tauri bridge
- **All shadcn/ui primitives needed for the shell** are installed: Button, Tooltip, Badge, Sidebar, DropdownMenu

## Deviations

None. Both tasks executed as planned with no blockers.

## M001 Milestone Status

All 4 slices complete (S01 ✅, S02 ✅, S03 ✅, S04 ✅). M001 is ready for milestone-level verification against its definition of done.
