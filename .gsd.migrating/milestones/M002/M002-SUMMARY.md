# M002: GSD Backend Bridge — Milestone Summary

**Status:** Complete
**Completed:** 2026-03-25

## One-Liner

Full Rust↔React IPC bridge: 5 Rust modules, 7 Tauri commands, 3 Zustand stores, 2 TanStack Query hooks, event routing, and status bar wired to live data — 42 Rust tests, 136 frontend tests.

## Narrative

M002 built the complete communication bridge between the M001 React shell and the GSD CLI backend across 6 slices:

**S01 — Rust process manager & JSONL bridge:** gsd_rpc.rs (RpcCommand/RpcEvent serde types, JsonlFramer), gsd_resolve.rs (3-tier binary resolution), gsd_process.rs (async spawn/send/stop lifecycle), lib.rs (3 Tauri commands with managed state). 21 Rust tests.

**S02 — Headless query & file watcher:** gsd_query.rs (QuerySnapshot parsing, list_projects_in_dir), gsd_watcher.rs (notify-rs v8 watcher with 500ms debounce). 4 more Tauri commands. 21 more Rust tests (42 total).

**S03 — React IPC client wiring:** src/lib/types.ts (shared TypeScript types mirroring Rust), src/test/tauri-mock.ts (reusable mock infrastructure), gsd-client.ts rewritten with real Tauri invoke/listen. 14 frontend tests (104 total).

**S04 — GSD session store & project store:** gsd-store.ts (session lifecycle state machine, message accumulation, UI request queue, event routing), project-store.ts (project list, active project, loading state). 21 store tests (125 total).

**S05 — TanStack Query hooks & event routing:** @tanstack/react-query installed, QueryClientProvider in App.tsx, useGsdState hook (polling + staleTime), useGsdEvents hook (subscribes to all 4 event types, routes to stores, invalidates query cache on file changes). 8 hook tests (133 total).

**S06 — End-to-end integration proof:** StatusBar rewritten from mock data to live store/hook data. useGsdEvents mounted in AppShell. Full event flow proven: Rust Tauri events → gsd-client listen → useGsdEvents → Zustand stores → React UI. 136 total tests.

## Success Criteria Results

- ✅ **App can spawn `gsd --mode rpc` and communicate via JSONL** — S01 Rust process manager + S03 TypeScript client. 21 Rust tests + 14 client tests.
- ✅ **Headless query returns real GSD state snapshots** — S02 gsd_query.rs + S05 useGsdState hook with TanStack Query polling.
- ✅ **File watcher detects `.gsd/` changes and pushes updates within 2s** — S02 gsd_watcher.rs + S05 useGsdEvents invalidates query cache.
- ✅ **Zustand stores track session state, messages, connection status, project list** — S04 gsd-store.ts + project-store.ts. 21 tests.
- ✅ **TanStack Query hooks provide cached, auto-refreshing GSD state** — S05 useGsdState with 2s polling + staleTime. 4 tests.
- ✅ **Status bar displays real GSD data when project active** — S06 StatusBar reads from stores and hooks. 7 tests.
- ✅ **Graceful shutdown kills GSD child process** — S01 stop() + S04 disconnect().

**Result: 7/7 success criteria met.**

## Definition of Done Results

- ✅ All 6 slices complete with summaries
- ✅ 42 Rust tests pass (cargo test --lib)
- ✅ 136 frontend tests pass (npm run test)
- ✅ Production build succeeds (447 kB JS, 52 kB CSS)
- ✅ @tauri-apps/api import boundary enforced (D005)

## Requirement Outcomes

- **R011** (spawn gsd --mode rpc): Active → Advanced. Rust process manager + TypeScript client + Zustand connect/disconnect.
- **R012** (JSONL protocol): Active → Advanced. Rust framing + TypeScript types + event routing to stores.
- **R013** (headless query): Active → Advanced. Rust module + TypeScript client + TanStack Query hook.
- **R014** (file watcher events): Active → Advanced. Rust watcher + event routing + query cache invalidation.
- **R015** (React hooks/stores consume IPC): Active → Advanced. gsd-store + project-store + useGsdState + useGsdEvents.
- **R008** (TDD): Validated — TDD maintained across all 6 slices. 136 tests.
- **R009** (Zustand stores): Validated — 3 stores (ui-store, gsd-store, project-store) all tested.
- **R032** (IPC abstraction): Validated — gsd-client.ts is the only Tauri import boundary.

## Key Decisions

- serde tag=type rename_all=snake_case for Rust RPC enums
- mpsc channel for async stdin writes to child process
- notify-rs v8 with manual 500ms debounce (not notify-debouncer-mini)
- 3-tier binary resolution: TAURI_GSD_PATH → which → common install paths
- vi.hoisted() pattern for Vitest mock setup (avoids hoisting issues)
- TanStack Query polling at 2s with staleTime 1s for GSD state
- useGsdEvents parses raw JSONL from gsd-event payloads, routes to store

## Key Files

- `src-tauri/src/gsd_process.rs` — Async process spawn/send/stop
- `src-tauri/src/gsd_rpc.rs` — RpcCommand/RpcEvent serde types, JsonlFramer
- `src-tauri/src/gsd_resolve.rs` — 3-tier GSD binary resolution
- `src-tauri/src/gsd_query.rs` — Headless query parsing, project listing
- `src-tauri/src/gsd_watcher.rs` — File watcher with debounce
- `src-tauri/src/lib.rs` — Tauri command registration and managed state
- `src/lib/types.ts` — Shared TypeScript IPC boundary types
- `src/services/gsd-client.ts` — Real Tauri invoke/listen IPC client
- `src/test/tauri-mock.ts` — Reusable Tauri mock infrastructure
- `src/stores/gsd-store.ts` — GSD session state machine
- `src/stores/project-store.ts` — Project list and active project
- `src/hooks/use-gsd-state.ts` — TanStack Query hook for GSD state
- `src/hooks/use-gsd-events.ts` — Event stream routing to stores
- `src/components/status-bar/status-bar.tsx` — Live data from stores/hooks

## Lessons Learned

- vi.hoisted() is essential for mocking module-level side effects — vi.mock with inline const references fails at runtime
- TanStack Query + Zustand coexist cleanly: TanStack for server state (polling), Zustand for client state (session lifecycle)
- Mounting event subscriptions via a hook in the shell component keeps event routing centralized
- Test-utils wrapper must include all providers (QueryClientProvider + ThemeProvider + MemoryRouter) or tests fail silently

## Deviations

S01-S03 were completed in a prior session. S04-S06 were initially deferred but then completed in this session to meet all success criteria.

## Follow-ups

- Refactor tauri-mock.ts to move vi.mock() calls to module top level before Vitest enforces this as error
- Wire useGsdEvents to also handle tool_execution_start/end events for future tool call indicators (M003)
- Add real GSD binary integration test when CI environment has gsd installed
