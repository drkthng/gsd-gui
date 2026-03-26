---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T03: Create ThemeProvider component, wire into App, and run full integration check

**Slice:** S02 — shadcn/ui + Tailwind CSS 4 + Zustand + IPC abstraction
**Milestone:** M001

## Description

Build the ThemeProvider component (React context with `useTheme` hook) that manages dark/light/system theme modes with localStorage persistence, wire it into `App.tsx` as the top-level provider, update the existing smoke test, and run the full build + test suite to prove the complete S02 stack works together. This task closes the slice by verifying that Tailwind CSS 4 + shadcn/ui + Zustand + ThemeProvider all compose correctly.

The ThemeProvider follows the shadcn/ui Vite dark mode pattern: it reads the theme preference from localStorage, applies `"dark"` or `"light"` class to `document.documentElement`, and listens for system preference changes when set to `"system"`.

## Steps

1. **Write ThemeProvider tests first (`src/components/theme-provider.test.tsx`):** Using @testing-library/react:
   - ThemeProvider renders its children
   - `useTheme()` returns an object with `theme` and `setTheme`
   - Default theme is `"system"` when no localStorage value exists
   - `setTheme("dark")` updates the theme context value
   - `setTheme("light")` updates the theme context value
   - Throws error when `useTheme()` is used outside ThemeProvider
   
   Note: jsdom has `document.documentElement` available but `window.matchMedia` may need to be mocked. Mock `localStorage` if needed (jsdom provides one by default). Mock `window.matchMedia` to return a consistent value for system theme detection.

2. **Implement ThemeProvider (`src/components/theme-provider.tsx`):**
   ```typescript
   import { createContext, useContext, useEffect, useState } from "react";

   type Theme = "dark" | "light" | "system";

   type ThemeProviderProps = {
     children: React.ReactNode;
     defaultTheme?: Theme;
     storageKey?: string;
   };

   type ThemeProviderState = {
     theme: Theme;
     setTheme: (theme: Theme) => void;
   };

   const initialState: ThemeProviderState = {
     theme: "system",
     setTheme: () => null,
   };

   const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

   export function ThemeProvider({
     children,
     defaultTheme = "system",
     storageKey = "gsd-ui-theme",
     ...props
   }: ThemeProviderProps) {
     const [theme, setTheme] = useState<Theme>(
       () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
     );

     useEffect(() => {
       const root = window.document.documentElement;
       root.classList.remove("light", "dark");

       if (theme === "system") {
         const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
           .matches ? "dark" : "light";
         root.classList.add(systemTheme);
         return;
       }

       root.classList.add(theme);
     }, [theme]);

     const value = {
       theme,
       setTheme: (theme: Theme) => {
         localStorage.setItem(storageKey, theme);
         setTheme(theme);
       },
     };

     return (
       <ThemeProviderContext.Provider {...props} value={value}>
         {children}
       </ThemeProviderContext.Provider>
     );
   }

   export const useTheme = () => {
     const context = useContext(ThemeProviderContext);
     if (context === undefined)
       throw new Error("useTheme must be used within a ThemeProvider");
     return context;
   };
   ```
   Note the `storageKey` default is `"gsd-ui-theme"` (not `"vite-ui-theme"` from the shadcn docs example — we use our app name).

3. **Update `src/App.tsx`:** Wrap the app content with ThemeProvider. Remove the static `<h1>GSD</h1>` and replace with a simple layout that includes a shadcn/ui Button to prove integration:
   ```tsx
   import { ThemeProvider } from "@/components/theme-provider";
   import { Button } from "@/components/ui/button";

   function App() {
     return (
       <ThemeProvider defaultTheme="system" storageKey="gsd-ui-theme">
         <div className="flex min-h-screen items-center justify-center">
           <div className="text-center space-y-4">
             <h1 className="text-4xl font-bold">GSD</h1>
             <Button>Get Started</Button>
           </div>
         </div>
       </ThemeProvider>
     );
   }

   export default App;
   ```

4. **Update `src/App.test.tsx`:** The existing smoke test checks for "GSD" text — keep that assertion. Add the ThemeProvider wrapper and add a test that a Button renders correctly:
   ```tsx
   import { render, screen } from "@testing-library/react";
   import { describe, expect, it } from "vitest";
   import App from "@/App";

   describe("App", () => {
     it("renders without crashing", () => {
       render(<App />);
       expect(screen.getByText("GSD")).toBeInTheDocument();
     });

     it("renders a styled Button", () => {
       render(<App />);
       expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
     });
   });
   ```

5. **Delete `src/App.css`** — it's empty and replaced by `src/styles/globals.css` (which was wired in T01). Verify no remaining imports reference it. Run `npm run build && npm run test` for the final full-stack verification.

## Must-Haves

- [ ] `src/components/theme-provider.tsx` exports `ThemeProvider` and `useTheme`
- [ ] ThemeProvider applies `dark`/`light` class to `document.documentElement` based on theme
- [ ] ThemeProvider reads/writes theme preference to localStorage
- [ ] ThemeProvider wraps App content in `src/App.tsx`
- [ ] `src/App.css` deleted (globals.css is the sole stylesheet)
- [ ] All existing and new tests pass
- [ ] `npm run build` passes

## Verification

- `npm run build` exits 0 (complete build with ThemeProvider + shadcn/ui + Tailwind)
- `npm run test` exits 0 (all tests pass: smoke test, Button render, ThemeProvider unit tests, ui-store tests, gsd-client tests, cn() tests)
- `! test -f src/App.css` (old CSS file removed)
- `grep -q "ThemeProvider" src/App.tsx` (ThemeProvider wired into App)

## Inputs

- `src/App.tsx` — current App component from S01 (renders `<h1>GSD</h1>`)
- `src/App.test.tsx` — current smoke test from S01
- `src/App.css` — empty CSS file to be deleted
- `src/components/ui/button.tsx` — Button component from T01
- `src/styles/globals.css` — Tailwind CSS globals from T01
- `src/main.tsx` — entry point (already imports globals.css from T01)

## Observability Impact

- **Theme class on document root:** Browser DevTools → Elements → `<html>` element shows `class="dark"` or `class="light"` depending on active theme. Vitest tests verify `document.documentElement.classList` contains expected class after `setTheme()` calls.
- **localStorage persistence:** `localStorage.getItem("gsd-ui-theme")` in browser console returns the persisted theme value (`"dark"`, `"light"`, or `"system"`). Tests verify round-trip: set → persist → read-back.
- **Theme test failures:** `npx vitest run src/components/theme-provider.test.tsx` — failures show which theme operation (class application, localStorage persistence, system detection, or context error boundary) broke.
- **App integration test:** `npx vitest run src/App.test.tsx` — verifies ThemeProvider wraps the app correctly and Button renders inside it.
- **No new secrets or credentials** — only CSS classes and localStorage keys.

## Expected Output

- `src/components/theme-provider.tsx` — new ThemeProvider context component
- `src/components/theme-provider.test.tsx` — new ThemeProvider tests
- `src/App.tsx` — updated with ThemeProvider wrapper and Button
- `src/App.test.tsx` — updated with ThemeProvider-aware tests
- `src/App.css` — deleted
