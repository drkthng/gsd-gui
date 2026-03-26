---
id: M006
title: "Live Project Data"
status: complete
completed_at: 2026-03-26T10:01:41.604Z
key_decisions:
  - Used regex crate for ROADMAP/PLAN line parsing — more robust than manual string splitting against format variations
  - Multi-signal status derivation: checkbox state + SUMMARY.md existence + frontmatter metadata for accurate task/slice/milestone status
  - useMilestoneData uses useState+useEffect (not TanStack Query) because it subscribes to Zustand store state
  - Fetch generation ref pattern for discarding stale IPC responses on rapid project switching
  - StatusFilter maps to CompletionStatus groups (Active=in-progress, Complete=done, Planned=pending+blocked) rather than raw enum values
  - CREATE_NO_WINDOW flag added to both gsd_process.rs and gsd_query.rs for Windows console suppression
key_files:
  - src-tauri/src/gsd_parser.rs — 1008-line Rust parser for .gsd/milestones/ directory trees with 35 unit tests
  - src/hooks/use-milestone-data.ts — Custom hook: Zustand subscription → IPC call → derived state
  - src/lib/derive-cost-data.ts — Pure function: MilestoneInfo[] → CostData with fallback logic
  - src/lib/milestone-filters.ts — Pure filtering/grouping utilities for milestone status
  - src/components/milestones/milestone-filter-bar.tsx — Toggle buttons with count badges
  - src/components/milestones/milestone-grouped-list.tsx — Radix Collapsible sections per status group
  - src/pages/milestones-page.tsx — Rewired to live data with filter state
  - src/pages/timeline-page.tsx — Rewired to live data
  - src/pages/costs-page.tsx — Rewired to live data
  - src/services/gsd-client.ts — Added parseProjectMilestones IPC method
