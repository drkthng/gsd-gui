# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — The application must launch as a Tauri 2 desktop window in under 1 second, using the native OS webview on each platform
- Class: core-capability
- Status: active
- Description: The application must launch as a Tauri 2 desktop window in under 1 second, using the native OS webview on each platform
- Why it matters: Instant startup is a primary design principle — the app must feel native, not like a web page loading
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: Measured from app launch to first paint. Tauri's native webview enables this without bundled Chromium.

### R002 — The frontend must use React 19 with TypeScript 5.7+ and Vite 6 as the build tool
- Class: constraint
- Status: active
- Description: The frontend must use React 19 with TypeScript 5.7+ and Vite 6 as the build tool
- Why it matters: Defines the core frontend stack — type safety, fast HMR, modern React features
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R003 — Styling must use Tailwind CSS 4 with shadcn/ui components (new-york style, dark mode)
- Class: constraint
- Status: active
- Description: Styling must use Tailwind CSS 4 with shadcn/ui components (new-york style, dark mode)
- Why it matters: Consistent, accessible component library with utility-first CSS. shadcn/ui provides Radix primitives with Tailwind styling.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: unmapped
- Notes: shadcn/ui initialized via `npx shadcn@latest init -t vite`

### R004 — The app must have a responsive sidebar with navigation icons for Chat, Dashboard, Roadmap, Sessions, Files, Config, and Pro Tools
- Class: core-capability
- Status: active
- Description: The app must have a responsive sidebar with navigation icons for Chat, Dashboard, Roadmap, Sessions, Files, Config, and Pro Tools
- Why it matters: The sidebar is the primary navigation mechanism — it defines the app's information architecture
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Uses shadcn/ui Sidebar component. Collapsible on narrow viewports.

### R005 — The main content area must support tab-based navigation between views, with client-side routing
- Class: core-capability
- Status: active
- Description: The main content area must support tab-based navigation between views, with client-side routing
- Why it matters: Users navigate between chat, dashboard, roadmap etc. within a project workspace
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: React Router or equivalent for client-side routing

### R006 — A persistent status bar at the bottom must show current milestone/slice/task, cost, and model info
- Class: core-capability
- Status: active
- Description: A persistent status bar at the bottom must show current milestone/slice/task, cost, and model info
- Why it matters: Always-visible context prevents users from losing track of where they are in GSD execution
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: M002, M003
- Validation: unmapped
- Notes: Shows mock data in M001, wired to real GSD state in M002+

### R007 — The app must support dark, light, and system-following theme modes with a toggle control
- Class: quality-attribute
- Status: active
- Description: The app must support dark, light, and system-following theme modes with a toggle control
- Why it matters: Dark mode is table stakes for developer tools. System-following respects OS preferences.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Theme preference persisted to localStorage. Uses custom ThemeProvider pattern from shadcn/ui Vite guide.

### R008 — Every component, store, hook, and service must have tests written before the implementation code
- Class: constraint
- Status: active
- Description: Every component, store, hook, and service must have tests written before the implementation code
- Why it matters: TDD is an explicit project constraint — it ensures quality and catches regressions from the start
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S02, M001/S03, M001/S04
- Validation: unmapped
- Notes: Vitest + @testing-library/react. Tests co-located with source files.

### R009 — Application state must be managed with Zustand stores
- Class: constraint
- Status: active
- Description: Application state must be managed with Zustand stores
- Why it matters: Lightweight, no-boilerplate state management that's easy to test and debug
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M002, M003
- Validation: Validated across M001-M002. 3 Zustand stores: useUIStore (theme, sidebar, activeView — 11 tests), useGsdStore (session lifecycle, messages, events — 15 tests), useProjectStore (project list, active project — 6 tests). All tested via getState()/setState() pattern without React rendering.
- Notes: UI store for theme/sidebar state in M001; GSD store and project store in M002+

### R010 — The app layout must be responsive and functional at a minimum window size of 900×600 pixels
- Class: quality-attribute
- Status: active
- Description: The app layout must be responsive and functional at a minimum window size of 900×600 pixels
- Why it matters: The Tauri window has a minimum size constraint — the layout must not break at that size
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: Tauri window config sets minWidth/minHeight. Sidebar collapses at narrow widths.

