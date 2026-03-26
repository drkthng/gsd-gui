# S01: Pro Tools layout + Orchestration panels — UAT

**Milestone:** M005
**Written:** 2026-03-25T12:28:48.803Z

## UAT: S01 — Pro Tools layout + Orchestration panels

### Preconditions
- App builds and runs (`npm run dev`)
- All 235 unit tests pass (`npx vitest --run`)

### Test Cases

#### TC1: Pro Tools navigation
1. Launch the app
2. Click "Pro Tools" in the sidebar
3. **Expected:** Page shows "Pro Tools" heading with a grid of 19 panel cards organized into 5 categories: Orchestration, Diagnostics, Data & Config, Tuning, Visualization

#### TC2: Panel card categories
1. On the Pro Tools page, verify category headers
2. **Expected:** Orchestration has 3 cards (Parallel Sessions, Headless Launcher, Worktrees), Diagnostics has 4, Data & Config has 5, Tuning has 4, Visualization has 3

#### TC3: ProToolPanel loading state
1. Navigate to a panel that is loading
2. **Expected:** Spinner/loading indicator displayed within the panel wrapper

#### TC4: ProToolPanel error state with retry
1. Trigger an error state in a panel
2. **Expected:** Error message displayed with a Retry button; clicking Retry invokes the retry callback

#### TC5: Parallel Panel
1. Click the Parallel Sessions card
2. **Expected:** Panel shows mock parallel sessions with running/queued/completed/failed status badges, agent names, task descriptions, and elapsed times

#### TC6: Headless Launcher Panel
1. Click the Headless Launcher card
2. **Expected:** Panel shows mock profiles with launch buttons, model info, and active/idle status badges

#### TC7: Worktree Panel
1. Click the Worktrees card
2. **Expected:** Panel shows mock git worktrees with branch names, paths, milestone labels, and active/clean/dirty status badges

#### TC8: Route update verification
1. Navigate to /help in the URL bar
2. **Expected:** Route does not exist (404 or redirect); /pro-tools is the correct route

#### TC9: No regressions
1. Run `npx vitest --run`
2. **Expected:** All 235 tests pass across 33 files
