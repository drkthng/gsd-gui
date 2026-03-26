---
estimated_steps: 4
estimated_files: 3
skills_used:
  - test
---

# T01: Create shared TypeScript types and Tauri test mock infrastructure

**Slice:** S03 — React IPC client — wire gsd-client.ts to Tauri
**Milestone:** M002

## Description

Install `@tauri-apps/api` as a project dependency. Create `src/lib/types.ts` with TypeScript interfaces/types mirroring every Rust struct used across the IPC boundary. Create `src/test/tauri-mock.ts` with a reusable Vitest mock helper for `@tauri-apps/api/core` and `@tauri-apps/api/event`.

## Steps

1. **Install `@tauri-apps/api`**: Run `npm install @tauri-apps/api`. This provides the `invoke()` and `listen()` functions T02 will use. Verify it appears in `package.json` dependencies.

2. **Create `src/lib/types.ts`** with these TypeScript types mirroring the Rust structs:

   From `src-tauri/src/gsd_rpc.rs`:
   - `RpcCommand` — discriminated union with `type` field, snake_case type values. Variants: `prompt` (text: string), `steer` (text: string), `abort`, `get_state`, `set_model` (model: string), `get_available_models`, `get_session_stats`, `get_messages`, `new_session`.
   - `RpcEvent` — discriminated union with `type` field, snake_case type values. Variants: `agent_start` (sessionId: string), `agent_end` (sessionId: string), `assistant_message` (content: string, done: boolean), `tool_execution_start` (tool: string, id: string), `tool_execution_end` (tool: string, id: string, success: boolean), `extension_ui_request` (requestId: string, kind: string, payload: unknown), `session_state_changed` (payload: unknown), `error` (message: string).

   From `src-tauri/src/gsd_query.rs` (camelCase via `serde(rename_all = "camelCase")`):
   - `QuerySnapshot` — `{ currentMilestone: string | null; activeTasks: number; totalCost: number }`
   - `ProjectInfo` — `{ id: string; name: string; path: string }`

   From `src-tauri/src/gsd_process.rs` (event payloads):
   - `GsdEventPayload` — `{ raw: string; timestamp: number }`
   - `GsdExitPayload` — `{ code: number | null; timestamp: number }`
   - `GsdErrorPayload` — `{ message: string; timestamp: number }`

   From `src-tauri/src/gsd_watcher.rs`:
   - `GsdFileChangedPayload` — `{ path: string; kind: string; timestamp: number }`

   Also define:
   - `SessionState` enum/union: `"idle" | "connecting" | "connected" | "streaming" | "disconnected" | "error"`

   **Important:** RpcEvent fields use camelCase in TypeScript (sessionId, requestId) matching Rust serde `rename_all = "snake_case"` on the tag but camelCase on the fields via Tauri serialization. Actually, check: the Rust structs use `serde(tag = "type", rename_all = "snake_case")` — this renames the *variant* names to snake_case for the tag value, but struct field names stay as-is (snake_case in Rust). When serialized to JSON, Rust field `session_id` becomes `session_id` in JSON (no rename_all on the struct fields). So TypeScript fields should use snake_case matching the JSON: `session_id`, `request_id`, etc.

3. **Create `src/test/tauri-mock.ts`** with a helper function `mockTauriApi()` that:
   - Creates `vi.fn()` mocks for `invoke` and `listen`
   - Sets up `vi.mock("@tauri-apps/api/core", ...)` returning `{ invoke: mockInvoke }`
   - Sets up `vi.mock("@tauri-apps/api/event", ...)` returning `{ listen: mockListen }`
   - `listen` mock should by default return a Promise resolving to an unlisten function (`vi.fn()`)
   - Returns `{ mockInvoke, mockListen }` so tests can configure return values and assert calls
   - Export a type `TauriMocks` for the return value

4. **Verify no regressions**: Run `npx tsc --noEmit` to validate types. Run `npm run test -- --run` to verify all 97 existing tests still pass.

## Must-Haves

- [ ] `@tauri-apps/api` is in `package.json` dependencies
- [ ] `src/lib/types.ts` exports all IPC boundary types matching Rust structs
- [ ] `src/test/tauri-mock.ts` exports a `mockTauriApi()` function that mocks invoke and listen
- [ ] All 97 existing tests still pass

## Verification

- `npm run test -- --run` passes with 97 tests, 0 failures
- `cat src/lib/types.ts` shows exported QuerySnapshot, ProjectInfo, RpcCommand, RpcEvent, all payload types
- `cat src/test/tauri-mock.ts` shows mockTauriApi function with invoke and listen mocks

## Observability Impact

- **New inspection surface:** `src/lib/types.ts` is the canonical type reference for the IPC boundary. A future agent can read this file to understand all command/event shapes without consulting Rust sources.
- **Mock infrastructure:** `src/test/tauri-mock.ts` provides a standard way to mock Tauri APIs in any test file. If a test fails with unresolved `@tauri-apps/api` imports, check that it calls `mockTauriApi()` at module scope.
- **No runtime signals changed:** This task adds only compile-time types and test infrastructure — no runtime behavior is modified.

## Inputs

- `package.json` — add @tauri-apps/api dependency
- `src-tauri/src/gsd_rpc.rs` — reference for RpcCommand and RpcEvent type shapes
- `src-tauri/src/gsd_query.rs` — reference for QuerySnapshot and ProjectInfo type shapes
- `src-tauri/src/gsd_process.rs` — reference for GsdEventPayload, GsdExitPayload, GsdErrorPayload shapes
- `src-tauri/src/gsd_watcher.rs` — reference for GsdFileChangedPayload shape
- `src/test/setup.ts` — existing test setup (don't break it)

## Expected Output

- `package.json` — updated with @tauri-apps/api dependency
- `src/lib/types.ts` — new file with all shared TypeScript types
- `src/test/tauri-mock.ts` — new file with Tauri mock helper
