# GSD-UI

## What This Is

A standalone Tauri 2 desktop application that wraps GSD-2's full functionality in a native GUI. The app communicates with GSD via its JSONL RPC protocol (`gsd --mode rpc`) and headless query (`gsd headless query`). Users can create projects, run auto/step mode, monitor progress, review sessions, steer execution, and manage configuration — all without touching a terminal.

The Rust backend layer is intentionally thin (child process management + file watching), keeping all business logic in GSD. This also serves as an escape hatch — if Tauri's native webviews cause issues on any platform, the entire React frontend is portable to Electron with ~1-2 weeks of bridge rewrite.

## Core Value

A fast, native-feeling desktop GUI for GSD-2 that launches in under 1 second and works on Windows, macOS, and Linux.

## Current State

**M006 complete.** The GUI now connects to real project data. Selecting a project populates milestones, timeline, and costs pages with live data parsed from that project's `.gsd/` directory. Milestones are filterable by status (Active/Complete/Planned) with collapsible grouped sections. No mock data remains in production pages. 381 frontend tests across 55 files + 35 Rust parser tests, all passing.

## Architecture / Key Patterns

- **Tauri 2** — Rust core + native OS webview (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux)
- **React 19 + TypeScript 5.7+** — UI framework
- **Vite 6** — Build tool with HMR
- **Tailwind CSS 4** — Utility-first styling
- **shadcn/ui** — Component library (Radix primitives + Tailwind), "new-york" style
- **Zustand** — Lightweight state management
- **TanStack Query** — Server state, polling, caching for GSD data
- **Vitest + @testing-library/react** — TDD, tests written before implementation
- **Lucide React** — Icons
- **Recharts** — Cost/token charts (M004+)
- **IPC abstraction** — Single `gsd-client.ts` service layer abstracts all Tauri IPC calls, enabling Electron migration if needed

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] **M001: Project Scaffolding & Core Shell** — Tauri 2 app shell with sidebar, routing, theme, status bar, TDD foundation. 97 tests, 59 files, 9 requirements validated. Complete.
- [x] **M002: GSD Backend Bridge** — Rust process manager, JSONL RPC, headless query, file watcher, React IPC client. 42 Rust tests + 104 frontend tests. Complete.
- [x] **M003: Core Screens** — Project gallery, new project wizard, chat interface, auto mode controls. Complete.
- [x] **M004: Data Views & Configuration** — Progress dashboard, roadmap view, cost charts, session browser, config panel. Complete.
- [x] **M005: Pro Tools, Polish & Packaging** — 19 pro tool panels, toast notifications, keyboard shortcuts, Playwright E2E tests, cross-platform installers, GitHub Actions CI. Complete.
- [x] **M006: Live Project Data** — Rust .gsd/ parser (35 tests), useMilestoneData hook, live dashboard wiring, milestone filtering by status. 381 frontend tests + 35 Rust tests. Complete.