lessons_learned:
  - Pure utility + UI component pattern works well for filtering: logic in src/lib, component in src/components, wired in page — clean separation of concerns and easy to test independently
  - Fetch generation ref pattern is a lightweight alternative to AbortController for Tauri invoke (which doesn't support AbortController) — increment a ref on each fetch, check it when the response arrives
  - within() scoping in testing-library is essential when FilterBar buttons and Collapsible trigger buttons share the same text labels (e.g. 'Active', 'Complete')
  - Regex-based .gsd file parsing with graceful degradation (missing files → empty arrays, malformed lines → skipped) is more resilient than strict parsing for files that may be hand-edited
---

# M006: Live Project Data

**Connected the GUI to real .gsd/ project data — selecting a project now populates milestones, timeline, and costs pages with live parsed data, filterable by status.**

## What Happened

M006 delivered the data pipeline from filesystem to UI across three slices.

**S01 (GSD Project Data Parser)** built a 1,008-line Rust parser (`gsd_parser.rs`) that reads `.gsd/milestones/` directory trees — ROADMAP.md for milestone/slice metadata, PLAN.md for task details, and SUMMARY.md frontmatter for completion status and duration. Multi-signal status derivation combines checkbox state, file existence, and frontmatter metadata for accuracy. The parser is exposed as a `parse_project_milestones_cmd` Tauri command and wired through `GsdClient.parseProjectMilestones()` to the frontend. 35 Rust unit tests cover all parser paths including a live integration test against this project's own `.gsd/` directory. The regex crate handles ROADMAP/PLAN line parsing robustly.

**S02 (Live Dashboard Wiring)** created the `useMilestoneData` hook (Zustand subscription → IPC call → derived state) and `deriveCostData` utility. All three dashboard pages (milestones, timeline, costs) were rewired from mock data imports to the hook, with four conditional rendering states: no-project-selected → loading → error → data-ready. A fetch generation ref pattern handles stale response discarding on rapid project switching. 26 new tests (9 hook + 8 cost derivation + 9 page integration).

**S03 (Milestone Filtering & Polish)** added milestone status filtering (All/Active/Complete/Planned) with collapsible grouped sections. Pure filtering utilities in `milestone-filters.ts`, a `MilestoneFilterBar` component with count badges, and a `MilestoneGroupedList` using Radix Collapsible for expand/collapse. All built TDD-first. 36 new tests.

Additionally, both `gsd_process.rs` and `gsd_query.rs` received `CREATE_NO_WINDOW` flags on Windows to prevent console window flashing when spawning background processes.

Final state: 381 frontend tests across 55 files + 35 Rust parser tests, all passing. TypeScript clean. No mock data in production pages.

## Success Criteria Results

### 1. Selecting a project populates milestones, timeline, and costs with real data ✅
All three pages (`milestones-page.tsx`, `timeline-page.tsx`, `costs-page.tsx`) import `useMilestoneData` hook which subscribes to `useProjectStore.activeProject` and calls `GsdClient.parseProjectMilestones(path)`. Hook tests verify the full flow: null project → loading → data ready. Page integration tests verify conditional rendering.

### 2. Milestones page shows filterable list by status: active, complete, planned ✅
`MilestoneFilterBar` renders All/Active/Complete/Planned toggle buttons with count badges. `filterMilestonesByStatus` maps Active→in-progress, Complete→done, Planned→pending+blocked. `MilestoneGroupedList` renders collapsible sections per status group. 22 filter utility tests + 6 FilterBar tests + 7 GroupedList tests + 7 page integration tests verify the full chain.

### 3. No mock data remains in production pages ✅
`rg "mock-data|mockMilestones|mockCostData" src/pages/{milestones,timeline,costs}-page.tsx` returns no matches. All three pages import only `useMilestoneData` and `useProjectStore`.

### 4. No console window flashes on Windows when background processes spawn ✅
`gsd_process.rs` and `gsd_query.rs` both set `creation_flags(0x08000000)` (CREATE_NO_WINDOW) under `#[cfg(windows)]` before spawning child processes. Diff confirms these were added in M006.

### 5. All existing tests pass plus new tests for the data layer ✅
381 frontend tests pass across 55 files (345 pre-M006 + 36 new). 35 Rust parser tests pass. TypeScript type check clean. No regressions.

## Definition of Done Results

### All slices complete ✅
S01, S02, S03 all `[x]` in M006-ROADMAP.md. All three slice SUMMARY.md files exist.

### Slice summaries exist ✅
- `.gsd/milestones/M006/slices/S01/S01-SUMMARY.md` — present
- `.gsd/milestones/M006/slices/S02/S02-SUMMARY.md` — present
- `.gsd/milestones/M006/slices/S03/S03-SUMMARY.md` — present

### Cross-slice integration verified ✅
- S01 provides `GsdClient.parseProjectMilestones()` → S02 consumes it via `useMilestoneData` hook → S03 consumes hook output for filtering/grouping
- S01 provides `MilestoneInfo` types → S02 and S03 both import from `gsd-client.ts` re-exports
- Type contract verified: Rust serde structs serialize to camelCase JSON matching TypeScript types in `src/lib/types.ts`

### Code changes verified ✅
23 non-.gsd files changed with 2,708 lines of additions across Rust parser, React hooks, utility modules, components, pages, and tests.

## Requirement Outcomes

### R008 (TDD) — Advanced → Active
All 36 new frontend tests (S03) and 26 new tests (S02) were written before implementation code per TDD constraint. 35 Rust tests (S01) also written test-first. R008 remains active as a project-wide constraint — evidence from M006 continues to validate the pattern.

### R009 (Zustand for app state) — Advanced
`useMilestoneData` hook reads `activeProject` from `useProjectStore` (Zustand). Filter state in `milestones-page.tsx` uses React `useState` (local UI state), consistent with Zustand for shared app state. Pattern maintained.

### R032 (No direct Tauri imports in pages) — Advanced
All three rewired pages consume data through `useMilestoneData` hook which calls `GsdClient.parseProjectMilestones()`. No direct `@tauri-apps/api` imports in any page file.

## Deviations

S01/T01 delivered 35 tests instead of the planned ~15 — extra coverage was low-cost. S02/T02 required full action function stubs in useProjectStore mock due to ProjectGallery's useEffect calling loadProjects. S03/T02 used within() scoping for button disambiguation — not anticipated in plan but correct approach.

## Follow-ups

Cost data defaults to 0.0 since the .gsd parser doesn't extract real cost data — a future milestone should add cost data parsing from metrics.json or similar source.
