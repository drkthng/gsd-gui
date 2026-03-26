# S03: React IPC client — wire gsd-client.ts to Tauri

**Goal:** `gsd-client.ts` calls real Tauri `invoke()` and `listen()` instead of no-op stubs. TypeScript types mirror the Rust structs. All tests use Tauri mocks.
**Demo:** `npm run test` passes with all existing 97 tests + new tests verifying invoke arguments, event subscription, and error handling. No `@tauri-apps/api` imports outside `gsd-client.ts` (D005).

## Must-Haves

- `@tauri-apps/api` installed as a dependency
- `src/lib/types.ts` with TypeScript types mirroring Rust structs: `RpcCommand`, `RpcEvent`, `QuerySnapshot`, `ProjectInfo`, `GsdEventPayload`, `GsdExitPayload`, `GsdErrorPayload`, `GsdFileChangedPayload`
- `gsd-client.ts` calls `invoke()` for all 7 Tauri commands with correct argument shapes
- `gsd-client.ts` exposes `listen()` wrappers for all 4 event types (`gsd-event`, `gsd-process-exit`, `gsd-process-error`, `gsd-file-changed`)
- No `@tauri-apps/api` imports outside `gsd-client.ts`
- Tauri mock infrastructure in `src/test/tauri-mock.ts` for use by all future test files
- Updated test file verifies invoke is called with correct command names and argument shapes
- `npm run test` passes with 97+ tests (no regression)

## Proof Level

- This slice proves: contract (TypeScript ↔ Rust boundary types + correct invoke/listen wiring)
- Real runtime required: no (Tauri API is mocked in tests)
- Human/UAT required: no

## Verification

- `npm run test -- --run` passes with 97+ total tests, 0 failures
- `grep -r "@tauri-apps/api" src/ --include="*.ts" --include="*.tsx" | grep -v "gsd-client.ts" | grep -v "tauri-mock.ts" | grep -v node_modules` returns empty (D005 — no imports outside allowed files)
- `src/lib/types.ts` exists with exported types for all Rust struct counterparts
- `src/test/tauri-mock.ts` exists with mock setup function
- `src/services/gsd-client.test.ts` has tests covering invoke arguments and event subscriptions

## Integration Closure

- Upstream surfaces consumed: Tauri command names/args from `src-tauri/src/lib.rs` (S01), event names/payloads from `gsd_process.rs` and `gsd_watcher.rs` (S01/S02), query types from `gsd_query.rs` (S02)
- New wiring introduced in this slice: `@tauri-apps/api` dependency, `invoke()`/`listen()` calls in gsd-client.ts, shared TypeScript types in `src/lib/types.ts`
- What remains before the milestone is truly usable end-to-end: S04 (Zustand stores consuming the client), S05 (TanStack Query hooks + event routing), S06 (end-to-end integration proof)

## Observability / Diagnostics

- **Type contract verification:** `npx tsc --noEmit` catches any drift between TypeScript types and their usage across the codebase. A type error here means the IPC boundary types in `src/lib/types.ts` no longer match how they're consumed.
- **Import boundary enforcement:** `grep -r "@tauri-apps/api" src/ --include="*.ts" --include="*.tsx" | grep -v gsd-client.ts | grep -v tauri-mock.ts` must return empty — any output means D005 (single-import-point) is violated.
- **Test regression signal:** `npm run test -- --run` must report 97+ tests with 0 failures. Any failure indicates a regression in the IPC client or its consumers.
- **Mock infrastructure health:** If tests importing `mockTauriApi()` fail with "Cannot find module @tauri-apps/api/core", the mock setup is broken — check that `vi.mock()` calls are at module scope.

## Tasks

- [x] **T01: Create shared TypeScript types and Tauri test mock infrastructure** `est:45m`
  - Why: Types must mirror Rust structs exactly for invoke/listen type safety. A reusable Tauri mock helper prevents every test file from reinventing mocking. These are prerequisites for wiring gsd-client.ts.
  - Files: `package.json`, `src/lib/types.ts`, `src/test/tauri-mock.ts`
  - Do: Install `@tauri-apps/api`. Create `src/lib/types.ts` exporting TypeScript interfaces/types that mirror every Rust struct used across the IPC boundary (RpcCommand, RpcEvent, QuerySnapshot, ProjectInfo, GsdEventPayload, GsdExitPayload, GsdErrorPayload, GsdFileChangedPayload, plus SessionState enum). Create `src/test/tauri-mock.ts` with a helper that sets up vi.mock for `@tauri-apps/api/core` (invoke) and `@tauri-apps/api/event` (listen) with configurable return values. Ensure the mock helper is importable from any test file. Types must use camelCase field names matching serde `rename_all = "camelCase"` and discriminated unions with `type` field matching serde `tag = "type"`.
  - Verify: `npx tsc --noEmit` passes (types are valid). `npm run test -- --run` still passes 97 tests (no regressions from install/types).
  - Done when: `src/lib/types.ts` exports all IPC boundary types, `src/test/tauri-mock.ts` exports a usable mock setup function, and no existing tests broke.

- [x] **T02: Wire gsd-client.ts to Tauri invoke/listen and rewrite tests** `est:1h`
  - Why: This is the core deliverable — replacing no-op stubs with real Tauri IPC calls and proving the wiring is correct through tests that verify invoke arguments and event subscriptions.
  - Files: `src/services/gsd-client.ts`, `src/services/gsd-client.test.ts`
  - Do: Rewrite `gsd-client.ts` to import `invoke` from `@tauri-apps/api/core` and `listen` from `@tauri-apps/api/event`. Replace each no-op method with a real `invoke()` call using the correct Tauri command name and argument shape. Add `listen*` methods for all 4 event types returning unlisten functions. Re-export types from `src/lib/types.ts` instead of defining inline interfaces. Update `GsdClient` interface to include event listener methods (onGsdEvent, onProcessExit, onProcessError, onFileChanged). Rewrite `gsd-client.test.ts` using the Tauri mock from T01 — test each method verifies the correct command name and args are passed to invoke, test event listeners call listen() with correct event names, test error propagation from invoke failures. Must maintain or exceed the existing 7 test count. No `@tauri-apps/api` imports in the test file — use the mock helper.
  - Verify: `npm run test -- --run` passes with 97+ tests. `grep -r "@tauri-apps/api" src/ --include="*.ts" --include="*.tsx" | grep -v gsd-client.ts | grep -v tauri-mock.ts` returns empty.
  - Done when: `gsd-client.ts` calls real Tauri invoke/listen, all tests pass, no @tauri-apps/api leakage outside gsd-client.ts and tauri-mock.ts.

## Files Likely Touched

- `package.json` (add @tauri-apps/api dependency)
- `src/lib/types.ts` (new — shared TypeScript types)
- `src/test/tauri-mock.ts` (new — Tauri mock infrastructure)
- `src/services/gsd-client.ts` (rewrite — real IPC calls)
- `src/services/gsd-client.test.ts` (rewrite — Tauri mock tests)
