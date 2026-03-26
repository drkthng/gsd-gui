---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T02: Build Parallel, Headless Launcher, and Worktree orchestration panels

Create three orchestration panel components that render inside ProToolPanel wrapper with mock data. ParallelPanel shows mock parallel session status (running agents, queue). HeadlessLauncherPanel shows mock headless session launcher UI. WorktreePanel shows mock git worktree list. Each uses ProToolPanel for loading/error states and displays realistic mock data. Write tests for each panel.

## Inputs

- ``src/components/pro-tools/pro-tool-panel.tsx` — wrapper component from T01`
- ``src/components/pro-tools/index.ts` — barrel exports from T01`
- ``src/components/ui/card.tsx` — shadcn Card for layout`
- ``src/components/ui/badge.tsx` — shadcn Badge for status indicators`

## Expected Output

- ``src/components/pro-tools/panels/parallel-panel.tsx` — parallel orchestration panel with mock data`
- ``src/components/pro-tools/panels/parallel-panel.test.tsx` — tests for rendering, mock data display`
- ``src/components/pro-tools/panels/headless-launcher-panel.tsx` — headless launcher panel with mock data`
- ``src/components/pro-tools/panels/headless-launcher-panel.test.tsx` — tests for rendering`
- ``src/components/pro-tools/panels/worktree-panel.tsx` — worktree panel with mock data`
- ``src/components/pro-tools/panels/worktree-panel.test.tsx` — tests for rendering`
- ``src/components/pro-tools/panels/index.ts` — barrel exports for all 3 panels`

## Verification

npx vitest --run -- parallel-panel headless-launcher-panel worktree-panel
