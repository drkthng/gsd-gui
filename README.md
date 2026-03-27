# GSD GUI

A native desktop GUI for [GSD](https://github.com/drkthng/gsd) (Get Shit Done) — the AI-powered project management CLI. Built with Tauri 2, React 19, and TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

---

## What is this?

GSD GUI wraps GSD's full functionality in a fast, native desktop application. Instead of running GSD from the terminal, you get a polished interface with project management, a chat interface for AI agents, auto-mode controls, real-time progress tracking, and cost monitoring — all launching in under a second using your OS's native webview.

The Rust backend is intentionally thin — it manages child processes and file watching while keeping all business logic in GSD itself. The entire React frontend is portable to Electron if needed (all Tauri IPC goes through a single abstraction layer).

## Features

### Project Management
- **Project Gallery** — Grid of project cards showing status, current milestone, progress, and cost
- **Search & Filter** — Find projects by name instantly
- **New Project Wizard** — 3-step creation flow: name & path → description & tech stack → review & create
- **Status Indicators** — Active (green), Paused (yellow), Idle (gray) at a glance

### Chat Interface
- **Markdown Rendering** — Assistant responses rendered with full GFM support (bold, lists, tables, code blocks)
- **Streaming** — See responses as they arrive with a real-time typing indicator
- **Auto-scroll** — Conversation stays pinned to the latest message
- **Message Input** — Multi-line textarea, Enter to send, Shift+Enter for newline

### Execution Controls
- **Auto Mode** — Start/Pause buttons for autonomous GSD execution
- **Step Mode** — "Next Step" button for controlled, one-task-at-a-time execution
- **Steer** — Redirect auto-mode mid-execution with guidance text
- **UI Request Dialogs** — GSD's interactive prompts (select, confirm, input) render as native GUI dialogs

### Backend Bridge
- **Process Manager** — Spawns `gsd --mode rpc` child processes with graceful shutdown
- **JSONL Protocol** — Full bidirectional communication via stdin/stdout
- **Headless Query** — Instant state snapshots via `gsd headless query` (polled every 2s)
- **File Watcher** — Detects `.gsd/STATE.md` and `metrics.json` changes for real-time updates
- **Binary Resolution** — Finds GSD via `TAURI_GSD_PATH` → PATH → common install paths

### State Management
- **3 Zustand Stores** — UI state, GSD session (state machine, messages, streaming), project list
- **TanStack Query** — Cached, auto-refreshing GSD state with event-driven invalidation
- **Event Routing** — All Tauri events routed through hooks to stores automatically

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | [Tauri 2](https://tauri.app/) (Rust + native webview) |
| Frontend | [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| Build Tool | [Vite 6](https://vite.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (new-york style) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) + [TanStack Query](https://tanstack.com/query) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| Backend | Rust (tokio, serde, notify-rs) |

## Code Signing

The CI pipeline currently produces **unsigned** installers. The binaries will trigger OS security warnings on first launch until signing is configured.

### macOS — Apple Notarization

To notarize macOS builds:
1. Enroll in Apple Developer Program (https://developer.apple.com/programs/)
2. Create a Developer ID Application certificate in Xcode / Apple Developer portal
3. Export the certificate as a `.p12` file
4. Add secrets to GitHub: `APPLE_CERTIFICATE` (base64 .p12), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (app-specific password), `APPLE_TEAM_ID`
5. Enable in `tauri.conf.json` under `bundle.macOS.signingIdentity` and set `ENABLE_CODE_SIGNING=true` in the CI environment
6. See: https://tauri.app/distribute/sign/macos/

### Windows — Authenticode Signing

To sign Windows builds:
1. Obtain an Authenticode code signing certificate from a CA (DigiCert, Sectigo, etc.) or use Azure Trusted Signing
2. Export as a `.pfx` file
3. Add secrets to GitHub: `WINDOWS_CERTIFICATE` (base64 .pfx), `WINDOWS_CERTIFICATE_PASSWORD`
4. See: https://tauri.app/distribute/sign/windows/

### Linux

Linux packages (.deb, .AppImage) do not require code signing to run, but can be signed for distribution via package repos.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)
- [GSD CLI](https://github.com/drkthng/gsd) installed and on PATH
- Platform-specific dependencies for Tauri:
  - **Windows:** Visual Studio Build Tools with C++ workload
  - **macOS:** Xcode Command Line Tools
  - **Linux:** `webkit2gtk-4.1`, `libappindicator3-dev`, `librsvg2-dev`

### Install & Run

```bash
# Clone the repository
git clone https://github.com/drkthng/gsd-gui.git
cd gsd-gui

# Install dependencies
npm install

# Run in development mode (frontend only)
npm run dev

# Run with Tauri (full desktop app)
npm run tauri dev

# Run tests
npm run test

# Production build
npm run build
npm run tauri build
```

## Project Structure

```
gsd-gui/
├── src/                          # React frontend
│   ├── components/
│   │   ├── app-shell/            # Layout: sidebar, main content, status bar
│   │   ├── chat/                 # ChatMessage, ChatView, MessageInput
│   │   ├── controls/             # AutoModeControls, UIRequestDialog
│   │   ├── projects/             # ProjectCard, ProjectGallery, NewProjectWizard
│   │   ├── shared/               # EmptyState, LoadingState
│   │   ├── status-bar/           # Live status bar (milestone, cost, session state)
│   │   ├── mode-toggle/          # Dark/light/system theme toggle
│   │   └── ui/                   # shadcn/ui primitives (21 components)
│   ├── hooks/                    # useGsdState, useGsdEvents
│   ├── lib/                      # types.ts (IPC boundary), utils.ts
│   ├── pages/                    # Route page components
│   ├── services/                 # gsd-client.ts (Tauri IPC abstraction)
│   ├── stores/                   # Zustand: ui-store, gsd-store, project-store
│   └── test/                     # test-utils, tauri-mock, setup
├── src-tauri/                    # Rust backend
│   └── src/
│       ├── gsd_process.rs        # Child process spawn/send/stop
│       ├── gsd_rpc.rs            # JSONL framing, RPC types
│       ├── gsd_resolve.rs        # GSD binary resolution
│       ├── gsd_query.rs          # Headless query parsing
│       ├── gsd_watcher.rs        # File watcher (notify-rs)
│       └── lib.rs                # Tauri commands & managed state
└── .gsd/                         # GSD project metadata
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │  Stores  │  │    Hooks       │  │
│  │ Chat     │──│ gsd-store│──│ useGsdState    │  │
│  │ Projects │  │ project  │  │ useGsdEvents   │  │
│  │ etc.     │  │ ui       │  │                │  │
│  └──────────┘  └────┬─────┘  └───────┬───────┘  │
│                     │                │           │
│              ┌──────┴────────────────┴──────┐    │
│              │      gsd-client.ts           │    │
│              │   (only Tauri import point)  │    │
│              └──────────────┬───────────────┘    │
└─────────────────────────────┼────────────────────┘
                              │ invoke / listen
┌─────────────────────────────┼────────────────────┐
│                  Tauri (Rust)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Process  │  │  Query   │  │   Watcher     │  │
│  │ Manager  │  │ (headless│  │ (notify-rs)   │  │
│  │ (stdin/  │  │  query)  │  │               │  │
│  │  stdout) │  │          │  │               │  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
└───────┼──────────────┼───────────────────────────┘
        │              │
   gsd --mode rpc   gsd headless query
```

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage
npm run test -- --coverage

# Run Rust tests (from src-tauri/)
cd src-tauri && cargo test --lib
```

**Current test count: 182 tests across 23 files (frontend) + 42 Rust tests**

All components, stores, hooks, and services follow TDD — tests are written before implementation.

## Roadmap

- [x] **M001: Project Scaffolding & Core Shell** — Tauri 2 app shell, sidebar, routing, theme, status bar
- [x] **M002: GSD Backend Bridge** — Rust process manager, JSONL RPC, headless query, file watcher, React IPC
- [x] **M003: Core Screens** — Project gallery, wizard, chat interface, auto mode controls, UI dialogs
- [ ] **M004: Data Views & Configuration** — Progress dashboard, roadmap view, cost charts, session browser, config panel
- [ ] **M005: Pro Tools & Polish** — Advanced tool panels, E2E tests, cross-platform packaging

## License

MIT
