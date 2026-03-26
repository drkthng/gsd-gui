---
depends_on: [M004]
---

# M005: Pro Tools, Polish & Packaging

**Gathered:** 2026-03-25
**Status:** Ready for planning

## Project Description

M005 is the final milestone — it delivers the Pro Tools power-user area (19 panels organized by category), app-wide polish (toast notifications, keyboard shortcuts, loading skeletons), a Playwright E2E test suite, and cross-platform packaging with GitHub Actions CI.

## Why This Milestone

M001–M004 built a functional GSD client. M005 makes it shippable: the pro tools differentiate the GUI from the terminal, polish makes it feel professional, E2E tests catch integration issues, and packaging lets users install without building from source.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open Pro Tools from the sidebar and access 19 specialized panels organized by category
- Run diagnostics (Doctor, Forensics), manage worktrees, edit hooks and MCP config through GUI panels
- View/edit Knowledge, Decisions, and Requirements through dedicated editors
- Use keyboard shortcuts: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
- See toast notifications when GSD events fire (task complete, errors, budget warnings)
- Install the app via platform-native installers (.msi, .dmg, .deb/.rpm/.AppImage)

### Entry point / environment

- Entry point: `npm run tauri dev` (development), platform installers (production)
- Environment: local dev on Windows (primary), cross-platform CI builds
- Live dependencies: `gsd` CLI binary on PATH

## Completion Class

- Contract complete: All unit tests pass, E2E tests pass, build succeeds on all platforms
- Integration complete: Pro tool panels invoke real GSD commands, shortcuts trigger correct actions
- Operational complete: Installers produce working apps, CI builds green

## Final Integrated Acceptance

- Open the app → navigate all 7 sidebar tabs using Ctrl+1-7
- Open Pro Tools → at least 5 panels render with structured data
- Send a chat message → see toast notification on response
- `cargo tauri build` produces a working installer

## Risks and Unknowns

- **Playwright + Tauri E2E** — @tauri-apps/cli test is relatively new. May have platform quirks. Risk: high. Retire in S05.
- **Cross-platform CI builds** — Need Windows, macOS, Linux runners in GitHub Actions. macOS code signing deferred (R033). Risk: medium. Retire in S06.
- **19 panels in 3 slices** — Volume is high but pattern is repeatable. Risk: low.

## Existing Codebase / Prior Art

- `src/pages/help-page.tsx` — Current Help page, will be replaced with Pro Tools
- `src/components/dashboard/` — Established pattern for data-connected components
- `src/components/shared/` — EmptyState, LoadingState primitives reused by all panels
- `src/components/controls/` — UIRequestDialog pattern (Dialog + state-driven content)
- `src-tauri/tauri.conf.json` — Bundle config already has `"targets": "all"`

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R027 — Pro tools area with 19 panels
- R028 — E2E tests covering full app flows
- R029 — Cross-platform installers
- R030 — Keyboard shortcuts
- R031 — Toast notifications for GSD events

## Scope

### In Scope

- ProToolsLayout grid with 5 categories
- 19 panel components (Parallel, Forensics, Doctor, Worktrees, Hooks, Routing History, Skill Health, Remote Questions, MCP Servers, Headless Launcher, Knowledge Editor, Decisions Table, Requirements Tracker, Runtime Editor, Agents Editor, Activity Log Viewer, Budget Pressure Map, Custom Models Editor, Visualizer)
- Toast notification system (shadcn/ui Sonner or custom)
- Keyboard shortcuts via useEffect listeners
- Loading skeletons for async content
- Playwright E2E test suite (7 core flows)
- Tauri bundle configuration
- GitHub Actions CI workflow

### Out of Scope / Non-Goals

- macOS code signing / notarization (R033 deferred — requires Apple Developer account)
- Auto-updater (R034 deferred)
- Embedded terminal (R035 deferred)
- Real GSD binary integration in E2E (mock-based for now)

## Technical Constraints

- TDD maintained (D006)
- @tauri-apps/api import boundary (D005)
- All development on develop branch (D007)
- shadcn/ui new-york style, Tailwind CSS 4

## Integration Points

- GSD CLI — pro tool panels invoke commands via gsd-client.ts
- GitHub Actions — CI workflow for cross-platform builds
- Tauri bundler — platform-specific installer generation
