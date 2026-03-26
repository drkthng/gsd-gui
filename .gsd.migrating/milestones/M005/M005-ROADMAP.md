# M005: Pro Tools, Polish & Packaging

**Vision:** Deliver the Pro Tools power-user area, app-wide polish (toasts, shortcuts, skeletons), Playwright E2E tests, and cross-platform packaging — making the app shippable.

## Success Criteria

- [ ] Pro Tools grid renders 19 panels organized into 5 categories with loading/error states
- [ ] Keyboard shortcuts work: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
- [ ] Toast notifications fire for GSD events (task complete, errors, budget warnings)
- [ ] 7 Playwright E2E tests cover core app flows
- [ ] GitHub Actions CI workflow builds installers for Windows, macOS, Linux
- [ ] All unit tests pass, build succeeds, no regressions

## Key Risks / Unknowns

- Playwright + Tauri E2E infrastructure is new — may need workarounds for platform quirks
- Cross-platform CI needs runners for all 3 OSes — macOS code signing deferred

## Proof Strategy

- Playwright + Tauri risk → retire in S05 by proving 7 E2E tests pass
- CI build risk → retire in S06 by proving GitHub Actions builds green

## Verification Classes

- Contract verification: unit tests (vitest), E2E tests (playwright)
- Integration verification: pro tool panels invoke gsd-client, shortcuts trigger actions
- Operational verification: `cargo tauri build` produces installers
- UAT: manual walkthrough of Pro Tools panels and keyboard shortcuts

## Milestone Definition of Done

- All 19 pro tool panels render with mock data and loading/error states
- Toast system functional
- Keyboard shortcuts wired
- E2E test suite passes
- CI workflow committed and builds produce artifacts
- All unit tests pass (208+ baseline)

## Requirement Coverage

- Covers: R027, R028, R029, R030, R031
- Leaves for later: R033 (code signing), R034 (auto-updater), R035 (embedded terminal)

## Slices

- [x] **S01: Pro Tools layout + Orchestration panels** `risk:medium` `depends:[]`
  > After this: Help page replaced with Pro Tools grid; Parallel, Headless Launcher, Worktree panels render with mock data
- [x] **S02: Diagnostics panels** `risk:low` `depends:[S01]`
  > After this: Forensics, Doctor, Activity Logs, Routing History panels render with loading/error states
- [x] **S03: Data & Tuning panels** `risk:low` `depends:[S01]`
  > After this: Knowledge, Decisions, Requirements, Skills, Budget Pressure, Hooks, MCP, Custom Models, Remote Questions, Runtime, Agents, Visualizer panels all render
- [x] **S04: Polish — toasts, keyboard shortcuts, skeletons** `risk:medium` `depends:[]`
  > After this: Keyboard shortcuts functional, toast notifications wired, loading skeletons on async content
- [x] **S05: E2E test infrastructure** `risk:high` `depends:[S04]`
  > After this: Playwright runs 7 core flow tests against the dev build
- [x] **S06: Packaging & CI** `risk:medium` `depends:[]`
  > After this: GitHub Actions workflow builds Windows/macOS/Linux installers

## Boundary Map

### S01 → S02, S03

Produces:
- ProToolsLayout component with category grid and panel routing
- ProToolPanel wrapper (shared loading/error/retry pattern)
- Help route replaced with Pro Tools route

Consumes:
- EmptyState, LoadingState from src/components/shared
- Card, Badge from shadcn/ui

### S02 → nothing downstream

Produces:
- ForensicsPanel, DoctorPanel, ActivityLogViewer, RoutingHistoryPanel

Consumes from S01:
- ProToolPanel wrapper pattern

### S03 → nothing downstream

Produces:
- 12 remaining panels (Knowledge, Decisions, Requirements, etc.)

Consumes from S01:
- ProToolPanel wrapper pattern

### S04 → S05

Produces:
- useKeyboardShortcuts hook
- Toast notification component + useToast hook
- Skeleton loading components

Consumes:
- App shell, stores, gsd-client

### S05 → nothing downstream

Produces:
- Playwright test config
- 7 E2E test files
- Test helpers/fixtures

Consumes from S04:
- Working keyboard shortcuts and toast system (for test assertions)

### S06 → nothing downstream

Produces:
- .github/workflows/build.yml
- Updated tauri.conf.json bundle config
- Build scripts

Consumes:
- Existing Tauri config and project structure
