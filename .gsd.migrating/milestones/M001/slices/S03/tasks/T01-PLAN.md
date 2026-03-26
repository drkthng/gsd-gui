---
estimated_steps: 7
estimated_files: 18
skills_used:
  - test
---

# T01: Install routing and sidebar dependencies, create shared test utility, routing config, and 7 placeholder pages

**Slice:** S03 — App shell — sidebar, routing, main content area, status bar
**Milestone:** M001

## Description

This task establishes the routing backbone and page primitives for the app shell. It installs react-router-dom for client-side routing, adds the shadcn/ui Sidebar component (with its dependencies), creates a shared test utility to avoid duplicating ThemeProvider + matchMedia mocks, and builds the 7 placeholder page components with a router configuration. All following TDD discipline.

The existing `View` type in `src/stores/ui-store.ts` defines 7 views: `chat`, `projects`, `milestones`, `timeline`, `costs`, `settings`, `help`. Each view maps to a route path and a page component.

## Steps

1. **Install react-router-dom**: Run `npm install react-router-dom`. This adds client-side routing capability.

2. **Add shadcn/ui Sidebar component**: Run `npx shadcn@latest add sidebar -y`. This creates sidebar.tsx, separator.tsx, sheet.tsx, input.tsx, skeleton.tsx, and use-mobile.ts. **CRITICAL (K006):** On Windows, the shadcn CLI creates files in a literal `./@/` directory instead of `src/`. After running the command, check if `./@/` exists. If so, move files: copy everything from `./@/components/ui/` to `src/components/ui/` and `./@/hooks/` to `src/hooks/`, then delete the `./@/` directory. If files were placed correctly in `src/`, skip this step. Verify the new files exist in `src/components/ui/sidebar.tsx`, etc.

3. **Create shared test utility** (`src/test/test-utils.tsx`): This utility wraps components in ThemeProvider + MemoryRouter and includes the matchMedia mock (K009). Export a `renderWithProviders` function that accepts `initialRoute` and optional `routes` props. Re-export everything from `@testing-library/react` for convenience. This avoids every test file from S03 onward needing to duplicate the matchMedia mock and provider wrapping.

4. **Write page component tests** (`src/pages/__tests__/pages.test.tsx`): Write tests FIRST (TDD). For each of the 7 views, test that the page component renders a heading with its view name. Use the shared test utility's `renderWithProviders`.

5. **Create 7 placeholder page components**: Create `src/pages/chat-page.tsx`, `src/pages/projects-page.tsx`, `src/pages/milestones-page.tsx`, `src/pages/timeline-page.tsx`, `src/pages/costs-page.tsx`, `src/pages/settings-page.tsx`, `src/pages/help-page.tsx`. Each is a simple component that renders a heading with the page title and a brief description paragraph. Keep them minimal — S04 will add real content.

6. **Write router tests** (`src/router.test.tsx`): Write tests FIRST (TDD). Test that navigating to each of the 7 route paths renders the correct page component. Use MemoryRouter with `initialEntries` to test each route. Also test that the default/root route redirects to `/chat`.

7. **Create router config** (`src/router.tsx`): Define route configuration mapping paths to page components. Routes: `/chat`, `/projects`, `/milestones`, `/timeline`, `/costs`, `/settings`, `/help`. The root path `/` should redirect to `/chat`. Export the routes in a form consumable by react-router-dom (either as a `<Routes>` component or route objects for `createBrowserRouter` — prefer route objects for type safety). The route paths must match the `View` type values from `src/stores/ui-store.ts`.

## Must-Haves

- [ ] react-router-dom is installed in package.json dependencies
- [ ] shadcn/ui Sidebar component and its dependencies are in `src/components/ui/` (not in a literal `./@/` directory)
- [ ] `src/hooks/use-mobile.ts` exists (shadcn/ui Sidebar dependency)
- [ ] `src/test/test-utils.tsx` exports `renderWithProviders` with ThemeProvider + MemoryRouter + matchMedia mock
- [ ] 7 page components exist in `src/pages/` with correct file names
- [ ] Router config in `src/router.tsx` defines 7 routes + root redirect
- [ ] Tests for pages and router pass: `npm run test`
- [ ] All 41 existing tests still pass (no regressions)

## Verification

- `npm run test` exits 0 with all tests passing (existing 41 + new page tests + router tests)
- `test -f src/components/ui/sidebar.tsx` — sidebar component exists
- `test -f src/hooks/use-mobile.ts` — mobile hook exists
- `test -f src/test/test-utils.tsx` — shared test utility exists
- `test -f src/router.tsx` — router config exists
- `ls src/pages/*.tsx | wc -l` returns 7

## Inputs

- `package.json` — existing dependencies to add react-router-dom to
- `src/stores/ui-store.ts` — View type defining the 7 view names: `chat`, `projects`, `milestones`, `timeline`, `costs`, `settings`, `help`
- `src/components/theme-provider.tsx` — ThemeProvider to wrap in test utility
- `src/test/setup.ts` — existing test setup importing jest-dom matchers
- `components.json` — shadcn/ui config for the CLI to read when adding sidebar
- `src/styles/globals.css` — sidebar CSS variables already present (from S02)
- `src/components/ui/button.tsx` — existing component that sidebar may re-export or depend on
- `src/components/ui/tooltip.tsx` — existing component used by sidebar
- `src/lib/utils.ts` — cn() utility used by all shadcn/ui components

## Expected Output

- `package.json` — updated with react-router-dom dependency
- `src/test/test-utils.tsx` — shared test utility with renderWithProviders
- `src/router.tsx` — route configuration for 7 views
- `src/router.test.tsx` — router tests
- `src/pages/chat-page.tsx` — Chat placeholder page
- `src/pages/projects-page.tsx` — Projects placeholder page
- `src/pages/milestones-page.tsx` — Milestones placeholder page
- `src/pages/timeline-page.tsx` — Timeline placeholder page
- `src/pages/costs-page.tsx` — Costs placeholder page
- `src/pages/settings-page.tsx` — Settings placeholder page
- `src/pages/help-page.tsx` — Help placeholder page
- `src/pages/__tests__/pages.test.tsx` — page component tests
- `src/components/ui/sidebar.tsx` — shadcn/ui Sidebar primitives
- `src/components/ui/separator.tsx` — shadcn/ui Separator
- `src/components/ui/sheet.tsx` — shadcn/ui Sheet
- `src/components/ui/input.tsx` — shadcn/ui Input
- `src/components/ui/skeleton.tsx` — shadcn/ui Skeleton
- `src/hooks/use-mobile.ts` — shadcn/ui mobile detection hook

## Observability Impact

- **Signals added:** `appRoutes` and `pageRoutes` are exported from `src/router.tsx` — future agents can programmatically enumerate all routes and their associated `View` identifiers without parsing JSX.
- **Inspection:** Each page component renders a heading with its view name, making visual confirmation and test assertions straightforward. The shared test utility (`renderWithProviders`) provides a standard way to mount components with routing + theme context in tests.
- **Failure visibility:** Missing or misconfigured routes surface as blank content areas. Import errors in page components surface as test failures in `pages.test.tsx` and `router.test.tsx`.

