# S02 UAT: shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction

## Preconditions

- Node.js 18+ installed
- Working directory: project root
- `npm install` has been run (node_modules exists)
- S01 artifacts are in place (vite.config.ts, tsconfig.app.json, src-tauri/, etc.)

---

## Test 1: Production build succeeds with Tailwind CSS 4

**Steps:**
1. Run `npm run build`
2. Check exit code is 0
3. Check output includes CSS and JS bundle sizes

**Expected:**
- Exit code: 0
- Output includes `assets/index-*.css` with non-zero size (~22 kB)
- Output includes `assets/index-*.js` with non-zero size (~226 kB)
- No TypeScript errors, no Tailwind CSS parse errors, no missing module errors in output

**Why:** Proves Tailwind CSS 4 + @tailwindcss/vite plugin compiles correctly with all CSS variables, shadcn/ui components type-check, and the full dependency chain resolves.

---

## Test 2: All 41 tests pass

**Steps:**
1. Run `npm run test`
2. Check exit code is 0

**Expected:**
- Exit code: 0
- 6 test files, 41 tests total
- Breakdown: utils (6), button (5), theme-provider (10), App (2), ui-store (11), gsd-client (7)
- No skipped or failing tests

**Why:** Proves every module delivered in this slice has tested contracts.

---

## Test 3: globals.css contains Tailwind imports and CSS variables

**Steps:**
1. Open `src/styles/globals.css`
2. Check for `@import "tailwindcss"`
3. Check for `@import "tw-animate-css"`
4. Check for `@import "shadcn/tailwind.css"`
5. Check for `@theme inline` block
6. Check for `:root` block with CSS variables (e.g. `--background`, `--foreground`, `--primary`)
7. Check for `.dark` block with dark mode CSS variables
8. Check for `@layer base` block

**Expected:**
- All three imports present at top of file
- `@theme inline` block maps CSS variables to Tailwind utilities
- `:root` block defines ~30 oklch color variables
- `.dark` block overrides same variables for dark mode
- `@layer base` applies base styles to `*`, `body`, etc.

**Why:** The CSS variable theme is the foundation of all shadcn/ui component styling.

---

## Test 4: components.json is correctly configured for Vite + Tailwind v4

**Steps:**
1. Open `components.json` at project root
2. Check `rsc` is `false`
3. Check `tailwind.config` is empty string (v4 mode — no tailwind.config.js)
4. Check `tailwind.css` points to `src/styles/globals.css`
5. Check `aliases.components` is `@/components`
6. Check `aliases.utils` is `@/lib/utils`

**Expected:**
- All fields match shadcn/ui Vite configuration docs
- No `tailwind.config` path (Tailwind v4 uses CSS-first config)

**Why:** Incorrect components.json causes `npx shadcn@latest add` to fail or generate files in wrong locations.

---

## Test 5: shadcn/ui Button renders with correct variants

**Steps:**
1. Run `npx vitest run src/components/ui/button.test.tsx --reporter=verbose`
2. Verify the following tests pass:
   - Renders a button with default variant
   - Has correct role
   - Renders with destructive variant
   - Renders with sm size
   - Supports asChild pattern

**Expected:**
- All 5 tests pass
- Button component uses `class-variance-authority` for variant classes
- Button component renders as `<button>` element by default

**Why:** Button is the baseline shadcn/ui component — if it renders correctly, the CSS variable system and component patterns work.

---

## Test 6: cn() utility merges and deduplicates Tailwind classes

**Steps:**
1. Run `npx vitest run src/lib/utils.test.ts --reporter=verbose`
2. Verify these behaviors are tested:
   - Merges multiple class strings
   - Handles conditional classes via clsx
   - Resolves Tailwind conflicts (e.g. `p-4` + `p-2` → `p-2`)
   - Handles undefined/null/empty inputs

**Expected:**
- All 6 tests pass
- `cn("p-4", "p-2")` returns `"p-2"` (tailwind-merge resolves conflict)

**Why:** cn() is used by every shadcn/ui component — incorrect merging would cause styling bugs.

