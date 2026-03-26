---
estimated_steps: 11
estimated_files: 2
skills_used: []
---

# T02: Wire parser through GsdClient and add frontend tests

Add `parseProjectMilestones` to the GsdClient interface and implementation, wiring the new Rust Tauri command through to the frontend.

**Steps:**
1. In `src/services/gsd-client.ts`, add `parseProjectMilestones` to the `GsdClient` interface: `parseProjectMilestones: (projectPath: string) => Promise<MilestoneInfo[]>`
2. In the `createGsdClient()` factory, implement it: `invoke<MilestoneInfo[]>("parse_project_milestones", { projectPath })`
3. Add `MilestoneInfo` to the re-export block at the top of gsd-client.ts
4. In `src/services/gsd-client.test.ts`, add tests:
   - `parseProjectMilestones invokes correct command with project path`
   - `parseProjectMilestones returns MilestoneInfo[]`
5. In `src/services/gsd-client.test.ts`, update the existing `createGsdClient() returns an object with all expected methods` test to include `parseProjectMilestones`
6. Run `npm run test -- --run` to verify all tests pass (existing + new, no regressions)

**Key context:** The test file uses `setupTauriMocks()` which provides `mockInvoke` and `mockListen`. Follow the existing pattern for `queryState` which also returns typed data from invoke. The MilestoneInfo type is already defined in `src/lib/types.ts`. R008 requires tests written before implementation — write the test cases first, then implement.

## Inputs

- ``src/services/gsd-client.ts` — existing GsdClient interface and createGsdClient factory to extend`
- ``src/services/gsd-client.test.ts` — existing test file with setupTauriMocks pattern to follow`
- ``src/lib/types.ts` — MilestoneInfo type definition for return type annotation`

## Expected Output

- ``src/services/gsd-client.ts` — GsdClient interface extended with parseProjectMilestones method, factory implementation added, MilestoneInfo re-exported`
- ``src/services/gsd-client.test.ts` — 2+ new test cases for parseProjectMilestones, existing method-check test updated`

## Verification

npm run test -- --run
