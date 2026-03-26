# Knowledge Base

Lessons learned, patterns discovered, and gotchas that save future agents from repeating investigation.

---

## K001: Interactive CLI scaffolders fail in non-TTY environments

**Discovered:** M001/S01 (T01, T02)
**Applies to:** Any `npm create`, `npx @tauri-apps/cli init`, likely `npx shadcn@latest init`

Both `npm create vite` and `npx @tauri-apps/cli init` require interactive terminal input even when flags are provided. In non-TTY environments (agent automation, CI, piped stdin), they fail with errors like "IO error: not a terminal" or hang waiting for input.

**Solution:** Manually scaffold files with known-good patterns. This is reliable and reproducible. Expect the same issue with `npx shadcn@latest init` in S02.

---

## K002: The @/ path alias must be configured in THREE places

**Discovered:** M001/S01 (T01, T03)
**Applies to:** Any new path alias or change to existing alias mapping

The `@/` → `src/` alias is defined in:
1. `tsconfig.app.json` — `baseUrl` + `paths` (for tsc type checking and IDE resolution)
2. `vite.config.ts` — `resolve.alias` (for Vite build and dev server)
3. `vitest.config.ts` — `resolve.alias` (for test runner module resolution)

If any one is out of sync, imports will work in some contexts but break in others. The most common failure mode: tests fail with "Cannot find module '@/...'" while `npm run build` works fine — this means vitest.config.ts is missing the alias.

---

## K003: Tauri devUrl ↔ Vite port must stay in sync

**Discovered:** M001/S01 (T02)
**Applies to:** Any change to Vite server config or Tauri build config

`src-tauri/tauri.conf.json` → `build.devUrl` is hardcoded to `http://localhost:1420`.
`vite.config.ts` → `server.port: 1420` + `server.strictPort: true`.

If someone removes `strictPort` and port 1420 is taken, Vite silently falls back to 1421+, and the Tauri window shows a blank page. The `strictPort: true` setting ensures a fast failure instead.

---

## K004: ESM vite.config.ts has no __dirname — use import.meta.url

**Discovered:** M001/S01 (T01)
**Applies to:** Any ESM module that needs filesystem paths (vite.config.ts, vitest.config.ts)

