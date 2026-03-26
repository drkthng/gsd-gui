---
id: T01
parent: S03
milestone: M001
provides:
  - react-router-dom dependency
  - shadcn/ui Sidebar component and dependencies (separator, sheet, input, skeleton, use-mobile)
  - shared test utility with renderWithProviders (ThemeProvider + MemoryRouter + matchMedia mock)
  - 7 placeholder page components
  - router config with 7 routes + root redirect
  - page tests and router tests
key_files:
  - src/router.tsx
  - src/test/test-utils.tsx
  - src/pages/chat-page.tsx
  - src/pages/projects-page.tsx
  - src/pages/milestones-page.tsx
  - src/pages/timeline-page.tsx
  - src/pages/costs-page.tsx
  - src/pages/settings-page.tsx
  - src/pages/help-page.tsx
  - src/components/ui/sidebar.tsx
  - src/hooks/use-mobile.ts
key_decisions:
  - "Route config exports typed appRoutes array (RouteEntry[]) with index redirect and AppRoute entries containing View identifiers, enabling programmatic route enumeration"
  - "Shared test utility auto-applies matchMedia mock via module-level beforeEach, eliminating per-file boilerplate"
patterns_established:
  - "renderWithProviders wraps ThemeProvider + MemoryRouter — use this instead of bare render() for all components that depend on routing or theming context"
  - "Page components are named exports (not default) matching the pattern {View}Page"
observability_surfaces:
  - "appRoutes and pageRoutes exported from src/router.tsx for programmatic inspection"
  - "Each page heading matches its View name — testable with getByRole('heading')"
duration: 15m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Install routing and sidebar dependencies, create shared test utility, routing config, and 7 placeholder pages

**Installed react-router-dom and shadcn/ui Sidebar, created shared test utility with renderWithProviders, 7 placeholder page components, and router config with 7 routes + root redirect — all 57 tests pass.**

## What Happened

1. Installed `react-router-dom` via npm — adds client-side routing capability.
2. Ran `npx shadcn@latest add sidebar -y` which generated sidebar, separator, sheet, input, skeleton, and use-mobile files. As expected per K006, files were placed in a literal `./@/` directory on Windows. Moved them to `src/components/ui/` and `src/hooks/`, then deleted the `./@/` directory. Skipped copying button.tsx and tooltip.tsx since those already existed.
3. Created `src/test/test-utils.tsx` with `renderWithProviders` that wraps components in ThemeProvider + MemoryRouter and includes the matchMedia mock (K009) applied automatically via module-level `beforeEach`. Re-exports everything from `@testing-library/react` and `@testing-library/user-event`.
4. Wrote page tests first (TDD) — 7 tests verifying each page renders a heading with its view name.
5. Created 7 placeholder page components in `src/pages/`, each rendering a heading and brief description.
6. Wrote router tests first (TDD) — 9 tests verifying each route renders the correct page, the root redirects to `/chat`, and the route count is correct.
7. Created `src/router.tsx` with typed `appRoutes` array containing 8 entries (7 page routes + 1 index redirect). Each page route carries a `view` property matching the `View` type from `ui-store.ts`.
8. Added Observability sections to S03-PLAN.md and T01-PLAN.md per pre-flight requirements.

## Verification

- `npm run test` — 57 tests pass (41 existing + 7 page tests + 9 router tests), exit code 0
- `test -f src/components/ui/sidebar.tsx` — sidebar component exists ✓
- `test -f src/hooks/use-mobile.ts` — mobile hook exists ✓
- `test -f src/test/test-utils.tsx` — shared test utility exists ✓
- `test -f src/router.tsx` — router config exists ✓
- `ls src/pages/*.tsx | wc -l` — returns 7 ✓
- `grep react-router-dom package.json` — dependency present ✓

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test` | 0 | ✅ pass | 11s |
| 2 | `test -f src/components/ui/sidebar.tsx` | 0 | ✅ pass | <1s |
| 3 | `test -f src/hooks/use-mobile.ts` | 0 | ✅ pass | <1s |
| 4 | `test -f src/test/test-utils.tsx` | 0 | ✅ pass | <1s |
| 5 | `test -f src/router.tsx` | 0 | ✅ pass | <1s |
| 6 | `ls src/pages/*.tsx \| wc -l` (expect 7) | 0 | ✅ pass | <1s |

## Diagnostics

- **Route enumeration:** Import `appRoutes` or `pageRoutes` from `src/router.tsx` to list all routes and their View associations.
- **Page rendering:** Each page renders a heading element with the view name — use `screen.getByRole("heading", { name: /viewName/i })` in tests.
- **Test utility:** Import `renderWithProviders` from `@/test/test-utils` for any component that needs routing or theming context.

## Deviations

- The pre-flight flagged the 18-file count as potentially needing a split. Since the task executes cleanly within a single focused session and the files are small/formulaic (7 page components are each <10 lines), no split was needed.

## Known Issues

None.

## Files Created/Modified

- `package.json` — added react-router-dom dependency
- `src/test/test-utils.tsx` — shared test utility with renderWithProviders, matchMedia mock, re-exports
- `src/router.tsx` — route config with 7 routes + root redirect, typed exports
- `src/router.test.tsx` — 9 router tests
- `src/pages/__tests__/pages.test.tsx` — 7 page component tests
- `src/pages/chat-page.tsx` — Chat placeholder page
- `src/pages/projects-page.tsx` — Projects placeholder page
- `src/pages/milestones-page.tsx` — Milestones placeholder page
- `src/pages/timeline-page.tsx` — Timeline placeholder page
- `src/pages/costs-page.tsx` — Costs placeholder page
- `src/pages/settings-page.tsx` — Settings placeholder page
- `src/pages/help-page.tsx` — Help placeholder page
- `src/components/ui/sidebar.tsx` — shadcn/ui Sidebar primitives
- `src/components/ui/separator.tsx` — shadcn/ui Separator
- `src/components/ui/sheet.tsx` — shadcn/ui Sheet
- `src/components/ui/input.tsx` — shadcn/ui Input
- `src/components/ui/skeleton.tsx` — shadcn/ui Skeleton
- `src/hooks/use-mobile.ts` — shadcn/ui mobile detection hook
- `.gsd/milestones/M001/slices/S03/S03-PLAN.md` — added Observability section, marked T01 done
- `.gsd/milestones/M001/slices/S03/tasks/T01-PLAN.md` — added Observability Impact section
