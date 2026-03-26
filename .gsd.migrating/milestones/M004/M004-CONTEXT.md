---
depends_on: [M003]
---

# M004: Data Views & Configuration

**Gathered:** 2026-03-25
**Status:** Ready for planning

## Project Description

M004 builds the data visualization and configuration screens. The progress dashboard shows milestone/slice/task trees with completion status. The roadmap view renders slices as cards with risk badges and dependency lines. Cost charts use Recharts for budget tracking. The session browser lists all sessions with search/resume. The config panel reads/writes GSD preferences.

After M004, users have full visibility into project progress, costs, and execution history — plus the ability to configure GSD behavior through the GUI.

## Why This Milestone

M003 gave users the ability to interact with GSD (chat, auto mode). M004 gives them visibility — where things stand, what they cost, and how to tune the engine. Without this, users must drop to the terminal for progress checks and config changes.

## User-Visible Outcome

- See milestone/slice/task tree with ✅/🔄/⬜ indicators, progress bars, cost
- See slices as cards with risk badges (green/yellow/red) and status
- See budget ceiling bar, cost breakdown by phase/model (Recharts charts)
- Browse all sessions with search, resume, metadata
- Configure GSD: models per phase, git settings, budget, verification commands

## Scope

### In Scope
- ProgressDashboard: tree view with completion indicators, progress bars, cost
- RoadmapView: slice cards with risk badges, status indicators
- CostOverview: budget bar, phase/model charts (Recharts), per-slice cost table
- SessionBrowser: session list with search, metadata, resume action
- ConfigPanel: tabbed settings (general, models, git, budget, verification)
- Recharts dependency installation

### Out of Scope
- SVG dependency arrows between roadmap cards (complex, deferred to M005)
- Pro tools panels (M005)
- E2E tests (M005)
- Export/import functionality

## Relevant Requirements
- R022 — Progress tree view (primary owner)
- R023 — Roadmap card layout (primary owner, SVG arrows deferred)
- R024 — Cost charts with Recharts (primary owner)
- R025 — Session browser (primary owner)
- R026 — Settings UI (primary owner)

## Slice Strategy

1. **S01: Recharts + data types** — Install Recharts, define milestone/session data types
2. **S02: Progress dashboard** — R022. Milestone tree with completion indicators
3. **S03: Roadmap view** — R023. Slice cards with risk/status badges
4. **S04: Cost overview** — R024. Budget bar + charts
5. **S05: Session browser** — R025. Session list with search/resume
6. **S06: Config panel** — R026. Tabbed settings UI