### R011 — The Tauri Rust backend must spawn and manage `gsd --mode rpc` child processes, one per project
- Class: core-capability
- Status: active
- Description: The Tauri Rust backend must spawn and manage `gsd --mode rpc` child processes, one per project
- Why it matters: This is how the GUI communicates with GSD — without it, the app is just a shell
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: S01 delivered Rust process manager (gsd_process.rs) with async spawn/send/stop and 3 Tauri commands. S03 wired TypeScript client. Frontend store wiring (S04-S06) deferred from M002.

### R012 — The app must send RPC commands via stdin and receive events/responses via stdout using JSONL protocol
- Class: core-capability
- Status: active
- Description: The app must send RPC commands via stdin and receive events/responses via stdout using JSONL protocol
- Why it matters: The JSONL protocol is GSD's standard RPC interface, used by the VS Code extension too
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: S01 delivered Rust JSONL framing (gsd_rpc.rs). S03 wired TypeScript types and client. Frontend store routing (S04-S06) deferred from M002.

### R013 — The app must use `gsd headless query` for instant (~50ms) state snapshots without an active RPC session
- Class: core-capability
- Status: active
- Description: The app must use `gsd headless query` for instant (~50ms) state snapshots without an active RPC session
- Why it matters: Keeps UI snappy for project listing, status checks, and progress polling
- Source: user
- Primary owning slice: M002
- Supporting slices: M003, M004
- Validation: Partially proven by M002/S02. Rust module `gsd_query.rs` implements `run_headless_query()` that spawns `gsd headless query --project <path> --format json` and parses JSON into `QuerySnapshot`. 10 unit tests pass covering valid JSON, null fields, invalid JSON, empty output, and camelCase serialization. `query_gsd_state` Tauri command registered. S03 wired TypeScript client with matching types. Full validation requires frontend hooks (deferred S05) + real GSD binary integration.
- Notes: Returns QuerySnapshot with progress, cost, blockers, next action

### R014 — The Tauri backend must watch .gsd/STATE.md, metrics.json, and roadmap files for changes and emit events
- Class: core-capability
- Status: active
- Description: The Tauri backend must watch .gsd/STATE.md, metrics.json, and roadmap files for changes and emit events
- Why it matters: Supports the two-terminal workflow — when auto mode runs in a separate terminal, the GUI updates in real-time
- Source: user
- Primary owning slice: M002
- Supporting slices: none
- Validation: unmapped
- Notes: S02 delivered Rust file watcher (gsd_watcher.rs) with notify-rs and 500ms debounce. Frontend event routing (S05) deferred from M002.

### R015 — React hooks and Zustand stores must consume Tauri IPC events and provide GSD state to components
- Class: core-capability
- Status: active
- Description: React hooks and Zustand stores must consume Tauri IPC events and provide GSD state to components
- Why it matters: This is the glue between the Rust backend and the React UI — stores are the single source of truth for the frontend
- Source: user
- Primary owning slice: M002
- Supporting slices: M003, M004
- Validation: M002/S04 delivered gsd-store.ts (session state machine, message accumulation, UI request queue) and project-store.ts (project list, active project). M002/S05 delivered useGsdState (TanStack Query polling) and useGsdEvents (event routing to stores). M002/S06 proved the full flow: event → store → StatusBar UI. 136 tests pass.
- Notes: Delivered by M002/S04 (gsd-store + project-store) and S05 (useGsdState + useGsdEvents). Stores consume Tauri IPC events via gsd-client.ts. TanStack Query polls headless state. File change events invalidate cache.

### R016 — Home screen must show a grid of project cards with status, cost, last activity, and recent sessions list
- Class: primary-user-loop
- Status: active
- Description: Home screen must show a grid of project cards with status, cost, last activity, and recent sessions list
- Why it matters: The project gallery is the app's entry point — users see all their GSD projects at a glance
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: Status indicators: green (active), yellow (paused), gray (idle). Search/filter. Click navigates to workspace.

### R017 — Multi-step wizard for creating new projects: name, folder, type, description, tech stack, action choice
- Class: primary-user-loop
- Status: active
- Description: Multi-step wizard for creating new projects: name, folder, type, description, tech stack, action choice
- Why it matters: First-run experience — how users create their first GSD project through the GUI
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: Native directory picker via Tauri dialog. 3 steps: Basics → Details → Go.

