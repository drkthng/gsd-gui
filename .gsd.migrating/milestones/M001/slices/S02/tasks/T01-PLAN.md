---
estimated_steps: 8
estimated_files: 12
skills_used: []
---

# T01: Install Tailwind CSS 4 + shadcn/ui with baseline components and verified styling

**Slice:** S02 — shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction
**Milestone:** M001

## Description

Install and configure Tailwind CSS 4 with the official Vite plugin, set up shadcn/ui with components.json for a Vite project, create the `cn()` utility, create `globals.css` with full CSS variable theme, and install the Button, Tooltip, and Badge components. This is the highest-risk task in the slice — Tailwind CSS 4 uses a new CSS-first configuration approach (`@theme inline`, `@import "tailwindcss"`) instead of the old `tailwind.config.js`, and shadcn/ui must be configured to match.

**Critical knowledge from S01 (K001):** Interactive CLI scaffolders fail in non-TTY environments. `npx shadcn@latest init` and `npx shadcn@latest add` may fail the same way `npm create vite` did. Be prepared to manually scaffold `components.json` and component files if the CLI doesn't work.

**Critical knowledge from S01 (K002):** The `@/` path alias is configured in THREE places: `tsconfig.app.json`, `vite.config.ts`, and `vitest.config.ts`. All must stay in sync. The new `@tailwindcss/vite` plugin is added to `vite.config.ts` only.

## Steps

1. **Install npm dependencies:** `npm install tailwindcss @tailwindcss/vite tw-animate-css clsx tailwind-merge lucide-react class-variance-authority radix-ui`. These are the packages required by Tailwind CSS 4 + shadcn/ui components.

2. **Add Tailwind CSS Vite plugin to `vite.config.ts`:** Import `tailwindcss from "@tailwindcss/vite"` and add `tailwindcss()` to the plugins array (after `react()`). Do NOT change the port, strictPort, or resolve.alias — those must stay as-is from S01.

3. **Create `src/styles/globals.css`:** This file replaces `src/App.css` as the main stylesheet. Contents:
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";

   @custom-variant dark (&:is(.dark *));

   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
     /* ... all shadcn/ui color mappings ... */
     --radius-sm: calc(var(--radius) * 0.6);
     /* ... all radius mappings ... */
     --color-sidebar: var(--sidebar);
     /* ... all sidebar color mappings ... */
   }

   :root {
     --radius: 0.625rem;
     --background: oklch(1 0 0);
     /* ... all light mode CSS variable values using oklch ... */
   }

   .dark {
     --background: oklch(0.145 0 0);
     /* ... all dark mode CSS variable values using oklch ... */
   }

   @layer base {
     * {
       @apply border-border outline-ring/50;
     }
     body {
       @apply bg-background text-foreground;
     }
   }
   ```
   Use the EXACT values from the shadcn/ui manual installation docs (neutral base color). Include the full set: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1 through chart-5, sidebar variants, and radius scale.

4. **Update `src/main.tsx`:** Change `import "@/App.css"` to `import "@/styles/globals.css"`. This wires the new stylesheet into the app.

5. **Create `components.json` at project root:** This configures the shadcn CLI for component installation.
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/styles/globals.css",
       "baseColor": "neutral",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "@/components",
       "utils": "@/lib/utils",
       "ui": "@/components/ui",
       "lib": "@/lib",
       "hooks": "@/hooks"
     },
     "iconLibrary": "lucide"
   }
   ```
   Note: `tailwind.config` is empty string for Tailwind CSS v4 (no config file needed). `rsc: false` because this is a Vite/Tauri app, not Next.js.

6. **Create `src/lib/utils.ts`:**
   ```typescript
   import { clsx, type ClassValue } from "clsx";
   import { twMerge } from "tailwind-merge";

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```

