---
id: T01
parent: S02
milestone: M001
provides:
  - Tailwind CSS 4 configured with @tailwindcss/vite plugin
  - shadcn/ui initialized with components.json for Vite
  - globals.css with full CSS variable theme (light + dark, neutral base)
  - cn() utility function
  - Button, Tooltip, Badge shadcn/ui components
  - Tests for cn() and Button rendering
key_files:
  - src/styles/globals.css
  - src/lib/utils.ts
  - src/components/ui/button.tsx
  - src/components/ui/tooltip.tsx
  - src/components/ui/badge.tsx
  - components.json
  - vite.config.ts
  - src/main.tsx
key_decisions:
  - Used shadcn npm package with @import "shadcn/tailwind.css" per official manual install docs
  - Kept "new-york" style in components.json (CLI accepted it and generated correct components)
patterns_established:
  - shadcn/ui components live in src/components/ui/ with radix-ui unified imports
  - CSS theming via CSS variables in globals.css with @theme inline mapping to Tailwind utilities
observability_surfaces:
  - npm run build validates Tailwind CSS 4 compilation (CSS parse errors surface as vite:css errors)
  - npm run test covers cn() utility and Button component rendering
duration: 15m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Install Tailwind CSS 4 + shadcn/ui with baseline components and verified styling

**Installed Tailwind CSS 4 with @tailwindcss/vite plugin, configured shadcn/ui with full neutral theme CSS variables, and added Button/Tooltip/Badge components with passing tests.**

## What Happened

1. Installed all required npm dependencies: `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority`, `radix-ui`, and `shadcn` (the `shadcn` package was added because the official manual install now uses `@import "shadcn/tailwind.css"`).

2. Added `tailwindcss()` plugin to `vite.config.ts` after the `react()` plugin, without modifying port, strictPort, or resolve.alias.

3. Created `src/styles/globals.css` with the full shadcn/ui CSS variable theme from official docs: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@custom-variant dark`, `@theme inline` block mapping all colors/radius/sidebar variables, `:root` and `.dark` blocks with oklch color values, and `@layer base` styles.

4. Updated `src/main.tsx` to import `@/styles/globals.css` instead of `@/App.css`.

5. Created `components.json` at project root with `rsc: false`, empty `tailwind.config` (Tailwind v4), and `@/` aliases.

6. Created `src/lib/utils.ts` with the `cn()` utility combining `clsx` and `tailwind-merge`.

7. Ran `npx shadcn@latest add button tooltip badge --yes --overwrite` — the CLI succeeded but created files in a literal `./@/components/ui/` directory instead of `src/components/ui/`. Moved the files to the correct location (K006).

8. Wrote tests: `src/lib/utils.test.ts` (6 tests for cn() merging, conditionals, Tailwind conflict resolution) and `src/components/ui/button.test.tsx` (5 tests for rendering, role, variants, sizes, asChild).

## Verification

- `npm run build` exits 0 — tsc + Vite + Tailwind CSS 4 all compile successfully (194.54 kB JS, 21.43 kB CSS)
- `npm run test` exits 0 — 12 tests pass across 3 files (utils: 6, App: 1, Button: 5)
- `test -f components.json` — PASS
- `test -f src/components/ui/button.tsx && test -f src/components/ui/tooltip.tsx && test -f src/components/ui/badge.tsx` — PASS
- `grep -q "@import" src/styles/globals.css` — PASS

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 1.59s |
| 2 | `npm run test` | 0 | ✅ pass | 4.80s |
| 3 | `test -f components.json` | 0 | ✅ pass | <1s |
| 4 | `test -f src/components/ui/button.tsx && test -f src/components/ui/tooltip.tsx && test -f src/components/ui/badge.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "@import" src/styles/globals.css` | 0 | ✅ pass | <1s |
| 6 | `test -f src/styles/globals.css` | 0 | ✅ pass | <1s |
| 7 | `test -f src/stores/ui-store.ts` | 1 | ⏳ expected (T02) | <1s |
| 8 | `test -f src/services/gsd-client.ts` | 1 | ⏳ expected (T02) | <1s |
| 9 | `test -f src/components/theme-provider.tsx` | 1 | ⏳ expected (T03) | <1s |

## Diagnostics

- `npm run build 2>&1 | tail -5` — shows Vite build summary; any Tailwind CSS parse errors would appear here
- `grep -c "oklch" src/styles/globals.css` — confirms all CSS variable values use oklch color space (should be ~56)
- `cat components.json` — shows shadcn/ui config state (style, rsc, aliases)
- Component type errors surface as `TS2307` in `npm run build` output

## Deviations

- **Added `shadcn` npm package:** The official manual install docs now require `@import "shadcn/tailwind.css"` in globals.css, which needs the `shadcn` npm package. The task plan didn't include it in the install list.
- **shadcn CLI path issue (K006):** The CLI created files at `./@/components/ui/` instead of `src/components/ui/`. Moved files manually after CLI run.
- **Added `--destructive-foreground` to both `:root` and `.dark`:** The theming docs show it in both scopes; included for completeness.

## Known Issues

None.

## Files Created/Modified

- `package.json` — updated with tailwindcss, @tailwindcss/vite, tw-animate-css, clsx, tailwind-merge, lucide-react, class-variance-authority, radix-ui, shadcn
- `vite.config.ts` — added @tailwindcss/vite import and tailwindcss() plugin
- `src/styles/globals.css` — new file with Tailwind imports, @theme inline, CSS variables, base layer
- `src/lib/utils.ts` — new cn() utility
- `src/lib/utils.test.ts` — new cn() tests (6 tests)
- `components.json` — new shadcn/ui config for Vite
- `src/components/ui/button.tsx` — shadcn/ui Button component
- `src/components/ui/button.test.tsx` — Button render tests (5 tests)
- `src/components/ui/tooltip.tsx` — shadcn/ui Tooltip component
- `src/components/ui/badge.tsx` — shadcn/ui Badge component
- `src/main.tsx` — updated import from @/App.css to @/styles/globals.css
- `.gsd/milestones/M001/slices/S02/S02-PLAN.md` — added Observability / Diagnostics section
- `.gsd/milestones/M001/slices/S02/tasks/T01-PLAN.md` — added Observability Impact section
- `.gsd/KNOWLEDGE.md` — added K006 (shadcn CLI path issue) and K007 (shadcn npm package)