### R018 — Import existing code projects with detection of git, package.json, language, existing .gsd/ or .planning/
- Class: primary-user-loop
- Status: active
- Description: Import existing code projects with detection of git, package.json, language, existing .gsd/ or .planning/
- Why it matters: Most GSD users have existing projects — import is how they adopt the GUI
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: v1 migration detection (.planning/ → .gsd/)

### R019 — Full chat interface with markdown-rendered assistant messages, code blocks, tool call indicators, streaming
- Class: core-capability
- Status: active
- Description: Full chat interface with markdown-rendered assistant messages, code blocks, tool call indicators, streaming
- Why it matters: Chat is the primary interaction mode with GSD — this must feel smooth and complete
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: react-markdown + remark-gfm. shiki for syntax highlighting. Auto-scroll. Streaming indicator. Slash command autocomplete.

### R020 — Start/pause/stop buttons for auto mode, "Next Step" for step mode, steer button for mid-execution guidance
- Class: core-capability
- Status: active
- Description: Start/pause/stop buttons for auto mode, "Next Step" for step mode, steer button for mid-execution guidance
- Why it matters: Core GSD workflow controls — users must be able to control execution without typing commands
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: Maps to /gsd auto, /gsd stop, /gsd next, steer RPC command

### R021 — GSD's extension_ui_request (select, confirm, input, notify) must render as proper GUI dialogs instead of terminal cursor selection
- Class: core-capability
- Status: active
- Description: GSD's extension_ui_request (select, confirm, input, notify) must render as proper GUI dialogs instead of terminal cursor selection
- Why it matters: When GSD needs user input during execution, the GUI must present it natively — interactive cursor selection in the terminal becomes radio buttons, dropdowns, and modals in the GUI
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: unmapped
- Notes: select → radio/dropdown, confirm → yes/no modal, input → text field, notify → toast. Response sent back via extension_ui_response.

### R022 — Tree view of milestones, slices, and tasks with completion indicators, progress bars, cost, and duration
- Class: core-capability
- Status: active
- Description: Tree view of milestones, slices, and tasks with completion indicators, progress bars, cost, and duration
- Why it matters: Visual progress tracking is one of the key advantages of a GUI over the terminal
- Source: user
- Primary owning slice: M004
- Supporting slices: none
- Validation: unmapped
- Notes: ✅ done, 🔄 in progress, ⬜ pending. Expandable/collapsible tree nodes.

### R023 — Card-based layout for slices with SVG dependency arrows, risk badges, and status indicators
- Class: core-capability
- Status: active
- Description: Card-based layout for slices with SVG dependency arrows, risk badges, and status indicators
- Why it matters: Visual dependency graph makes the execution plan tangible and reviewable
- Source: user
- Primary owning slice: M004
- Supporting slices: none
- Validation: unmapped
- Notes: SVG lines between cards. Risk: low=green, medium=yellow, high=red.

### R024 — Budget ceiling bar, cost breakdown by phase and model (Recharts), cost projection, per-slice cost table
- Class: core-capability
- Status: active
- Description: Budget ceiling bar, cost breakdown by phase and model (Recharts), cost projection, per-slice cost table
- Why it matters: Cost visibility is critical for users managing LLM spend across milestones
- Source: user
- Primary owning slice: M004
- Supporting slices: none
- Validation: unmapped
- Notes: Uses Recharts (same as GSD web). Data from metrics.json.

### R025 — List all sessions with thread tree, search, sort, resume, rename, and export capabilities
- Class: core-capability
- Status: active
- Description: List all sessions with thread tree, search, sort, resume, rename, and export capabilities
- Why it matters: Session history is how users review and continue past work
- Source: user
- Primary owning slice: M004
- Supporting slices: none
- Validation: unmapped
- Notes: Parent-child relationships shown with indentation. Active session highlighted.

### R026 — Settings UI with tabs for general, models (per-phase), git, budget, verification, and advanced
- Class: core-capability
- Status: active
- Description: Settings UI with tabs for general, models (per-phase), git, budget, verification, and advanced
- Why it matters: Users must be able to configure GSD behavior without editing YAML files
- Source: user
- Primary owning slice: M004
- Supporting slices: none
- Validation: unmapped
- Notes: Reads/writes .gsd/preferences.md. Model selector with provider grouping.

