---
depends_on: []
---

# M002: GSD Backend Bridge

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Description

M002 builds the bridge between the M001 React shell and the GSD CLI. Two layers: the Rust backend (Tauri commands for process management, JSONL RPC, headless query, file watching) and the React frontend (real IPC wiring in gsd-client.ts, Zustand stores for GSD session and project state, TanStack Query hooks for polling and cache invalidation, event routing from the GSD child process into the UI).

After M002, the app can spawn a real GSD process, send commands, receive streaming events, and reflect live state — turning the shell from M001 into a functional GSD client.

## Why This Milestone

The app shell from M001 is inert — every view shows mock data, every IPC call is a no-op. M002 is the nervous system that makes it alive. Without this bridge, M003's chat interface and auto-mode controls have nothing to talk to. The Rust process manager is the highest-risk component in the entire project — it touches cross-platform process spawning, stdin/stdout streaming, and crash detection. Retiring that risk early is critical.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Launch the app and have it discover existing GSD projects from `~/.gsd/projects/`
- Select a project and see real GSD state (active milestone, phase, progress, cost) in the status bar
- Start a GSD RPC session that spawns `gsd --mode rpc` as a child process
- See the connection status change in real-time (disconnected → connecting → connected)
- Run `gsd` in a separate terminal on the same project and see the GUI update in real-time via file watching

### Entry point / environment

- Entry point: `npm run tauri dev` (development)
- Environment: local dev on Windows (primary), must also build on macOS and Linux
- Live dependencies involved: `gsd` CLI binary on PATH (for `gsd --mode rpc` and `gsd headless query`)

## Completion Class

- Contract complete means: `cargo test` passes all Rust tests, `npm run test` passes all JS tests (97 existing + new), Zustand stores have tested state machines, IPC client has tested mock responses
- Integration complete means: Tauri commands can spawn a real GSD process, JSONL events flow into React stores, headless query returns real data, file watcher triggers UI refresh
- Operational complete means: graceful shutdown on app close, crash detection and reporting, reconnect after process exit

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- The frontend can invoke `start_gsd_session` → GSD child spawns → JSONL events stream into Zustand stores → status bar shows real state
- Headless query returns a valid QuerySnapshot and TanStack Query caches/refreshes it
- File watcher detects `.gsd/STATE.md` changes and triggers store update within 2 seconds
- Stopping the session gracefully kills the child process
- No `@tauri-apps/api` imports exist outside `gsd-client.ts` (D005)

## Risks and Unknowns

- **Cross-platform process spawning** — `gsd --mode rpc` needs stdin/stdout piping. Windows uses different process APIs than Unix. Tauri's `tauri-plugin-shell` or raw `std::process::Command` — need to evaluate which. Risk: medium, retire in S01.
- **JSONL streaming fidelity** — Stdout buffering can cause partial lines, interleaved output, or lost events. Need line-buffered reading with proper framing. Risk: medium, retire in S01.
- **GSD binary resolution** — Finding `gsd` on PATH varies by platform and install method (npm global, cargo install, direct binary). Need a robust resolution chain. Risk: low, retire in S01.
- **TanStack Query + Zustand coordination** — Event-driven store updates and polling-based query cache must coexist without stale data or unnecessary re-renders. Risk: low, retire in S05.
- **notify-rs cross-platform behavior** — File watching behavior differs between Windows (ReadDirectoryChangesW), macOS (FSEvents), and Linux (inotify). Debouncing needed. Risk: low, retire in S02.

## Existing Codebase / Prior Art

- `src/services/gsd-client.ts` — IPC abstraction with no-op implementations (M001). Interface contract is the boundary: `startSession`, `stopSession`, `sendCommand`, `queryState`, `listProjects`. M002 replaces the no-ops with real Tauri invoke/listen calls.
- `src/services/gsd-client.test.ts` — 7 existing tests against the no-op contract. These must continue to pass or be updated to test real IPC mocks.
- `src/stores/ui-store.ts` — Zustand UI store (theme, sidebar, activeView). Pattern to follow for new stores.
- `src-tauri/src/lib.rs` — Bare Tauri builder with no commands. M002 registers all new commands here.
- `src-tauri/Cargo.toml` — Minimal deps (tauri, serde, serde_json). M002 adds notify, tokio, etc.
- `GSD-UI-ARCHITECTURE.md` — Phase 2 and Phase 3 specs with detailed requirements. Authoritative reference for RPC types, event shapes, and command signatures.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R011 — Rust backend process manager (spawn/stop gsd) — primary owner
- R012 — JSONL RPC communication bridge — primary owner
- R013 — Headless query for instant state reads — primary owner
- R014 — File system watcher for .gsd/ changes — primary owner
- R015 — React ↔ Tauri IPC bridge with Zustand stores — primary owner
- R032 — IPC abstraction for Electron escape hatch — validated at interface level in M001, wired for real in M002

## Scope

### In Scope

- Rust modules: `gsd_process.rs` (process lifecycle), `gsd_rpc.rs` (JSONL framing), `gsd_query.rs` (headless query), `gsd_watcher.rs` (file watching)
- Tauri commands: `start_gsd_session`, `stop_gsd_session`, `send_gsd_command`, `query_gsd_state`, `list_projects`
- Tauri events: `gsd-event`, `gsd-process-exit`, `gsd-process-error`, `gsd-file-changed`
- React: wire `gsd-client.ts` to real Tauri invoke/listen
- Zustand stores: `gsd-store.ts` (session state, messages, streaming, UI requests), `project-store.ts` (project list, active project, recent sessions)
- TanStack Query: `use-gsd-state.ts` (polling + event-driven refresh), `use-gsd-events.ts` (event stream routing)
- TypeScript types: `src/lib/types.ts` mirroring GSD RPC protocol types
- Rust unit tests (cargo test) and JS unit tests (vitest)

### Out of Scope / Non-Goals

- Any UI component changes beyond status bar wiring — M003 builds the real screens
- Chat interface or auto-mode controls — M003
- Project creation or import wizards — M003
- Cost charts or progress dashboards — M004
- Multi-project simultaneous sessions — one active session at a time is sufficient for M002
- Tauri plugin system — direct Tauri commands are simpler and sufficient

## Technical Constraints

- Only `gsd-client.ts` may import `@tauri-apps/api` (D005 — Electron escape hatch)
- TDD — tests written before implementation (D006)
- Rust code must compile on stable Rust 1.60+ (Cargo.toml `rust-version`)
- JSONL protocol must match GSD's existing format exactly (the VS Code extension uses the same protocol)
- File watcher must debounce events (100-500ms) to avoid flooding the frontend

## Integration Points

- **GSD CLI** — `gsd --mode rpc` for interactive sessions, `gsd headless query` for snapshots
- **`~/.gsd/projects/`** — GSD's project registry for discovering known projects
- **`.gsd/STATE.md`, `.gsd/metrics.json`** — watched files for two-terminal workflow
- **Tauri IPC** — invoke (React → Rust) and listen (Rust → React) for all communication

## Open Questions

- None — the architecture spec and M001 boundary contracts answer all technical questions for this milestone
