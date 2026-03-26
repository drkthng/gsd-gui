# M006: M006

**Vision:** Connect the GUI to real project data. When a user selects a project, the milestones, slices, tasks, timeline, and costs pages show live data parsed from that project's .gsd/ directory — not mock data. Users can filter milestones by status (active, complete, planned) and the UI clearly scopes all views to the selected project.

## Success Criteria

- Selecting a project in the gallery populates milestones, timeline, and costs with real data from that project's .gsd/ directory
- Milestones page shows filterable list by status: active, complete, planned
- No mock data remains in production pages (milestones, timeline, costs)
- No console window flashes on Windows when background processes spawn
- All existing tests pass plus new tests for the data layer

## Slices

- [x] **S01: GSD Project Data Parser** `risk:high` `depends:[]`
  > After this: Tauri command returns parsed milestones/slices/tasks from a real .gsd/ directory

- [x] **S02: Live Dashboard Wiring** `risk:medium` `depends:[S01]`
  > After this: Select a project in gallery → milestones, timeline, and costs pages show real data from that project

- [x] **S03: Milestone Filtering & Polish** `risk:low` `depends:[S02]`
  > After this: User can filter milestones by status (active, complete, planned). Collapsed/expanded groups.

## Boundary Map

```\nFrontend (React) ←→ Rust Backend ←→ .gsd/ filesystem\n\nS01: Rust parsers read .gsd/ files → return typed structs via Tauri IPC\nS02: React pages consume real data, replace mock imports\nS03: Milestone filtering UI + project-scoped state management\n```
