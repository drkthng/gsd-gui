# S01: Pro Tools layout + Orchestration panels

**Goal:** Help page replaced with Pro Tools grid; ProToolPanel wrapper established; Parallel, Headless Launcher, and Worktree panels render with mock data and loading/error states
**Demo:** Help page replaced with Pro Tools grid; Parallel, Headless Launcher, Worktree panels render with mock data

## Must-Haves

- ProToolsPage renders a categorized grid of 19 panel cards organized into 5 categories
- Clicking a panel card navigates to its detail view
- ProToolPanel wrapper shows loading, error/retry, and content states
- ParallelPanel, HeadlessLauncherPanel, WorktreePanel render with mock data
- Route changed from /help to /pro-tools, sidebar updated, View type extended
- All existing 208 tests still pass, new tests cover Pro Tools components

## Proof Level

- This slice proves: Contract — unit tests verify component rendering, routing, and state transitions

## Integration Closure

- Upstream consumed: EmptyState, LoadingState from src/components/shared; Card, Badge from shadcn/ui
- New wiring: /pro-tools route replaces /help in router.tsx, sidebar-nav.tsx, ui-store.ts View type
- Remaining: S02 and S03 add remaining panels using ProToolPanel wrapper pattern

## Verification

- None — purely UI components with mock data

## Tasks

- [x] **T01: Replace Help route with Pro Tools layout and create ProToolPanel wrapper** `est:1h`
  Replace the /help route with /pro-tools. Create the ProToolsPage with a categorized grid showing 19 panel cards in 5 categories (Orchestration, Diagnostics, Data & Config, Tuning, Visualization). Create the ProToolPanel wrapper component with loading/error/retry states. Update the View type union in ui-store.ts, sidebar-nav.tsx icon/label, and router.tsx route. Update existing tests (pages.test.tsx, router.test.tsx, etc.) to reference pro-tools instead of help. Write tests for ProToolsPage and ProToolPanel.
  - Files: `src/pages/pro-tools-page.tsx`, `src/pages/pro-tools-page.test.tsx`, `src/components/pro-tools/pro-tool-panel.tsx`, `src/components/pro-tools/pro-tool-panel.test.tsx`, `src/components/pro-tools/index.ts`, `src/stores/ui-store.ts`, `src/router.tsx`, `src/components/app-shell/sidebar-nav.tsx`, `src/pages/__tests__/pages.test.tsx`, `src/router.test.tsx`
  - Verify: npx vitest --run -- pro-tools-page pro-tool-panel router pages ui-store app-shell

- [x] **T02: Build Parallel, Headless Launcher, and Worktree orchestration panels** `est:45m`
  Create three orchestration panel components that render inside ProToolPanel wrapper with mock data. ParallelPanel shows mock parallel session status (running agents, queue). HeadlessLauncherPanel shows mock headless session launcher UI. WorktreePanel shows mock git worktree list. Each uses ProToolPanel for loading/error states and displays realistic mock data. Write tests for each panel.
  - Files: `src/components/pro-tools/panels/parallel-panel.tsx`, `src/components/pro-tools/panels/parallel-panel.test.tsx`, `src/components/pro-tools/panels/headless-launcher-panel.tsx`, `src/components/pro-tools/panels/headless-launcher-panel.test.tsx`, `src/components/pro-tools/panels/worktree-panel.tsx`, `src/components/pro-tools/panels/worktree-panel.test.tsx`, `src/components/pro-tools/panels/index.ts`
  - Verify: npx vitest --run -- parallel-panel headless-launcher-panel worktree-panel

## Files Likely Touched

- src/pages/pro-tools-page.tsx
- src/pages/pro-tools-page.test.tsx
- src/components/pro-tools/pro-tool-panel.tsx
- src/components/pro-tools/pro-tool-panel.test.tsx
- src/components/pro-tools/index.ts
- src/stores/ui-store.ts
- src/router.tsx
- src/components/app-shell/sidebar-nav.tsx
- src/pages/__tests__/pages.test.tsx
- src/router.test.tsx
- src/components/pro-tools/panels/parallel-panel.tsx
- src/components/pro-tools/panels/parallel-panel.test.tsx
- src/components/pro-tools/panels/headless-launcher-panel.tsx
- src/components/pro-tools/panels/headless-launcher-panel.test.tsx
- src/components/pro-tools/panels/worktree-panel.tsx
- src/components/pro-tools/panels/worktree-panel.test.tsx
- src/components/pro-tools/panels/index.ts