Node.js ESM modules don't have `__dirname` or `__filename`. TypeScript strict checking catches this. Use:
```ts
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

---

## K006: shadcn CLI creates literal `@/` directory on Windows instead of resolving alias

**Discovered:** M001/S02 (T01)
**Applies to:** Running `npx shadcn@latest add` in any project where the `@/` alias points to `src/`

When `npx shadcn@latest add button tooltip badge` runs, it creates files at `./@/components/ui/` — a literal directory named `@` — instead of resolving the alias to `src/components/ui/`. The CLI output shows `@\components\ui\button.tsx` which looks correct but is actually a filesystem path with a literal `@` folder.

**Solution:** After running the CLI, move the files: `mv ./@/components/ui/*.tsx src/components/ui/` and then `rm -rf ./@`. Alternatively, the `shadcn` package now offers `@import "shadcn/tailwind.css"` for the CSS theme — using the `shadcn` npm package is the recommended approach.

---

## K007: shadcn/ui v4 manual install requires `shadcn` npm package

**Discovered:** M001/S02 (T01)
**Applies to:** Setting up shadcn/ui with Tailwind CSS v4

The official shadcn/ui manual installation docs now specify `@import "shadcn/tailwind.css"` in globals.css, which requires the `shadcn` npm package. The dependency list is: `shadcn class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`. The `shadcn` package provides the base Tailwind CSS theme file that components depend on.

Also, `--destructive-foreground` should be included in both `:root` and `.dark` for completeness — the theming docs show it in both, even though the manual install page's `:root` block may omit it.

---

## K008: Zustand setState(data, true) drops action functions in tests

**Discovered:** M001/S02 (T02)
**Applies to:** Any Zustand store testing with `beforeEach` reset

Calling `useUIStore.setState(initialState, true)` with the `replace` flag set to `true` replaces the entire store state object, which drops the action functions (setTheme, toggleSidebar, etc.) created by `create()`. This causes `getState().actionName is not a function` errors.

**Solution:** Use `useUIStore.setState({ theme: "system", sidebarOpen: true, activeView: "chat" })` without the `replace` flag — this merges the data properties while preserving the action functions.

---

## K009: jsdom has no matchMedia — tests rendering ThemeProvider need a mock

**Discovered:** M001/S02 (T03)
**Applies to:** Any test file that renders components inside ThemeProvider (which is everything from S03 onward since App.tsx wraps with ThemeProvider)

ThemeProvider uses `window.matchMedia("(prefers-color-scheme: dark)")` to detect the system theme. jsdom doesn't implement `matchMedia`, so any test rendering inside ThemeProvider will fail with `TypeError: window.matchMedia is not a function`.

**Solution:** Add a `beforeEach` mock in every test file that renders through ThemeProvider:
```ts
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
```
Alternatively, create a shared test utility that wraps components in ThemeProvider with the mock pre-applied.

---

## K010: jsdom has no ResizeObserver — Radix UI Popper components crash without a global mock

**Discovered:** M001/S03 (T02)
**Applies to:** Any test rendering shadcn/ui components that use Radix UI Popper internally (tooltips, popovers, dropdown menus, SidebarMenuButton with tooltip prop)

Radix UI's Popper component uses `ResizeObserver` via its `useSize` hook to track element dimensions. jsdom doesn't implement `ResizeObserver`, causing `ReferenceError: ResizeObserver is not defined` when rendering components like SidebarMenuButton (which wraps Radix tooltip), Popover, DropdownMenu, etc.

**Solution:** Add a global mock in `src/test/setup.ts`:
```ts
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
```
This is now in the global test setup — no per-file mocking needed.

---

## K011: Radix Slot composition breaks onClick-based Zustand sync — use useEffect on location instead

**Discovered:** M001/S03 (T02)
**Applies to:** Any component that needs to sync Zustand state with react-router navigation when using Radix UI components (SidebarMenuButton with `asChild`, Slot-based composition)

When SidebarMenuButton uses `asChild` to render a react-router `<Link>`, click events go through Radix's Slot composition layer. Adding `onClick` handlers to the Link or wrapping element for Zustand sync can conflict with Radix's event handling, especially in tests where jsdom's event model differs from real browsers.

**Solution:** Sync Zustand `activeView` via `useEffect` watching `location.pathname`:
```ts
const location = useLocation();
const setActiveView = useUIStore((s) => s.setActiveView);
useEffect(() => {
  const match = navItems.find((item) => item.path === location.pathname);
  if (match) setActiveView(match.view);
}, [location.pathname, setActiveView]);
```
This also catches programmatic navigation (e.g., `navigate('/chat')`) that onClick would miss.

---

## K012: Heading role queries need `level: 1` when pages have sub-headings

**Context:** When page components contain `<h2>` sub-headings (e.g., "Active Projects"), `screen.getByRole("heading", { name: /projects/i })` matches multiple elements and throws. This broke tests in `router.test.tsx`, `app-shell.test.tsx`, and `pages.test.tsx` after enriching placeholder pages.

**Fix:** Always use `{ level: 1 }` when querying for a page's main heading:
```tsx
screen.getByRole("heading", { level: 1, name: /projects/i })
```

**Impact:** Any future page enrichment that adds `<h2>`+ headings will trigger the same issue in any test using bare `getByRole("heading", { name: ... })`.

---

## K013: M001 test count baseline is 97 across 11 files

**Discovered:** M001 milestone close
**Applies to:** Any future slice or milestone modifying existing components

The M001 app shell established 97 tests across 11 test files as the baseline. Test files:
- `src/App.test.tsx` (3 tests)
- `src/components/app-shell/app-shell.test.tsx` (8 tests)
- `src/components/mode-toggle/mode-toggle.test.tsx` (6 tests)
- `src/components/status-bar/status-bar.test.tsx` (4 tests)
- `src/components/theme-provider.test.tsx` (10 tests)
- `src/components/ui/button.test.tsx` (5 tests)
- `src/lib/utils.test.ts` (6 tests)
- `src/pages/__tests__/pages.test.tsx` (28 tests)
- `src/router.test.tsx` (9 tests)
- `src/services/gsd-client.test.ts` (7 tests)
- `src/stores/ui-store.test.ts` (11 tests)

If the test count drops below 97 after any change, something was broken. Run `npm run test -- --run` and compare.

---

## K014: Production build size baseline — 403 kB JS, 50 kB CSS

**Discovered:** M001 milestone close
**Applies to:** Bundle size monitoring in future milestones

M001's production build output:
- JS: 402.59 kB (123.63 kB gzip)
- CSS: 50.20 kB (8.89 kB gzip)
- HTML: 0.39 kB

This is the empty shell with shadcn/ui + React + react-router + Zustand. Significant jumps should be investigated — especially if adding heavy dependencies like Recharts (M004) or TanStack Query (M002).

---

## K015: Ghost milestone directories cause GSD auto-mode to deadlock after milestone completion

**Discovered:** Post-M001 milestone transition
**Applies to:** Any milestone boundary — especially when a previous session crashed or was killed mid-discussion

After M001 completed, GSD's guided flow created an `M002/` directory (with only an empty `slices/` subfolder) during the discuss workflow. The discuss session was killed before it could write `M002-CONTEXT.md`. This left a "ghost" milestone — a directory that `findMilestoneIds()` discovers but `isGhostMilestone()` skips (no CONTEXT, CONTEXT-DRAFT, ROADMAP, or SUMMARY). The result:
- `deriveState()` sees only M001 (complete) → phase = "complete"
- Guided flow shows "Start new milestone" and tries to create M002 again
- But M002 directory already exists, so `nextMilestoneId()` returns M003 instead
- Or the discuss workflow hangs because `checkAutoStartAfterDiscuss()` waits for CONTEXT.md that no session is producing

**Symptoms:** Auto-mode appears stuck for 10+ minutes after milestone completion. Dashboard shows no progress. No activity logs are written.

**Recovery procedure:**
1. `rm -rf .gsd/milestones/M00X/` (the ghost directory)
2. `echo '[]' > .gsd/completed-units.json` (clear stale M001 entries)
3. Rebuild STATE.md or delete it (GSD regenerates on next run)
4. Remove orphaned worktrees: `rm -rf .gsd/worktrees/M00X/` (if git doesn't list them in `git worktree list`)
5. Run `npm install` if node_modules was lost
6. Run `/gsd auto` — should cleanly offer "Start new milestone"

**Root cause:** GSD bug — the discuss workflow's `dispatchWorkflow()` creates the milestone directory structure before the LLM writes CONTEXT.md. If the session dies between directory creation and file write, the ghost persists. Filed as upstream issue.

---

## K016: After milestone completion, always verify clean state before starting next milestone

**Discovered:** Post-M001 transition
**Applies to:** Every milestone boundary

Before starting work on a new milestone, verify:
1. Previous milestone has SUMMARY.md (truly complete)
2. No ghost directories exist in `.gsd/milestones/` (dirs without CONTEXT/ROADMAP/SUMMARY)
3. `completed-units.json` is empty or only contains current milestone entries
4. No orphaned worktrees in `.gsd/worktrees/` (check with `git worktree list`)
5. No stale `auto.lock` file
6. `node_modules/` exists (run `npm install` if missing)

If any of these are wrong, fix them before running `/gsd auto`.

---

## K017: MSVC toolchain on this machine requires manual env setup for Rust builds

**Discovered:** M002/S01 (T01)
**Applies to:** Any `cargo build` or `cargo test` in the src-tauri crate

The VS 18 installation at `C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.50.35717\` is incomplete — it has `bin/` and `lib/onecore/` but no `include/` directory. The linker finds `link.exe` but can't find `msvcrt.lib` (wrong lib path) and the compiler can't find `excpt.h` (no include dir).

**Working toolchain:** VS2022 BuildTools at `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\` has complete include/, lib/x64/, and bin/ directories.

**Required env vars before any cargo command:**
```bash
MSVC_ROOT="C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Tools/MSVC/14.44.35207"
SDK_ROOT="C:/Program Files (x86)/Windows Kits/10"
SDK_VER="10.0.26100.0"
export INCLUDE="${MSVC_ROOT}/include;${SDK_ROOT}/include/${SDK_VER}/ucrt;${SDK_ROOT}/include/${SDK_VER}/um;${SDK_ROOT}/include/${SDK_VER}/shared"
export LIB="${MSVC_ROOT}/lib/x64;${SDK_ROOT}/Lib/${SDK_VER}/ucrt/x64;${SDK_ROOT}/Lib/${SDK_VER}/um/x64"
export PATH="${MSVC_ROOT}/bin/Hostx64/x64:${PATH}"
```

Without these, you get `LNK1104: cannot open file 'msvcrt.lib'` or `fatal error C1083: Cannot open include file: 'excpt.h'`.

---

## K018: Tauri build script requires icon files even for `cargo test --lib`

**Discovered:** M002/S01 (T01)
**Applies to:** Any Tauri project where icons haven't been generated yet

`tauri-build` (the build.rs dependency) checks for `icons/icon.ico` and fails the entire build — including `cargo test --lib` — if it's missing. The build script runs before any test compilation.

**Solution:** Create placeholder icons in `src-tauri/icons/`. Even minimal valid PNG/ICO files work. Use `tauri icon` CLI to generate proper ones later, or generate minimal files programmatically.

---

## K019: Tauri v2 requires `tauri::Emitter` trait for `.emit()` on AppHandle

**Discovered:** M002/S01 (T02)
**Applies to:** Any Rust code that calls `app_handle.emit()` or `window.emit()` in Tauri v2

In Tauri v2, the `.emit()` method is on the `Emitter` trait, not directly on `AppHandle`. You must `use tauri::Emitter;` — NOT `tauri::Manager` (which was used in Tauri v1). The compiler error says "items from traits can only be used if the trait is in scope" and suggests importing `Emitter`.

```rust
use tauri::Emitter; // Required for .emit() in Tauri v2
```

---

## K020: `cargo test` must run from `src-tauri/`, not the project root

**Discovered:** M002/S01 (verification gate)
**Applies to:** Any `cargo test` or `cargo build` in the Tauri project

The `Cargo.toml` is at `src-tauri/Cargo.toml`, not the project root. Running `cargo test` from the project root fails with "could not find Cargo.toml". Always `cd src-tauri` first, or use `cargo test --manifest-path src-tauri/Cargo.toml`.

Verification gates that run `cargo test` from the worktree root will fail. The correct command is `cd src-tauri && cargo test`.

---

## K017: std::sync::Mutex required in notify-rs callbacks — tokio::sync::Mutex causes panics

**Discovered:** M002/S02 (T02)
**Applies to:** Any code running inside a notify-rs event handler callback

notify-rs event handlers run on a non-tokio thread. Using `tokio::sync::Mutex` in a notify callback panics because there's no tokio runtime on that thread. Use `std::sync::Mutex` for any shared state accessed from notify callbacks. This applies both to production code (the debounce channel sender) and test collectors (`Arc<StdMutex<Vec<T>>>`).

---

## K018: Full `cargo test` requires VS Build Tools environment on Windows

**Discovered:** M002/S02 (closing verification)
**Applies to:** Running `cargo test` (without `--lib`) in the Tauri project on Windows

`cargo test` (which includes integration and doc tests) triggers compilation of `vswhom-sys` which requires C++ compilation via MSVC. Running outside a VS Developer Command Prompt results in `fatal error C1083: Cannot open include file: 'excpt.h'`. Use `cargo test --lib` to run only library unit tests without requiring the full VS Build Tools environment. This is sufficient for verifying Rust module logic.

## K-M002-01: mpsc channels for async child process stdin

Using `tokio::sync::mpsc` for writing to a child process's stdin is cleaner than `Arc<Mutex<ChildStdin>>`. The sender can be cloned and used from any async task without contention. See D015, gsd_process.rs.

## K-M002-02: Manual tokio debounce over notify-debouncer-mini

For file watcher debounce, a manual approach (tokio unbounded channel + 500ms sleep + drain) gives more control than notify-debouncer-mini and avoids an extra dependency. See D016, gsd_watcher.rs.

## K-M002-03: vi.mock() in helper functions triggers Vitest warnings

Calling `vi.mock()` inside a helper function (like setupTauriMocks()) works but Vitest warns it's not at module top level. This will become an error in a future Vitest version. Refactor to top-level vi.mock() before upgrading.

## K-M002-04: Shared TypeScript types for IPC boundary

Creating a dedicated src/lib/types.ts that mirrors Rust serde structs (with matching camelCase field names) prevents drift between backend and frontend. Both gsd-client.ts and future consumers import from this single source of truth.

---

## K-M002-05: vi.hoisted() required when mocking modules consumed at store module scope

**Discovered:** M002/S04
**Applies to:** Any test file that mocks a module imported by a Zustand store created at module level

When a store calls `createGsdClient()` at module scope (outside `create()`), the mock must be available before the module executes. Using `const { mockClient } = vi.hoisted(() => { ... })` ensures the mock object exists before `vi.mock()` hoists the factory. Without `vi.hoisted()`, the mock variable is `undefined` when the store module loads, causing "Cannot access before initialization" errors.

```ts
const { mockClient } = vi.hoisted(() => {
  const mockClient = { /* mock methods */ };
  return { mockClient };
});
vi.mock("@/services/gsd-client", () => ({ createGsdClient: () => mockClient }));
```

---

## K-M002-06: Test-utils wrapper must include ALL providers or component tests fail

**Discovered:** M002/S06
**Applies to:** Any new provider added to App.tsx

When QueryClientProvider was added to App.tsx, test-utils.tsx also needed it in renderWithProviders(). Components rendered via test-utils that use TanStack Query hooks would get "No QueryClient set" errors otherwise. Any future provider added to App.tsx (e.g. Jotai Provider, i18n) must also be added to test-utils.tsx.

---

## K-GLOBAL-01: NEVER commit directly to main — all work on feature branches

**Discovered:** Post-M002 (user mandate)
**Applies to:** ALL development, no exceptions

The `main` branch is protected. All development must happen on feature/milestone branches (e.g. `develop`, `milestone/M003`). Only merge commits from completed, tested branches go to main. This is a non-revisable decision (D007).

**Workflow:**
1. Create branch from main: `git checkout -b develop` or `git checkout -b milestone/M003`
2. Do all work on that branch
3. When milestone is complete and verified, merge to main via PR or merge commit
4. Push main

**If you find yourself on main:** `git checkout -b <branch>` immediately before making any changes.

---

## K-M005-01: ProToolPanel wrapper pattern scales well

**Discovered:** M005 S01-S03
**Applies to:** Any new Pro Tools panel

Establishing a consistent wrapper component (ProToolPanel with loading/error/retry/empty/ready states) early allowed 19 panels to be built rapidly with consistent UX. New panels should follow the same Card+Badge pattern inside ProToolPanel.

---

## K-M005-02: Zustand + useRef for toast deduplication

**Discovered:** M005 S04
**Applies to:** Any hook that reacts to store state changes

When subscribing to Zustand stores to fire side effects (toasts, analytics), track previous state via useRef to prevent duplicate firings on re-renders. Pattern: compare current vs previous in useEffect, update ref after processing.

---

## K-M005-03: Playwright webServer auto-start for CI

**Discovered:** M005 S05
**Applies to:** E2E test configuration

Playwright's webServer config auto-starts the Vite dev server, eliminating manual server startup in CI. Shared fixtures (e2e/fixtures.ts) with appReady helpers make each spec file independent and fast to write.

---

## K-M006-01: Tauri command functions must have distinct names from library functions

**Discovered:** M006/S01 (T01)
**Applies to:** Any new Tauri command that wraps a library function

Tauri's `#[tauri::command]` macro generates handler code based on the function name. If the command function has the same name as the library function it wraps, you get a name collision. Solution: suffix the command function with `_cmd` (e.g. `parse_project_milestones_cmd` wrapping `parse_project_milestones`). The frontend still invokes the Rust function name without the suffix — Tauri uses snake_case function name as the command ID.