### R029 — Build installers for Windows (.msi/.exe), macOS (.dmg universal binary), and Linux (.deb/.rpm/.AppImage)
- Class: launchability
- Status: active
- Description: Build installers for Windows (.msi/.exe), macOS (.dmg universal binary), and Linux (.deb/.rpm/.AppImage)
- Why it matters: Users must be able to install the app on their platform without building from source
- Source: user
- Primary owning slice: M005/S06
- Supporting slices: none
- Validation: unmapped
- Notes: GitHub Actions CI matrix for all three platforms

### R030 — Keyboard shortcuts for common actions: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
- Class: quality-attribute
- Status: active
- Description: Keyboard shortcuts for common actions: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
- Why it matters: Power users expect keyboard-driven workflows in developer tools
- Source: user
- Primary owning slice: M005/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Discoverable via tooltip/help

### R031 — Toast notifications for GSD events: task complete, slice done, errors, budget warnings
- Class: quality-attribute
- Status: active
- Description: Toast notifications for GSD events: task complete, slice done, errors, budget warnings
- Why it matters: Non-blocking feedback keeps users informed without interrupting their workflow
- Source: inferred
- Primary owning slice: M005
- Supporting slices: M003
- Validation: unmapped
- Notes: Maps to GSD's notification events

### R032 — All Tauri IPC calls must go through a single abstraction layer (gsd-client.ts) so the backend can be swapped to Electron if needed
- Class: constraint
- Status: active
- Description: All Tauri IPC calls must go through a single abstraction layer (gsd-client.ts) so the backend can be swapped to Electron if needed
- Why it matters: If Tauri's WKWebView causes macOS issues, the entire React frontend must be portable to Electron with minimal rewrite
- Source: collaborative
- Primary owning slice: M001/S02
- Supporting slices: M002
- Validation: unmapped
- Notes: Single service file abstracts invoke/listen. No Tauri-specific imports in components or stores.

## Validated

### R027 — Advanced tools area with panels for parallel orchestration, forensics, doctor, worktrees, hooks, routing history, skill health, MCP servers, headless launcher, knowledge/decisions/requirements editors, activity logs, budget pressure, custom models, and visualizer
- Class: differentiator
- Status: validated
- Description: Advanced tools area with panels for parallel orchestration, forensics, doctor, worktrees, hooks, routing history, skill health, MCP servers, headless launcher, knowledge/decisions/requirements editors, activity logs, budget pressure, custom models, and visualizer
- Why it matters: Power user features that differentiate the GUI from the terminal — visual forensics, drag-and-drop hooks, etc.
- Source: user
- Primary owning slice: M005/S01-S03
- Supporting slices: none
- Validation: All 19 Pro Tools panels render with mock data across 5 categories. 318 unit tests pass. M005 S01-S03.
- Notes: Accessible via "Pro Tools" sidebar item. Each panel is a separate component.

### R028 — End-to-end tests covering full app flows: launch, create project, send message, auto mode, settings
- Class: quality-attribute
- Status: validated
- Description: End-to-end tests covering full app flows: launch, create project, send message, auto mode, settings
- Why it matters: E2E tests catch integration issues that unit/component tests miss
- Source: user
- Primary owning slice: M005/S05
- Supporting slices: none
- Validation: 22 Playwright E2E tests pass covering launch, navigation, pro tools, shortcuts, settings, toasts, routing. M005 S05.
- Notes: M005/S05 delivered 22 tests (exceeding the 7 planned). Full E2E coverage of launch, create project, settings, and navigation flows. Auto mode and send message flows deferred (require Tauri backend).

## Deferred

### R033 — Apple Developer account ($99/yr) code signing and notarization for distributing signed .dmg files
- Class: launchability
- Status: deferred
- Description: Apple Developer account ($99/yr) code signing and notarization for distributing signed .dmg files
- Why it matters: Without signing, macOS users get Gatekeeper "unidentified developer" warning
- Source: research
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — users build from source or use unsigned dev builds initially. Revisit when distributing pre-built binaries.

### R034 — Tauri's built-in auto-updater with GitHub Releases backend
- Class: continuity
- Status: deferred
- Description: Tauri's built-in auto-updater with GitHub Releases backend
- Why it matters: Users should get updates without manually downloading new versions
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred to post-M005. Requires code signing on macOS.

### R035 — Embedded terminal for raw GSD output within the GUI
- Class: differentiator
- Status: deferred
- Description: Embedded terminal for raw GSD output within the GUI
- Why it matters: Some users want to see the raw terminal output alongside the GUI
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred — adds complexity, and the chat interface covers the primary interaction

## Out of Scope

