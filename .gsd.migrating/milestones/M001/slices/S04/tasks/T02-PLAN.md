---
estimated_steps: 4
estimated_files: 9
skills_used: []
---

# T02: Enrich 7 placeholder pages with distinct content and apply shell polish

**Slice:** S04 — Theme toggle, placeholder pages, shell polish
**Milestone:** M001

## Description

The 7 placeholder pages currently show identical structure: an `<h1>` heading and a `<p>` description. This task gives each page visually distinct content — a page-specific lucide icon, descriptive sections, and mock data cards hinting at future functionality. It also applies visual polish across the shell (transitions, hover states, consistent dark mode styling) to make the app feel like a real desktop tool.

The pages use these lucide icons (already imported in sidebar-nav.tsx):
- Chat: `MessageSquare`
- Projects: `FolderKanban`
- Milestones: `Flag`
- Timeline: `Clock`
- Costs: `DollarSign`
- Settings: `Settings`
- Help: `HelpCircle`

Each page should use the shadcn/ui `Card` component (or simple Tailwind `rounded-lg border` divs if Card isn't installed) for mock data sections. Keep content static — no interactivity or state beyond what's already wired.

## Steps

1. **Update page tests first (TDD).** Edit `src/pages/__tests__/pages.test.tsx`:
   - Keep the existing heading assertion for each page
   - Add assertion that each page renders its corresponding view-specific descriptive text (e.g., a `data-testid="page-icon"` element or checking for page-specific unique text content)
   - Add assertion that each page has at least one mock data section (e.g., an element with role `region` or a specific test id like `data-testid="mock-section"`)
   - Use the existing `renderWithProviders` from test-utils

2. **Enrich each of the 7 page components.** For each page in `src/pages/`:
   - Add the page's lucide icon next to the heading (e.g., `<MessageSquare className="h-6 w-6" />`)
   - Add 2-3 mock data sections/cards showing what the page will eventually contain. Use Tailwind utility classes for card-like appearance (`rounded-lg border bg-card p-4`). Examples:
     - **ChatPage**: "Recent Conversations" list with 2-3 placeholder items, "Quick Actions" card
     - **ProjectsPage**: "Active Projects" grid with 2-3 placeholder project cards showing name/status
     - **MilestonesPage**: "Current Milestone" progress card, "Upcoming" list
     - **TimelinePage**: "Sprint Timeline" placeholder with date range, activity feed hint
     - **CostsPage**: "Total Spend" summary card, "Cost Breakdown" table placeholder
     - **SettingsPage**: "Appearance" section (mention theme is configurable), "API Keys" section, "Integrations" section
     - **HelpPage**: "Getting Started" card, "Keyboard Shortcuts" card, "Documentation" link card
   - All content is static mock data — just strings and layout, no state or interactivity

3. **Apply visual polish to the shell.** Minor refinements:
   - In `src/components/status-bar/status-bar.tsx`: add `transition-colors` class for smooth theme transitions on the footer
   - In page components: ensure cards use `bg-card text-card-foreground` for proper dark mode
   - Verify all text uses semantic Tailwind color classes (`text-foreground`, `text-muted-foreground`, etc.) not hardcoded colors
   - Add `transition-colors duration-200` on the main content area or body-level for smooth theme switching

4. **Run full test suite.** Execute `npx vitest run` and confirm all tests pass (existing + new assertions).

## Must-Haves

- [ ] Each of the 7 pages has a lucide icon in its header section
- [ ] Each page has at least 2 mock data sections/cards with distinct placeholder content
- [ ] All pages use semantic Tailwind color classes (bg-card, text-foreground, etc.) for dark mode compatibility
- [ ] Updated page tests assert on page-specific content (icon or unique text) and mock section presence
- [ ] All tests pass (existing + new)
- [ ] Tests updated before page implementation changes (R008 TDD)

## Verification

- `npx vitest run` — all tests pass
- `npx vitest run src/pages/__tests__/pages.test.tsx` — page-specific tests pass
- Each page file has more than 15 lines (distinct content): `wc -l src/pages/*-page.tsx`

## Observability Impact

- **Page-specific icons:** Each page renders a `data-testid="page-icon"` element on its lucide icon — agents and tests can verify which page is rendered without parsing text.
- **Mock data sections:** Each page renders 2+ elements with `data-testid="mock-section"` — agents can count sections and verify page richness.
- **Semantic color classes:** All cards use `bg-card text-card-foreground` and text uses `text-foreground`/`text-muted-foreground` — theme switching applies uniformly without custom logic.
- **Transition smoothness:** StatusBar and main content area have `transition-colors duration-200` — theme changes animate smoothly rather than snapping.
- **Failure visibility:** If a lucide icon import fails, the page still renders but the icon slot is empty (no crash). If `data-testid` is missing, tests catch it. Missing semantic color classes cause visual regression in dark mode (no runtime error).


- `src/pages/chat-page.tsx` — existing minimal page to enrich
- `src/pages/projects-page.tsx` — existing minimal page to enrich
- `src/pages/milestones-page.tsx` — existing minimal page to enrich
- `src/pages/timeline-page.tsx` — existing minimal page to enrich
- `src/pages/costs-page.tsx` — existing minimal page to enrich
- `src/pages/settings-page.tsx` — existing minimal page to enrich
- `src/pages/help-page.tsx` — existing minimal page to enrich
- `src/pages/__tests__/pages.test.tsx` — existing page tests to extend
- `src/components/status-bar/status-bar.tsx` — polish target
- `src/test/test-utils.tsx` — renderWithProviders utility

## Expected Output

- `src/pages/chat-page.tsx` — enriched with icon, mock conversation list, quick actions
- `src/pages/projects-page.tsx` — enriched with icon, mock project cards
- `src/pages/milestones-page.tsx` — enriched with icon, mock milestone progress
- `src/pages/timeline-page.tsx` — enriched with icon, mock timeline placeholder
- `src/pages/costs-page.tsx` — enriched with icon, mock cost summary
- `src/pages/settings-page.tsx` — enriched with icon, settings sections
- `src/pages/help-page.tsx` — enriched with icon, help cards
- `src/pages/__tests__/pages.test.tsx` — extended with content-specific assertions
- `src/components/status-bar/status-bar.tsx` — polished with transition classes
