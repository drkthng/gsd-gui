---
estimated_steps: 1
estimated_files: 10
skills_used: []
---

# T01: Replace Help route with Pro Tools layout and create ProToolPanel wrapper

Replace the /help route with /pro-tools. Create the ProToolsPage with a categorized grid showing 19 panel cards in 5 categories (Orchestration, Diagnostics, Data & Config, Tuning, Visualization). Create the ProToolPanel wrapper component with loading/error/retry states. Update the View type union in ui-store.ts, sidebar-nav.tsx icon/label, and router.tsx route. Update existing tests (pages.test.tsx, router.test.tsx, etc.) to reference pro-tools instead of help. Write tests for ProToolsPage and ProToolPanel.

## Inputs

- ``src/pages/help-page.tsx` — existing page to be replaced`
- ``src/stores/ui-store.ts` — View type union needs 'pro-tools' added, 'help' removed`
- ``src/router.tsx` — route entry to change from /help to /pro-tools`
- ``src/components/app-shell/sidebar-nav.tsx` — nav item label/icon/path to update`
- ``src/components/shared/loading-state.tsx` — consumed by ProToolPanel`
- ``src/components/shared/empty-state.tsx` — consumed by ProToolPanel`
- ``src/pages/__tests__/pages.test.tsx` — existing tests to update`
- ``src/router.test.tsx` — existing tests to update`

## Expected Output

- ``src/pages/pro-tools-page.tsx` — grid layout with 19 panel cards in 5 categories`
- ``src/pages/pro-tools-page.test.tsx` — tests for grid rendering, category grouping, panel card links`
- ``src/components/pro-tools/pro-tool-panel.tsx` — wrapper with loading/error/retry/content states`
- ``src/components/pro-tools/pro-tool-panel.test.tsx` — tests for all 4 states`
- ``src/components/pro-tools/index.ts` — barrel export`
- ``src/stores/ui-store.ts` — View type with 'pro-tools' replacing 'help'`
- ``src/router.tsx` — /pro-tools route replacing /help`
- ``src/components/app-shell/sidebar-nav.tsx` — Pro Tools nav item`

## Verification

npx vitest --run -- pro-tools-page pro-tool-panel router pages ui-store app-shell
