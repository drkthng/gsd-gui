---
id: T02
parent: S04
milestone: M001
provides:
  - 7 enriched placeholder pages with distinct icons, mock data cards, and page-specific content
  - Shell visual polish with transition-colors for smooth theme switching
key_files:
  - src/pages/chat-page.tsx
  - src/pages/projects-page.tsx
  - src/pages/milestones-page.tsx
  - src/pages/timeline-page.tsx
  - src/pages/costs-page.tsx
  - src/pages/settings-page.tsx
  - src/pages/help-page.tsx
  - src/pages/__tests__/pages.test.tsx
  - src/components/status-bar/status-bar.tsx
  - src/components/app-shell/app-shell.tsx
key_decisions:
  - Used data-testid="page-icon" and data-testid="mock-section" for stable test selectors rather than fragile text queries, making tests resilient to copy changes
patterns_established:
  - Page enrichment pattern: lucide icon with data-testid="page-icon" in header, 2+ mock-section cards with data-testid="mock-section", all using semantic Tailwind colors (bg-card, text-card-foreground, text-foreground, text-muted-foreground)
  - Heading queries across the codebase now use { level: 1 } to avoid ambiguity from sub-headings in enriched page content
observability_surfaces:
  - data-testid="page-icon" on each page's lucide icon for page identification
  - data-testid="mock-section" on each card/section (2+ per page) for content richness verification
  - transition-colors duration-200 on StatusBar footer and main content area for smooth theme switching
duration: 15m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Enrich 7 placeholder pages with distinct content and apply shell polish

**feat: enrich all 7 placeholder pages with distinct icons, mock data cards, and apply transition-colors shell polish**

## What Happened

Following TDD, wrote 21 new page tests first (7 icon assertions, 7 unique text assertions, 7 mock-section count assertions) — all failed in red phase against the minimal pages. Then enriched each page component with:

- **ChatPage**: MessageSquare icon, "Recent Conversations" list (3 placeholder conversations with time + preview), "Quick Actions" card with disabled buttons
- **ProjectsPage**: FolderKanban icon, "Active Projects" grid (3 project cards with progress bars), "Project Statistics" summary with counts
- **MilestonesPage**: Flag icon, "Current Milestone" progress card (M001 at 75%), "Upcoming Milestones" list with status icons
- **TimelinePage**: Clock icon, "Sprint Timeline" bar chart with 5-day workload, "Recent Activity" feed with 4 events
- **CostsPage**: DollarSign icon, "Total Spend" 3-card summary (month/day/average with trend arrows), "Cost Breakdown" model-by-model bar chart
- **SettingsPage**: Settings icon, "Appearance" section (references sidebar theme toggle), "API Keys" with masked keys, "Integrations" with connection status
- **HelpPage**: HelpCircle icon, "Getting Started" numbered steps, "Keyboard Shortcuts" with kbd elements, "Documentation" link card

Applied shell polish: added `transition-colors duration-200` to the StatusBar footer and main content area in AppShell for smooth theme switching.

Fixed heading query ambiguity across 3 test files (pages.test.tsx, router.test.tsx, app-shell.test.tsx) by adding `level: 1` to heading role queries — the enriched pages' `<h2>` sub-headings (e.g., "Active Projects") were matching the same regex as the `<h1>` page title (e.g., "Projects").

## Verification

- `npx vitest run` — 97/97 tests pass (76 existing + 21 new page tests)
- `npx vitest run src/pages/__tests__/pages.test.tsx` — 28/28 tests pass
- `wc -l src/pages/*-page.tsx` — all pages 72–107 lines (well above 15-line threshold)
- `npx vitest run --reporter=verbose 2>&1 | grep -E "(FAIL|Error|useTheme)"` — no failures, only passing test descriptions

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run src/pages/__tests__/pages.test.tsx` | 0 | ✅ pass | 5.1s |
| 2 | `npx vitest run` | 0 | ✅ pass | 15.9s |
| 3 | `wc -l src/pages/*-page.tsx` | 0 | ✅ pass (72–107 lines each) | <1s |
| 4 | `npx vitest run --reporter=verbose 2>&1 \| grep -E "(FAIL\|Error\|useTheme)"` | 0 | ✅ pass (no failures) | 18.5s |

## Diagnostics

- **Verify page icon presence:** Query for `[data-testid="page-icon"]` in DOM to confirm the page rendered its icon
- **Verify mock sections:** Count `[data-testid="mock-section"]` elements — each page should have ≥2
- **Verify dark mode compatibility:** All cards use `bg-card text-card-foreground`, text uses `text-foreground`/`text-muted-foreground` — inspect computed styles in DevTools after theme toggle
- **Verify transition smoothness:** StatusBar `<footer>` and main content `<div>` have `transition-colors duration-200` — visible as smooth color fade when switching themes
- **Failure mode:** If a lucide icon import is missing, the icon won't render but the page still loads. Missing `data-testid` attributes cause test failures but not runtime errors.

## Deviations

- Fixed heading query ambiguity in `src/router.test.tsx` and `src/components/app-shell/app-shell.test.tsx` (not in task plan) — existing tests broke because enriched page `<h2>` sub-headings matched the same regex as the `<h1>` page heading. Added `level: 1` to all heading role queries across 3 test files.
- Used `getAllByText` instead of `getByText` in section title checks — some section titles (e.g., "API Keys") appear in both headings and body text.

## Known Issues

None.

## Files Created/Modified

- `src/pages/chat-page.tsx` — enriched with MessageSquare icon, conversations list, quick actions
- `src/pages/projects-page.tsx` — enriched with FolderKanban icon, project cards grid, statistics
- `src/pages/milestones-page.tsx` — enriched with Flag icon, current milestone progress, upcoming list
- `src/pages/timeline-page.tsx` — enriched with Clock icon, sprint timeline bars, activity feed
- `src/pages/costs-page.tsx` — enriched with DollarSign icon, spend summary cards, cost breakdown
- `src/pages/settings-page.tsx` — enriched with Settings icon, appearance/API keys/integrations sections
- `src/pages/help-page.tsx` — enriched with HelpCircle icon, getting started/shortcuts/docs cards
- `src/pages/__tests__/pages.test.tsx` — extended with 21 new tests (icon, unique text, mock sections)
- `src/components/status-bar/status-bar.tsx` — added transition-colors duration-200
- `src/components/app-shell/app-shell.tsx` — added transition-colors duration-200 on main content area
- `src/router.test.tsx` — fixed heading queries with level: 1
- `src/components/app-shell/app-shell.test.tsx` — fixed heading queries with level: 1