7. **Install shadcn/ui components (Button, Tooltip, Badge):** Try `npx shadcn@latest add button tooltip badge --yes --overwrite` first. If it fails (non-TTY), manually create the component files:
   - `src/components/ui/button.tsx` — shadcn/ui Button using `cva` from `class-variance-authority`, `Slot` from `radix-ui`, and `cn` from `@/lib/utils`
   - `src/components/ui/tooltip.tsx` — shadcn/ui Tooltip wrapping Radix Tooltip primitives
   - `src/components/ui/badge.tsx` — shadcn/ui Badge using `cva`
   
   Each component should use the standard shadcn/ui source code patterns. The key import for radix primitives in shadcn/ui v4 is from `"radix-ui"` (unified package), not individual `@radix-ui/*` packages.

8. **Write tests (TDD — write test file first, then verify it passes after implementation):**
   - `src/lib/utils.test.ts` — test `cn()`: merges multiple classes, handles conditional classes, resolves Tailwind conflicts (e.g., `cn("px-2", "px-4")` returns `"px-4"`)
   - `src/components/ui/button.test.tsx` — test Button renders, has correct role, accepts variant prop, renders children text

## Must-Haves

- [ ] `tailwindcss` and `@tailwindcss/vite` installed and Vite plugin registered
- [ ] `src/styles/globals.css` has `@import "tailwindcss"`, `@theme inline` block, `:root` and `.dark` CSS variables, and `@layer base` styles
- [ ] `components.json` exists at project root with correct Vite configuration
- [ ] `src/lib/utils.ts` exports `cn()` function
- [ ] `src/components/ui/button.tsx`, `tooltip.tsx`, `badge.tsx` exist
- [ ] `src/main.tsx` imports `@/styles/globals.css` (not `@/App.css`)
- [ ] `npm run build` passes
- [ ] `npm run test` passes with cn() and Button render tests

## Verification

- `npm run build` exits 0 (proves tsc + Vite + Tailwind CSS 4 all compile)
- `npm run test` exits 0 (cn() test and Button render test pass)
- `test -f components.json` (shadcn config exists)
- `test -f src/components/ui/button.tsx && test -f src/components/ui/tooltip.tsx && test -f src/components/ui/badge.tsx` (all three components exist)
- `grep -q "@import" src/styles/globals.css` (Tailwind imports present)

## Observability Impact

- **New build signal:** `npm run build` now validates Tailwind CSS 4 compilation — CSS parse errors from `@theme inline` or invalid oklch values surface as Vite build errors on stderr.
- **New test signal:** `npm run test` now covers `cn()` utility (class merging correctness) and Button component rendering (DOM presence, role attribute). Failures pinpoint whether the issue is in utility code or component wiring.
- **Inspection surface:** `grep -c "oklch" src/styles/globals.css` confirms all CSS variable values use the oklch color space. `components.json` is human-readable JSON showing shadcn/ui configuration state.
- **Failure visibility:** If Tailwind CSS 4 plugin fails to initialize, `npm run build` emits `[vite:css]` prefixed errors. If shadcn components have wrong imports, tsc emits `TS2307` (cannot find module) errors.

## Inputs

- `package.json` — existing project dependencies from S01
- `vite.config.ts` — existing Vite config with React plugin, port 1420, @/ alias
- `vitest.config.ts` — existing Vitest config with @/ alias and jsdom
- `tsconfig.app.json` — existing TypeScript config with @/ paths
- `src/main.tsx` — existing React entry point (currently imports @/App.css)
- `src/App.css` — existing empty CSS file (will be replaced by globals.css)
- `index.html` — existing HTML entry point

## Expected Output

- `package.json` — updated with tailwindcss, @tailwindcss/vite, tw-animate-css, clsx, tailwind-merge, lucide-react, class-variance-authority, radix-ui
- `vite.config.ts` — updated with tailwindcss() plugin
- `src/styles/globals.css` — new file with Tailwind imports and CSS variables theme
- `src/lib/utils.ts` — new cn() utility
- `src/lib/utils.test.ts` — new cn() tests
- `components.json` — new shadcn/ui config
- `src/components/ui/button.tsx` — new shadcn/ui Button component
- `src/components/ui/button.test.tsx` — new Button render test
- `src/components/ui/tooltip.tsx` — new shadcn/ui Tooltip component
- `src/components/ui/badge.tsx` — new shadcn/ui Badge component
- `src/main.tsx` — updated to import globals.css