---

## K-M006-02: .gsd parser uses multi-signal status derivation for accuracy

**Discovered:** M006/S01 (T01)
**Applies to:** Any code that needs to determine task/slice/milestone completion status

A single signal (checkbox state) is unreliable — plan checkboxes may not be updated after task completion. The parser combines three signals:
1. **Checkbox state** in ROADMAP.md/PLAN.md (`[x]` vs `[ ]`)
2. **SUMMARY.md file existence** (a task with a summary is done even if the checkbox is unchecked)
3. **SUMMARY.md frontmatter** (`status: complete` in milestone summaries overrides derived status)

This catches the common race condition where GSD marks a task complete but the plan checkbox isn't updated.

---

## K-M006-03: Fetch generation ref pattern for stale response discarding

**Discovered:** M006/S02 (T01)
**Applies to:** Any hook that fetches data based on changing Zustand state (e.g. active project switching)

Tauri's `invoke()` doesn't support `AbortController`. When a user rapidly switches projects, stale IPC responses can overwrite newer data. Solution: maintain a `useRef<number>` incremented on each fetch. When the response arrives, compare the current ref value to the value captured at fetch time — if they differ, discard the response.

```ts
const fetchGenRef = useRef(0);
useEffect(() => {
  const gen = ++fetchGenRef.current;
  client.parseProjectMilestones(path).then(data => {
    if (gen === fetchGenRef.current) setMilestones(data);
  });
}, [path]);
```

---

## K-M006-04: M006 test count baseline is 381 frontend + 35 Rust

**Discovered:** M006 milestone close
**Applies to:** Any future milestone modifying existing components or parsers

M006 established 381 frontend tests across 55 files and 35 Rust parser tests as the baseline. If counts drop after any change, something was broken.
