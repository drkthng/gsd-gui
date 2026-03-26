---
id: T01
parent: S01
milestone: M005
key_files:
  - src/pages/pro-tools-page.tsx
  - src/components/pro-tools/pro-tool-panel.tsx
  - src/components/pro-tools/index.ts
  - src/pages/pro-tools-page.test.tsx
  - src/components/pro-tools/pro-tool-panel.test.tsx
  - src/stores/ui-store.ts
  - src/router.tsx
  - src/components/app-shell/sidebar-nav.tsx
  - src/pages/__tests__/pages.test.tsx
  - src/router.test.tsx
  - src/components/app-shell/app-shell.test.tsx
key_decisions:
  - Used Wrench icon from lucide-react for Pro Tools nav item
  - Defined 19 panels across 5 categories as exported constants for reuse by downstream tasks
  - ProToolPanel supports 4 states: loading, error (with retry), empty, ready
duration: ""
verification_result: passed
completed_at: 2026-03-25T12:13:21.152Z
blocker_discovered: false
---

# T01: Replace Help route with Pro Tools layout, create ProToolPanel wrapper with loading/error/empty/ready states

**Replace Help route with Pro Tools layout, create ProToolPanel wrapper with loading/error/empty/ready states**

## What Happened

Replaced the /help route with /pro-tools throughout the app. Created ProToolsPage with a categorized grid of 19 panel cards across 5 categories (Orchestration, Diagnostics, Data & Config, Tuning, Visualization). Created ProToolPanel wrapper component with loading/error/retry/empty/ready states. Updated ui-store View type union, sidebar-nav icon/label, and router imports/routes. Updated existing tests in pages.test.tsx, router.test.tsx, and app-shell.test.tsx to reference pro-tools instead of help. Created new test files for ProToolsPage (6 tests) and ProToolPanel (6 tests).

## Verification

Ran `npx vitest --run -- pro-tools-page pro-tool-panel router pages ui-store app-shell` — all 30 test files pass with 220 tests.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest --run -- pro-tools-page pro-tool-panel router pages ui-store app-shell` | 0 | ✅ pass | 49690ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/pages/pro-tools-page.tsx`
- `src/components/pro-tools/pro-tool-panel.tsx`
- `src/components/pro-tools/index.ts`
- `src/pages/pro-tools-page.test.tsx`
- `src/components/pro-tools/pro-tool-panel.test.tsx`
- `src/stores/ui-store.ts`
- `src/router.tsx`
- `src/components/app-shell/sidebar-nav.tsx`
- `src/pages/__tests__/pages.test.tsx`
- `src/router.test.tsx`
- `src/components/app-shell/app-shell.test.tsx`
