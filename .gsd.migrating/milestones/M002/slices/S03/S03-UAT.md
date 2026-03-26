# S03: React IPC client — wire gsd-client.ts to Tauri — UAT

**Milestone:** M002
**Written:** 2026-03-25T09:01:45.561Z

# S03 UAT: React IPC client — wire gsd-client.ts to Tauri

## Preconditions
- Repository checked out at M002/S03 completion point
- `npm install` completed successfully
- Node.js 18+ available

## Test Cases

### TC1: All tests pass with no regressions
1. Run `npm run test -- --run`
2. **Expected:** 104 tests pass across 11 test files, 0 failures
3. **Expected:** No test file names changed from M001 baseline (11 files)

### TC2: Import boundary enforcement (D005)
1. Run `grep -r \"@tauri-apps/api\" src/ --include=\"*.ts\" --include=\"*.tsx\" | grep -v gsd-client.ts | grep -v tauri-mock.ts`
2. **Expected:** Empty output — no @tauri-apps/api imports outside allowed files

### TC3: Shared types exist and compile
1. Run `npx tsc --noEmit`
2. **Expected:** No type errors
3. Inspect `src/lib/types.ts` — must export: RpcCommand, RpcEvent, QuerySnapshot, ProjectInfo, GsdEventPayload, GsdExitPayload, GsdErrorPayload, GsdFileChangedPayload, SessionState

### TC4: gsd-client.ts uses real Tauri calls
1. Open `src/services/gsd-client.ts`
2. **Expected:** Imports `invoke` from `@tauri-apps/api/core` and `listen` from `@tauri-apps/api/event`
3. **Expected:** Each method calls `invoke()` with correct Tauri command name
4. **Expected:** Event listener methods (onGsdEvent, onProcessExit, onProcessError, onFileChanged) call `listen()` with correct event names

### TC5: Tauri mock infrastructure is reusable
1. Open `src/test/tauri-mock.ts`
2. **Expected:** Exports `setupTauriMocks()` function
3. **Expected:** Mocks both `@tauri-apps/api/core` (invoke) and `@tauri-apps/api/event` (listen)
4. **Expected:** Returns mock objects that tests can configure with custom return values

### TC6: Test coverage of invoke arguments
1. Open `src/services/gsd-client.test.ts`
2. **Expected:** Tests verify invoke is called with correct command names: start_gsd_session, stop_gsd_session, send_gsd_command, query_gsd_state, list_projects
3. **Expected:** Tests verify correct argument shapes are passed to invoke

### Edge Cases
- **EC1:** Invoke failure propagation — test file includes test(s) verifying that when invoke() rejects, the client method also rejects with the error
- **EC2:** Event unlisten — test file verifies that listen() returns an unlisten function that can be called to unsubscribe"
