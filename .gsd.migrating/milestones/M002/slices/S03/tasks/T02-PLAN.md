---
estimated_steps: 5
estimated_files: 2
skills_used:
  - test
---

# T02: Wire gsd-client.ts to Tauri invoke/listen and rewrite tests

**Slice:** S03 — React IPC client — wire gsd-client.ts to Tauri
**Milestone:** M002

## Description

Replace the no-op stubs in `gsd-client.ts` with real Tauri `invoke()` and `listen()` calls. Rewrite the test file to use the Tauri mock infrastructure from T01 and verify correct command names, argument shapes, and event subscriptions.

## Steps

1. **Rewrite `src/services/gsd-client.ts`** — replace all no-op implementations:

   Import `invoke` from `@tauri-apps/api/core` and `listen` from `@tauri-apps/api/event`. Import types from `@/lib/types`. **This file is the ONLY file allowed to import `@tauri-apps/api`** (decision D005).

   Update the `GsdClient` interface to include event listener methods. The full interface should be:
   ```typescript
   export interface GsdClient {
     // Commands (invoke-based)
     startSession: (projectPath: string) => Promise<void>;
     stopSession: () => Promise<void>;
     sendCommand: (command: RpcCommand) => Promise<void>;
     queryState: (projectPath: string) => Promise<QuerySnapshot>;
     listProjects: (scanPath: string) => Promise<ProjectInfo[]>;
     startFileWatcher: (projectPath: string) => Promise<void>;
     stopFileWatcher: () => Promise<void>;
     // Event listeners (listen-based) — return unlisten functions
     onGsdEvent: (handler: (payload: GsdEventPayload) => void) => Promise<() => void>;
     onProcessExit: (handler: (payload: GsdExitPayload) => void) => Promise<() => void>;
     onProcessError: (handler: (payload: GsdErrorPayload) => void) => Promise<() => void>;
     onFileChanged: (handler: (payload: GsdFileChangedPayload) => void) => Promise<() => void>;
   }
   ```

   Implementation mapping to Tauri commands (from `src-tauri/src/lib.rs`):
   - `startSession(projectPath)` → `invoke("start_gsd_session", { projectPath })`
   - `stopSession()` → `invoke("stop_gsd_session")`
   - `sendCommand(command)` → `invoke("send_gsd_command", { command: JSON.stringify(command) })` (Rust side expects a JSON string)
   - `queryState(projectPath)` → `invoke("query_gsd_state", { projectPath })`
   - `listProjects(scanPath)` → `invoke("list_projects", { scanPath })`
   - `startFileWatcher(projectPath)` → `invoke("start_file_watcher", { projectPath })`
   - `stopFileWatcher()` → `invoke("stop_file_watcher")`

   Event listener mapping (from `gsd_process.rs` and `gsd_watcher.rs`):
   - `onGsdEvent(handler)` → `listen("gsd-event", (event) => handler(event.payload))`
   - `onProcessExit(handler)` → `listen("gsd-process-exit", (event) => handler(event.payload))`
   - `onProcessError(handler)` → `listen("gsd-process-error", (event) => handler(event.payload))`
   - `onFileChanged(handler)` → `listen("gsd-file-changed", (event) => handler(event.payload))`

   Re-export key types from `@/lib/types` so downstream consumers import from `gsd-client.ts` (maintaining the single-file boundary).

2. **Rewrite `src/services/gsd-client.test.ts`** using the T01 mock infrastructure:

   Import `mockTauriApi` from `@/test/tauri-mock`. Call `vi.mock` at the top level (vi.mock is hoisted). Use `mockTauriApi()` in a `beforeEach` to get fresh `mockInvoke` and `mockListen` references.

   Tests to write (minimum — aim for 12+ covering the full API surface):
   - `createGsdClient() returns an object with all expected methods` (updated to include new methods)
   - `startSession() calls invoke with correct command and args`
   - `stopSession() calls invoke with correct command`
   - `sendCommand() calls invoke with stringified command` (verify JSON.stringify)
   - `queryState() calls invoke and returns QuerySnapshot`
   - `listProjects() calls invoke and returns ProjectInfo array`
   - `startFileWatcher() calls invoke with correct args`
   - `stopFileWatcher() calls invoke with correct command`
   - `onGsdEvent() calls listen with correct event name`
   - `onProcessExit() calls listen and returns unlisten function`
   - `onProcessError() calls listen with correct event name`
   - `onFileChanged() calls listen with correct event name`
   - `invoke failure propagates as rejected promise`

   For each invoke-based test: configure `mockInvoke.mockResolvedValue(...)` then call the client method, then assert `mockInvoke` was called with the expected command name and args.

   For each listen-based test: configure `mockListen.mockResolvedValue(unlistenFn)`, call the client method, assert `mockListen` was called with the correct event name, verify the returned unlisten function.

3. **Remove old inline interfaces from gsd-client.ts** — `GsdSession`, `CommandResult`, `GsdState` interfaces are replaced by the types from `src/lib/types.ts`. The old `GsdClient` interface shape changes (different method signatures). Any file importing the old types from gsd-client.ts will need updating — check for downstream imports.

4. **Check for downstream import breakage**: Run `grep -r "from.*gsd-client" src/ --include="*.ts" --include="*.tsx"` to find any files importing from gsd-client.ts. If status-bar or other M001 components reference `GsdState`, update them to import from `@/lib/types` or update the re-exports from gsd-client.ts to maintain backward compatibility. The key constraint: don't break existing 97 tests.

5. **Run full verification**: `npm run test -- --run` must pass with 97+ tests. Run the @tauri-apps/api import leakage check.

## Must-Haves

- [ ] `gsd-client.ts` imports from `@tauri-apps/api/core` and `@tauri-apps/api/event`
- [ ] All 7 Tauri commands are called via `invoke()` with correct names and args
- [ ] All 4 event types have `listen()` wrappers returning unlisten functions
- [ ] Test file uses Tauri mock infrastructure from `src/test/tauri-mock.ts`
- [ ] Tests verify invoke is called with correct command names and argument shapes
- [ ] Tests verify listen is called with correct event names
- [ ] No `@tauri-apps/api` imports outside `gsd-client.ts` and `tauri-mock.ts`
- [ ] `npm run test` passes with 97+ tests

## Verification

- `npm run test -- --run` passes with 97+ total tests, 0 failures
- `grep -r "@tauri-apps/api" src/ --include="*.ts" --include="*.tsx" | grep -v gsd-client.ts | grep -v tauri-mock.ts` returns empty
- `grep -c "it(" src/services/gsd-client.test.ts` shows 12+ test cases

## Inputs

- `src/services/gsd-client.ts` — current no-op implementation to rewrite
- `src/services/gsd-client.test.ts` — current test file to rewrite
- `src/lib/types.ts` — shared types from T01
- `src/test/tauri-mock.ts` — Tauri mock helper from T01

## Expected Output

- `src/services/gsd-client.ts` — rewritten with real Tauri invoke/listen calls
- `src/services/gsd-client.test.ts` — rewritten with Tauri mock-based tests
