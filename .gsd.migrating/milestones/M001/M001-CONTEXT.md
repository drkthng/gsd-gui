# M001: Project Scaffolding & Core Shell — Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

## Project Description

GSD-UI is a standalone Tauri 2 desktop application wrapping GSD-2's full functionality in a native GUI. This first milestone establishes the project foundation: Tauri 2 + React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui + Zustand + Vitest. The app shell — sidebar navigation, routing, status bar, dark/light theme — must be complete and fully tested before any GSD integration begins.

## Why This Milestone

The app shell is the container everything else plugs into. Getting the scaffolding right — with TDD from day one — means M002-M005 build on solid ground. The Tauri + React + shadcn/ui integration has potential friction points (alias configuration, Tailwind CSS 4 setup, shadcn/ui Sidebar component) that must be proven before downstream work begins.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Launch the Tauri desktop app and see it open in under 1 second
- Click sidebar navigation items (Chat, Dashboard, Roadmap, Sessions, Files, Config, Pro Tools) and see the main content area switch between placeholder views
- Toggle between dark, light, and system theme modes
- See a status bar at the bottom with mock project context
- Resize the window down to 900×600 and confirm the layout remains functional

### Entry point / environment

- Entry point: `npm run tauri dev` (development) / built Tauri binary (production)
- Environment: local dev on Windows (primary), must also build on macOS and Linux
- Live dependencies involved: none — this milestone is pure shell with no GSD integration

## Completion Class

- Contract complete means: all Vitest tests pass, Tauri dev mode launches, sidebar routing works, theme toggle persists
- Integration complete means: shadcn/ui components render correctly with Tailwind CSS 4 in the Tauri webview
- Operational complete means: none — no services or processes to manage in this milestone

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `npm run test` passes all unit and component tests
- `npm run tauri dev` launches the app window at 1200×800
- All 7 sidebar navigation items switch the main content area
- Dark/light/system theme toggle works and persists across app restart
- The status bar renders with mock data
- The layout does not break at 900×600 minimum window size

## Risks and Unknowns

- **Tauri 2 + shadcn/ui + Tailwind CSS 4 integration** — shadcn/ui expects specific path aliases (`@/components`, `@/lib`) and Tailwind CSS 4 has a new configuration approach. The Vite alias config and shadcn/ui `components.json` must align. Risk: medium, retire in S01/S02.
- **First Rust compile time on Windows** — The initial `cargo tauri dev` compiles the entire Rust dependency tree. Expect 3-5 minutes on first build. One-time cost, not ongoing. Risk: low.
- **shadcn/ui Sidebar component complexity** — The Sidebar is one of shadcn/ui's most complex components (SidebarProvider, SidebarContent, SidebarGroup, SidebarMenu, etc.). Getting it wired correctly with responsive collapse takes care. Risk: low, retire in S03.

## Existing Codebase / Prior Art

- `GSD-UI-ARCHITECTURE.md` — Complete architecture spec with 9 phases, screen wireframes, data contracts, and file structure. This is the authoritative reference for all implementation decisions.
- `.gsd/preferences.md` — Project preferences (solo mode, worktree isolation, always write tests)

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — Tauri 2 desktop app with < 1s startup (proven by S01)
- R002 — React 19 + TypeScript + Vite 6 frontend (proven by S01)
- R003 — Tailwind CSS 4 + shadcn/ui component library (proven by S02)
- R004 — App shell with sidebar navigation (proven by S03)
- R005 — Tab-based main content area with routing (proven by S03)
- R006 — Status bar with project context (proven by S03, mock data)
- R007 — Dark/light/system theme toggle (proven by S04)
- R008 — TDD — tests written before implementation (proven by all slices)
- R009 — Zustand state management foundation (proven by S02)
- R010 — Responsive layout min 900×600 (proven by S03)
- R032 — IPC abstraction for Electron escape hatch (proven by S02)

## Scope

### In Scope

- Tauri 2 project scaffolding with React 19 + Vite 6 + TypeScript
- Tailwind CSS 4 + shadcn/ui initialization and configuration
- Zustand UI store (theme, sidebar state, active view)
- IPC abstraction layer (interface only, no real Tauri calls yet)
- App shell: sidebar with 7 navigation items, main content area, status bar
- Client-side routing between placeholder views
- Dark/light/system theme toggle with persistence
- Vitest + @testing-library/react test infrastructure with TDD approach
- Tauri window configuration (1200×800 default, 900×600 minimum, title "GSD")

### Out of Scope / Non-Goals

- Any GSD process spawning, RPC communication, or headless queries (M002)
- Real project data — all data in this milestone is mock/placeholder
- Any of the 43 features from the architecture spec's feature map (M003-M005)
- Rust backend logic beyond the default Tauri scaffold
- E2E tests with Playwright (M005)
- Cross-platform packaging and installers (M005)

## Technical Constraints

- TDD — tests must be written before implementation code for every component, store, and hook
- shadcn/ui uses path aliases (`@/components`, `@/lib/utils`, etc.) that must be configured in both `tsconfig.json` and `vite.config.ts`
- Tailwind CSS 4 uses a CSS-first configuration approach — `@import "tailwindcss"` in the CSS file rather than a separate `tailwind.config.ts` (though the config file is still supported)
- The IPC abstraction (`gsd-client.ts`) must be the only file that imports from `@tauri-apps/api` — no Tauri-specific imports in components or stores

## Integration Points

- None in this milestone — the app shell is self-contained

## Open Questions

- None — the architecture spec answers all technical questions for this milestone