---

## Test 7: Zustand UI store manages theme, sidebar, and active view state

**Steps:**
1. Run `npx vitest run src/stores/ui-store.test.ts --reporter=verbose`
2. Verify:
   - Initial state: `theme: "system"`, `sidebarOpen: true`, `activeView: "chat"`
   - `setTheme("dark")` changes theme to "dark"
   - `toggleSidebar()` flips sidebarOpen from true to false
   - `setActiveView("settings")` changes activeView

**Expected:**
- All 11 tests pass
- Store exports `useUIStore` hook and `Theme`, `View`, `UIState` types

**Why:** S03/S04 depend on the UI store for sidebar state and view switching.

---

## Test 8: IPC abstraction has all required methods with no-op implementations

**Steps:**
1. Run `npx vitest run src/services/gsd-client.test.ts --reporter=verbose`
2. Verify `createGsdClient()` returns an object with:
   - `startSession()` — returns a session object
   - `stopSession()` — completes without error
   - `sendCommand()` — returns a command result
   - `queryState()` — returns a state object or null
   - `listProjects()` — returns an array

**Expected:**
- All 7 tests pass
- All methods are async and return sensible defaults (empty arrays, null states)

**Why:** R032 — this is the single file that will contain Tauri IPC calls in M002. No-op stubs now, real wiring later.

---

## Test 9: No @tauri-apps/api imports exist outside gsd-client.ts

**Steps:**
1. Run `grep -rE "^import.*@tauri-apps/api" src/`
2. Check exit code

**Expected:**
- Exit code: 1 (no matches found)
- Zero lines of output

**Why:** R032 boundary enforcement — if any component or store imports Tauri directly, the Electron escape hatch is compromised.

---

## Test 10: ThemeProvider applies theme classes and persists to localStorage

**Steps:**
1. Run `npx vitest run src/components/theme-provider.test.tsx --reporter=verbose`
2. Verify:
   - ThemeProvider renders children
   - `useTheme()` returns `theme` and `setTheme`
   - Default theme is "system"
   - `setTheme("dark")` adds "dark" class to `document.documentElement`
   - Theme persists to `localStorage("gsd-gui-theme")`
   - Reads persisted theme on mount
   - System theme detected via `matchMedia`
   - `useTheme()` throws when used outside ThemeProvider

**Expected:**
- All 10 tests pass

**Why:** ThemeProvider is consumed by every page — S04 builds the toggle UI on top of it.

---

## Test 11: App.tsx wraps content with ThemeProvider and renders Button

**Steps:**
1. Run `npx vitest run src/App.test.tsx --reporter=verbose`
2. Verify:
   - App renders without errors
   - A shadcn/ui Button renders inside the ThemeProvider

**Expected:**
- Both tests pass
- The Button has role="button" in the DOM

**Why:** Proves the entire S02 stack composes correctly: Tailwind CSS → shadcn/ui → ThemeProvider → React app.

---

## Test 12: Tooltip and Badge components exist and are importable

**Steps:**
1. Check `src/components/ui/tooltip.tsx` exists
2. Check `src/components/ui/badge.tsx` exists
3. Run `npm run build` to confirm they type-check correctly

**Expected:**
- Both files exist
- Build passes (no type errors from these components)

**Why:** S03 will use Tooltip and Badge in the sidebar and status bar.

---

## Edge Cases

### E1: Build with missing CSS variables
If any CSS variable referenced by a shadcn/ui component is missing from globals.css, the build still succeeds (CSS variables fall back to unset). Check by running `npm run build` and inspecting the CSS output for `var(--` references that aren't defined in globals.css.

### E2: Store state reset between tests
Tests must not leak state between runs. Each Zustand test file should reset state in `beforeEach`. If tests pass individually but fail when run together, check for missing state reset (use `setState(data)` without replace flag — K008).

### E3: matchMedia not available in jsdom
Any test rendering ThemeProvider without a `matchMedia` mock will fail with a TypeError. The mock must be set in `beforeEach`:
```js
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation(query => ({ matches: false, media: query, ... }))
});
```