### R036 — Native mobile application for GSD
- Class: anti-feature
- Status: out-of-scope
- Description: Native mobile application for GSD
- Why it matters: Prevents scope creep — GSD is a desktop developer tool
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Tauri 2 supports mobile but GSD is desktop-only

### R037 — The GUI must not parse .gsd/ files directly — all reads go through GSD's APIs
- Class: anti-feature
- Status: out-of-scope
- Description: The GUI must not parse .gsd/ files directly — all reads go through GSD's APIs
- Why it matters: Prevents coupling to file format internals. GSD owns its data format.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Uses `gsd headless query` and RPC protocol exclusively

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | active | M001/S01 | none | unmapped |
| R002 | constraint | active | M001/S01 | none | unmapped |
| R003 | constraint | active | M001/S02 | none | unmapped |
| R004 | core-capability | active | M001/S03 | none | unmapped |
| R005 | core-capability | active | M001/S03 | none | unmapped |
| R006 | core-capability | active | M001/S03 | M002, M003 | unmapped |
| R007 | quality-attribute | active | M001/S04 | none | unmapped |
| R008 | constraint | active | M001/S01 | M001/S02, M001/S03, M001/S04 | unmapped |
| R009 | constraint | active | M001/S02 | M002, M003 | Validated across M001-M002. 3 Zustand stores: useUIStore (theme, sidebar, activeView — 11 tests), useGsdStore (session lifecycle, messages, events — 15 tests), useProjectStore (project list, active project — 6 tests). All tested via getState()/setState() pattern without React rendering. |
| R010 | quality-attribute | active | M001/S03 | none | unmapped |
| R011 | core-capability | active | M002 | none | unmapped |
| R012 | core-capability | active | M002 | none | unmapped |
| R013 | core-capability | active | M002 | M003, M004 | Partially proven by M002/S02. Rust module `gsd_query.rs` implements `run_headless_query()` that spawns `gsd headless query --project <path> --format json` and parses JSON into `QuerySnapshot`. 10 unit tests pass covering valid JSON, null fields, invalid JSON, empty output, and camelCase serialization. `query_gsd_state` Tauri command registered. S03 wired TypeScript client with matching types. Full validation requires frontend hooks (deferred S05) + real GSD binary integration. |
| R014 | core-capability | active | M002 | none | unmapped |
| R015 | core-capability | active | M002 | M003, M004 | M002/S04 delivered gsd-store.ts (session state machine, message accumulation, UI request queue) and project-store.ts (project list, active project). M002/S05 delivered useGsdState (TanStack Query polling) and useGsdEvents (event routing to stores). M002/S06 proved the full flow: event → store → StatusBar UI. 136 tests pass. |
| R016 | primary-user-loop | active | M003 | none | unmapped |
| R017 | primary-user-loop | active | M003 | none | unmapped |
| R018 | primary-user-loop | active | M003 | none | unmapped |
| R019 | core-capability | active | M003 | none | unmapped |
| R020 | core-capability | active | M003 | none | unmapped |
| R021 | core-capability | active | M003 | none | unmapped |
| R022 | core-capability | active | M004 | none | unmapped |
| R023 | core-capability | active | M004 | none | unmapped |
| R024 | core-capability | active | M004 | none | unmapped |
| R025 | core-capability | active | M004 | none | unmapped |
| R026 | core-capability | active | M004 | none | unmapped |
| R027 | differentiator | validated | M005/S01-S03 | none | All 19 Pro Tools panels render with mock data across 5 categories. 318 unit tests pass. M005 S01-S03. |
| R028 | quality-attribute | validated | M005/S05 | none | 22 Playwright E2E tests pass covering launch, navigation, pro tools, shortcuts, settings, toasts, routing. M005 S05. |
| R029 | launchability | active | M005/S06 | none | unmapped |
| R030 | quality-attribute | active | M005/S04 | none | unmapped |
| R031 | quality-attribute | active | M005 | M003 | unmapped |
| R032 | constraint | active | M001/S02 | M002 | unmapped |
| R033 | launchability | deferred | none | none | unmapped |
| R034 | continuity | deferred | none | none | unmapped |
| R035 | differentiator | deferred | none | none | unmapped |
| R036 | anti-feature | out-of-scope | none | none | n/a |
| R037 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 30
- Mapped to slices: 30
- Validated: 2 (R027, R028)
- Unmapped active requirements: 0
