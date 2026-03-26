---
id: S03
parent: M002
milestone: M002
provides:
  - gsd-client.ts with real Tauri invoke/listen IPC methods
  - src/lib/types.ts with all shared TypeScript IPC boundary types
  - src/test/tauri-mock.ts with reusable setupTauriMocks() helper
requires:
  - slice: S01
    provides: Tauri command names and argument shapes for start_gsd_session, stop_gsd_session, send_gsd_command
  - slice: S02
    provides: Tauri command names for query_gsd_state, list_projects and event name gsd-file-changed
affects:
  - S04
  - S05
  - S06
key_files:
  - src/lib/types.ts
  - src/test/tauri-mock.ts
  - src/services/gsd-client.ts
  - src/services/gsd-client.test.ts
key_decisions:
  - T02 scope was already delivered by T01 — verified rather than re-implemented
patterns_established:
  - setupTauriMocks() in src/test/tauri-mock.ts — reusable mock helper for all future test files needing Tauri invoke/listen mocks
  - Shared IPC types in src/lib/types.ts — single source of truth for TypeScript types mirroring Rust structs, imported by gsd-client.ts and consumers
observability_surfaces:
  - Import boundary enforcement: grep -r @tauri-apps/api src/ excluding gsd-client.ts and tauri-mock.ts must return empty
  - Test regression signal: npm run test must report 104+ tests with 0 failures
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T09:01:45.560Z
blocker_discovered: false
---

# S03: React IPC client — wire gsd-client.ts to Tauri

**Wired gsd-client.ts to real Tauri invoke/listen calls with shared TypeScript types and reusable mock infrastructure, raising test count from 97 to 104.**

## What Happened

This slice replaced the no-op stubs in gsd-client.ts with real Tauri IPC calls. T01 created shared TypeScript types in src/lib/types.ts mirroring all Rust structs (RpcCommand, RpcEvent, QuerySnapshot, ProjectInfo, and all event payloads), installed @tauri-apps/api, built a reusable Tauri mock helper in src/test/tauri-mock.ts, and rewrote gsd-client.ts to call invoke() for all 7 Tauri commands and expose listen() wrappers for all 4 event types. T01 also rewrote the test file with 14 tests covering invoke arguments, event subscriptions, error propagation, and payload forwarding. T02 verified that T01 had already delivered the complete scope — no additional code changes were needed. All 104 tests pass, the @tauri-apps/api import boundary (D005) is enforced, and the TypeScript types compile cleanly.

## Verification

All three slice-level verification checks pass: (1) npm run test -- --run: 104 tests pass across 11 files, 0 failures. (2) grep for @tauri-apps/api imports outside gsd-client.ts and tauri-mock.ts returns empty (D005 enforced). (3) All required files exist: src/lib/types.ts, src/test/tauri-mock.ts, src/services/gsd-client.ts, src/services/gsd-client.test.ts.

## Requirements Advanced

- R008 — TDD maintained — tests rewritten with Tauri mocks before verifying wiring correctness

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01 delivered the full scope of both T01 and T02. T02 became a pure verification task with no code changes needed.

## Known Limitations

Vitest warns about vi.mock() calls in tauri-mock.ts not being at module top level. This works today but will become an error in a future Vitest version. The mock helper should be refactored to use top-level vi.mock() calls.

## Follow-ups

Refactor tauri-mock.ts to move vi.mock() calls to module top level before Vitest enforces this as an error.

## Files Created/Modified

- `package.json` — Added @tauri-apps/api dependency
- `src/lib/types.ts` — New — shared TypeScript types mirroring all Rust IPC structs
- `src/test/tauri-mock.ts` — New — reusable Tauri mock infrastructure for vi.mock of invoke/listen
- `src/services/gsd-client.ts` — Rewritten — real Tauri invoke/listen calls replacing no-op stubs
- `src/services/gsd-client.test.ts` — Rewritten — 14 tests using Tauri mocks verifying invoke args and event subscriptions
