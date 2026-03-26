---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T02: Create Zustand UI store and IPC abstraction with TDD

**Slice:** S02 — shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction
**Milestone:** M001

## Description

Create the Zustand UI store (`useUIStore`) and the IPC abstraction interface (`gsd-client.ts`) using test-driven development. Both are pure TypeScript modules with no UI dependencies — tests are straightforward Vitest unit tests. The UI store manages theme, sidebar, and active view state for the app shell. The IPC abstraction defines a typed interface for all Tauri IPC calls, with a no-op implementation that S03+ will consume. Per R032, `gsd-client.ts` is the ONLY file allowed to import `@tauri-apps/api` in the future — for now it has zero Tauri imports and returns sensible defaults.

## Steps

1. **Install Zustand:** `npm install zustand`

2. **Write UI store tests first (`src/stores/ui-store.test.ts`):** Test the store's initial state and all actions:
   - Initial state: `theme` is `"system"`, `sidebarOpen` is `true`, `activeView` is `"chat"`
   - `setTheme("dark")` changes `theme` to `"dark"`
   - `setTheme("light")` changes `theme` to `"light"`
   - `setTheme("system")` changes `theme` to `"system"`
   - `toggleSidebar()` flips `sidebarOpen` from `true` to `false`, calling again flips back to `true`
   - `setActiveView("projects")` changes `activeView` to `"projects"`
   
   Import `useUIStore` from `@/stores/ui-store`. Use Zustand's `getState()` for testing (no React rendering needed). Reset the store between tests using `useUIStore.setState()` to the initial state, or use `beforeEach` to ensure isolation.

3. **Implement UI store (`src/stores/ui-store.ts`):**
   ```typescript
   import { create } from "zustand";

   type Theme = "dark" | "light" | "system";
   type View = "chat" | "projects" | "milestones" | "timeline" | "costs" | "settings" | "help";

   interface UIState {
     theme: Theme;
     sidebarOpen: boolean;
     activeView: View;
     setTheme: (theme: Theme) => void;
     toggleSidebar: () => void;
     setActiveView: (view: View) => void;
   }

   export const useUIStore = create<UIState>()((set) => ({
     theme: "system",
     sidebarOpen: true,
     activeView: "chat",
     setTheme: (theme) => set({ theme }),
     toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
     setActiveView: (activeView) => set({ activeView }),
   }));

   export type { Theme, View, UIState };
   ```
   Run tests — they should pass.

4. **Write IPC abstraction tests first (`src/services/gsd-client.test.ts`):** Test the no-op implementation:
   - `createGsdClient()` returns an object with all expected methods
   - `client.startSession()` resolves (returns a session-like object or void)
   - `client.stopSession()` resolves
   - `client.sendCommand("test")` resolves (returns a result-like object)
   - `client.queryState()` resolves (returns an empty/default state object)
   - `client.listProjects()` resolves (returns an empty array)
   - No `@tauri-apps/api` imports in the file (`grep -v` check or just verify the implementation)

5. **Implement IPC abstraction (`src/services/gsd-client.ts`):**
   ```typescript
   // GSD Client — IPC abstraction layer
   // This is the ONLY file in the frontend that may import @tauri-apps/api.
   // Currently uses no-op implementations. Real Tauri IPC will be wired in M002.
   
   export interface GsdSession {
     id: string;
     startedAt: string;
   }

   export interface CommandResult {
     success: boolean;
     data: unknown;
   }

   export interface ProjectInfo {
     id: string;
     name: string;
     path: string;
   }

   export interface GsdState {
     currentMilestone: string | null;
     activeTasks: number;
     totalCost: number;
   }

   export interface GsdClient {
     startSession: () => Promise<GsdSession>;
     stopSession: () => Promise<void>;
     sendCommand: (command: string, args?: Record<string, unknown>) => Promise<CommandResult>;
     queryState: () => Promise<GsdState>;
     listProjects: () => Promise<ProjectInfo[]>;
   }

   export function createGsdClient(): GsdClient {
     return {
       startSession: async () => ({ id: "no-op", startedAt: new Date().toISOString() }),
       stopSession: async () => {},
       sendCommand: async () => ({ success: true, data: null }),
       queryState: async () => ({ currentMilestone: null, activeTasks: 0, totalCost: 0 }),
       listProjects: async () => [],
     };
   }
   ```
   Run tests — they should pass.

## Must-Haves

- [ ] `zustand` installed in package.json
- [ ] `src/stores/ui-store.ts` exports `useUIStore` with theme, sidebarOpen, activeView state and setTheme, toggleSidebar, setActiveView actions
- [ ] `src/stores/ui-store.ts` exports `Theme`, `View`, `UIState` types
- [ ] `src/services/gsd-client.ts` exports `GsdClient` interface and `createGsdClient()` factory
- [ ] `src/services/gsd-client.ts` has NO `@tauri-apps/api` imports (no-op only, Tauri wiring deferred to M002)
- [ ] All tests pass with TDD discipline (test files written before implementation)

## Verification

- `npm run test` exits 0 (all ui-store and gsd-client tests pass alongside existing tests)
- `! grep -r "@tauri-apps/api" src/services/gsd-client.ts` (no Tauri imports — R032 boundary holds)
- `test -f src/stores/ui-store.ts && test -f src/services/gsd-client.ts` (both files exist)

## Inputs

- `package.json` — current dependencies (from T01 output)
- `vitest.config.ts` — existing test config with @/ alias and jsdom
- `tsconfig.app.json` — existing TypeScript config with @/ paths

## Observability Impact

- **New test signals:** `npm run test` now includes 11 UI store tests and 7 IPC abstraction tests. Failures surface as Vitest assertion errors with the specific state/action that broke.
- **Store state inspection:** `useUIStore.getState()` in browser console returns current theme, sidebarOpen, and activeView — useful for debugging layout and theme issues.
- **IPC boundary check:** `grep -E "^import.*@tauri-apps/api" src/services/gsd-client.ts` should always return exit code 1 (no matches) — any real import means the R032 boundary was violated.
- **Type errors:** `npm run build` surfaces TypeScript errors in store/client type mismatches (e.g., passing invalid View or Theme values).

## Expected Output

- `package.json` — updated with zustand dependency
- `src/stores/ui-store.ts` — new Zustand UI store
- `src/stores/ui-store.test.ts` — new UI store tests
- `src/services/gsd-client.ts` — new IPC abstraction with no-op implementation
- `src/services/gsd-client.test.ts` — new IPC abstraction tests
