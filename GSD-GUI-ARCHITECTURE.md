# GSD-GUI — Design & Architecture Analysis

> A comprehensive plan for building a desktop GUI for GSD-2, covering architecture, features, technology choices, screen layouts, data contracts, and ready-to-use prompts for a GSD agent to implement each phase.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Decision](#2-technology-stack-decision)
3. [Architecture — How the GUI Talks to GSD](#3-architecture--how-the-gui-talks-to-gsd)
4. [Feature Map — What the GUI Must Cover](#4-feature-map)
5. [Screen-by-Screen Design](#5-screen-by-screen-design)
6. [Pro User / Hidden Gems Area](#6-pro-user--hidden-gems-area)
7. [Data Contracts — What GSD Exposes](#7-data-contracts--what-gsd-exposes)
8. [Error Handling & Recovery Flows](#8-error-handling--recovery-flows)
9. [TDD Strategy](#9-tdd-strategy)
10. [Implementation Phases & GSD Agent Prompts](#10-implementation-phases--gsd-agent-prompts)

---

## 1. Executive Summary

### Goal
Build a clean, fast-launching desktop application that wraps GSD-2's full functionality in a modern GUI. Users should be able to create projects, switch between them, run auto/step mode, monitor progress, review sessions, steer execution, manage configuration — all without touching a terminal.

### Key Design Principles
- **Instant startup** — the app must open in under 1 second. The GSD backend spawns lazily per-project.
- **Truly cross-platform** — Windows, macOS (Intel + Apple Silicon), and Linux from one codebase with native look and feel on each OS.
- **Project-centric** — the home screen is a project gallery/switcher, not a blank canvas.
- **Layered disclosure** — core features are prominent; pro/advanced features are discoverable but tucked away.
- **Real-time** — live progress, cost, and log streaming via Server-Sent Events from the GSD backend.
- **TDD** — every component, every service, every hook is tested before implementation.

---

## 2. Technology Stack Decision

### Recommendation: **Tauri 2 + React + TypeScript + Vite + Vitest + shadcn/ui + Tailwind CSS 4**

| Criterion | Tauri 2 | Electron | Why Tauri Wins Here |
|---|---|---|---|
| **Startup speed** | < 500ms | 2-5 seconds | Uses native OS webview, no bundled Chromium |
| **Binary size** | ~5-15 MB | ~150-300 MB | No Chromium/Node.js bundle |
| **Memory usage** | ~30-40 MB idle | ~150-300 MB idle | Native webview vs full Chromium |
| **Cross-platform** | Windows + macOS + Linux | Windows + macOS + Linux | Equal coverage; Tauri uses native webview per OS |
| **macOS support** | WKWebView, universal binary, notarization built-in | Chromium, universal binary, notarization via electron-notarize | Tauri's native webview = faster launch, less memory on macOS |
| **Build hassle** | `cargo tauri build` | electron-builder (notarization pain) | Tauri's CLI is simpler |
| **Security** | Rust core, capability-based IPC | Full Node.js access from renderer | Better isolation by default |
| **Ecosystem maturity** | Tauri 2.x stable (2024+) | 15+ years | Electron is more battle-tested, but Tauri 2 is production-ready |
| **React compatibility** | Full (via Vite) | Full (via Webpack/Vite) | Equal |
| **TDD** | Vitest + Testing Library + Tauri test utils | Jest + Testing Library | Equal, Vitest is faster |

**GSD-2 already has a Tauri bundled skill** (`tauri` and `tauri-ipc-developer`), so the GSD agent building this app has domain knowledge available.

### Cross-Platform Support (Windows, macOS, Linux)

Tauri 2 is fully cross-platform with first-class support for all three desktop operating systems. Each platform uses its **native OS webview** — no bundled browser engine — which is why startup and memory usage are dramatically better than Electron.

| Platform | Webview Engine | Installer Format | Notes |
|---|---|---|---|
| **Windows** | WebView2 (Chromium-based, ships with Win 10/11) | `.msi`, `.exe` (NSIS) | WebView2 is pre-installed on all modern Windows |
| **macOS** | WKWebView (built into macOS since 10.10) | `.dmg`, `.app` bundle | Best Tauri experience — Apple's own optimized engine |
| **Linux** | WebKitGTK | `.deb`, `.rpm`, `.AppImage` | Requires `libwebkitgtk-4.1` (installed on most desktop distros) |

#### macOS-Specific Details

| Concern | Status |
|---|---|
| **Apple Silicon (M1/M2/M3/M4)** | Tauri 2 builds universal binaries (arm64 + x86_64) out of the box |
| **Code signing / notarization** | Built-in support via `tauri.conf.json` — handles `codesign` + `notarytool` |
| **Dark mode** | Follows macOS system appearance automatically via `prefers-color-scheme` |
| **Native menus** | Tauri 2 supports native macOS menu bar, system tray, dock icon |
| **Permissions** | No special permissions needed — the app is a webview + child process spawner |
| **Startup** | < 500ms — WKWebView loads instantly, no cold-start penalty |
| **Binary size** | ~5-10 MB on macOS (vs ~200MB Electron equivalent) |

#### Build Prerequisites Per Platform

**macOS:**
```bash
xcode-select --install          # Xcode command line tools
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh  # Rust
# Node.js ≥ 22 (already installed if you use GSD)
```

**Windows:**
```bash
# Rust: https://rustup.rs (includes MSVC build tools)
# Node.js ≥ 22
# WebView2 is pre-installed on Windows 10/11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install libwebkitgtk-4.1-dev build-essential curl \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Known Webview Quirks

| Quirk | Impact | Mitigation |
|---|---|---|
| WKWebView (macOS) doesn't support `SharedArrayBuffer` without flags | None — our app does all heavy work via Tauri IPC → Rust → child processes, not Web Workers with shared memory | No action needed |
| WebKitGTK (Linux) may lag behind on CSS features | Minor — some bleeding-edge CSS may not render identically | Stick to well-supported CSS; Tailwind handles this well |
| WebView2 (Windows) auto-updates with Edge | Can introduce rendering changes between user sessions | Test against the current stable WebView2; use feature detection for edge cases |

### Why NOT reuse GSD's existing web interface (`gsd --web`)
The existing web UI is a **Next.js app** tightly coupled to the GSD monorepo (`web/` directory). It:
- Requires the full GSD source tree to build
- Uses `node-pty` for terminal embedding (Node.js dependency)
- Has Next.js webpack issues on Windows (build is skipped)
- Starts a Next.js dev/prod server — adds latency

Our GUI is a **standalone product** that communicates with GSD via the RPC protocol. It's decoupled, fast, and cross-platform including Windows.

### Frontend Libraries
| Library | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 6** | Build tool (HMR, fast builds) |
| **TypeScript 5.7+** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (Radix primitives + Tailwind) |
| **Zustand** | Lightweight state management (or Jotai for atomic state) |
| **TanStack Query (React Query)** | Server state, polling, caching for GSD data |
| **Recharts** | Cost/token charts (same as GSD web) |
| **xterm.js** | Embedded terminal for raw GSD output |
| **Vitest** | Unit + integration tests |
| **@testing-library/react** | Component testing |
| **Playwright** | E2E tests for the Tauri app |
| **Lucide React** | Icons (same as GSD web) |
| **Motion (Framer Motion)** | Animations |

---

## 3. Architecture — How the GUI Talks to GSD

### Communication Layer

```
┌──────────────────────────────────────────────────────────────┐
│  Tauri App (Rust core + Webview)                             │
│                                                              │
│  ┌─────────────────────────┐   ┌──────────────────────────┐  │
│  │  React Frontend          │   │  Rust Backend (Tauri)    │  │
│  │                          │   │                          │  │
│  │  Zustand stores ◄────────┼───┤  GSD Process Manager     │  │
│  │  React Query ◄───────────┼───┤  - spawn gsd child (RPC) │  │
│  │  Components              │   │  - JSONL stdin/stdout     │  │
│  │  xterm.js terminal       │   │  - event → SSE bridge    │  │
│  │                          │   │  - headless query         │  │
│  └─────────────────────────┘   └──────────────────────────┘  │
│           ▲                              │                    │
│           │ Tauri IPC (invoke/listen)    │                    │
│           └──────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  gsd --mode rpc  │  (per-project child process)
                    │  JSONL protocol  │
                    │                  │
                    │  stdin:  RpcCommand         (prompt, steer, set_model, ...)
                    │  stdout: AgentEvent          (tool calls, completions, UI requests)
                    │         + RpcResponse         (command acks, state, models)
                    │         + ExtensionUIRequest  (select, confirm, input, notify)
                    └──────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  gsd headless    │  (for quick reads — query, status, doctor)
                    │  query           │  → instant JSON snapshot (~50ms)
                    └──────────────────┘
```

### Key Design Decisions

1. **One RPC child per project.** When the user switches projects, the old child is stopped and a new one spawns. The RPC client (`gsd --mode rpc`) is the same protocol used by the VS Code extension and the web interface.

2. **`gsd headless query` for instant reads.** Project listing, state snapshots, and status checks use the headless query path (~50ms, no LLM session). This keeps the UI snappy.

3. **File system watching for `.gsd/`.** The Tauri backend watches `.gsd/STATE.md`, `metrics.json`, and roadmap files for changes. When auto mode (running in a separate terminal or headlessly) modifies files, the GUI updates in real-time. This supports the two-terminal workflow natively.

4. **The Rust layer is thin.** It manages child processes, file watchers, and IPC. All business logic stays in GSD. The GUI never parses `.gsd/` files directly — it reads them through GSD's APIs.

5. **Extension UI requests become GUI dialogs.** When GSD sends `extension_ui_request` (select, confirm, input), the Rust layer forwards it to React, which renders a proper dialog. The response is sent back via stdin.

### RPC Protocol Summary (from `rpc-types.ts`)

**Commands the GUI can send (stdin → GSD):**

| Command | Purpose |
|---|---|
| `prompt` | Send a user message (chat, `/gsd auto`, `/gsd discuss`, etc.) |
| `steer` | Interrupt with steering message mid-run |
| `follow_up` | Queue a follow-up for after current operation |
| `abort` | Abort current operation |
| `new_session` | Start a fresh session |
| `get_state` | Get current session state |
| `set_model` | Switch model |
| `get_available_models` | List available models |
| `get_session_stats` | Token/cost stats |
| `get_messages` | Get conversation history |
| `get_commands` | List available slash commands |
| `switch_session` | Resume a different session |
| `export_html` | Generate HTML report |

**Events the GUI receives (GSD → stdout):**

| Event | Purpose |
|---|---|
| `agent_start` / `agent_end` | Session lifecycle |
| `assistant_message` | LLM response (streaming tokens) |
| `tool_execution_start` / `tool_execution_end` | Tool calls |
| `extension_ui_request` | GSD needs user input (select, confirm, notify) |
| `session_state_changed` | Model switch, compaction, etc. |

---

## 4. Feature Map

### Tier 1 — Core (Must Have)

| # | Feature | GSD Equivalent | Notes |
|---|---|---|---|
| F01 | **Project Gallery** | `gsd sessions`, project folders | Grid/list of all GSD projects with status, last activity, cost |
| F02 | **New Project Wizard** | `/gsd` on empty folder | Step-by-step: name, folder, tech stack, description → creates `.gsd/` |
| F03 | **Brownfield Onboarding** | `/gsd` on existing code | "Import existing project" → opens folder, GSD detects code, starts discussion |
| F04 | **Chat / Discussion** | `/gsd discuss` | Full chat interface with the agent. Markdown rendering, code blocks, images |
| F05 | **Auto Mode Control** | `/gsd auto`, `/gsd stop`, Escape | Start/pause/stop buttons. Live progress stream |
| F06 | **Step Mode** | `/gsd`, `/gsd next` | "Next Step" button. Shows what completed, what's next |
| F07 | **Progress Dashboard** | `Ctrl+Alt+G`, `/gsd status` | Milestone/slice/task tree with completion %, cost, time, current activity |
| F08 | **Roadmap View** | `.gsd/milestones/M001/M001-ROADMAP.md` | Visual roadmap: slices as cards with risk levels, dependencies, status |
| F09 | **Session Browser** | `gsd sessions` | List of all chat sessions for the project. Search, filter, resume, rename |
| F10 | **Cost Overview** | `/gsd status` metrics | Total cost, per-phase breakdown, per-model breakdown, budget ceiling bar |
| F11 | **Configuration Panel** | `/gsd prefs`, `/gsd config` | Model selection, timeouts, budget, git settings, verification commands |
| F12 | **Model Selector** | `/model` | Dropdown to switch models. Per-phase model assignment UI |
| F13 | **Notification Center** | auto-mode notifications | Toast notifications for: task complete, slice done, errors, budget warnings |

### Tier 2 — Essential UX

| # | Feature | GSD Equivalent | Notes |
|---|---|---|---|
| F14 | **Milestone Queue** | `/gsd queue` | Drag-and-drop reordering of queued milestones |
| F15 | **Capture Inbox** | `/gsd capture` | Quick-input field always visible. Shows pending captures count |
| F16 | **Knowledge Base** | `.gsd/KNOWLEDGE.md` | View/edit the project's accumulated knowledge, rules, patterns |
| F17 | **Decisions Register** | `.gsd/DECISIONS.md` | Table of all architectural decisions with search/filter |
| F18 | **File Viewer** | `.gsd/` files | Read-only viewer for any `.gsd/` artifact (plans, summaries, UAT scripts) |
| F19 | **HTML Reports** | `/gsd export --html` | "Export Report" button. Opens generated HTML in default browser |
| F20 | **Doctor / Health** | `/gsd doctor` | Health check panel with issues, severity, auto-fix button |

### Tier 3 — Pro User (Hidden Gems → see Section 6)

| # | Feature | GSD Equivalent |
|---|---|---|
| F21 | Parallel orchestration | `/gsd parallel start/status/stop` |
| F22 | Forensics debugger | `/gsd forensics` |
| F23 | Dynamic model routing config | `dynamic_routing` in prefs |
| F24 | Token profile tuning | `token_profile`, `phases` overrides |
| F25 | Post-unit hooks editor | `post_unit_hooks` / `pre_dispatch_hooks` |
| F26 | Skill management | `/gsd skill-health`, skill routing rules |
| F27 | Remote questions setup | `/gsd remote discord/slack/telegram` |
| F28 | Worktree manager | `/worktree create/switch/merge/remove` |
| F29 | Git strategy config | `git.isolation`, `merge_strategy`, `auto_pr` |
| F30 | MCP server config | `.mcp.json` editor |
| F31 | Custom model definitions | `models.json` editor |
| F32 | Headless mode launcher | `gsd headless` with parameters |
| F33 | Activity log viewer | `/gsd logs` |
| F34 | Visualizer (deps, timeline) | `/gsd visualize` |
| F35 | Requirements tracker | `REQUIREMENTS.md` |
| F36 | RUNTIME.md editor | `.gsd/RUNTIME.md` |
| F37 | AGENTS.md editor | `AGENTS.md` instruction file |
| F38 | Reactive execution config | `reactive_execution` preference |
| F39 | Budget pressure visualization | Budget thresholds + model downgrade map |
| F40 | Routing history viewer | `.gsd/routing-history.json` |
| F41 | Steer during execution | `/gsd steer` |
| F42 | Undo last unit | `/gsd undo` |
| F43 | Skip a unit | `/gsd skip` |

---

## 5. Screen-by-Screen Design

### 5.1 Home — Project Gallery

```
┌─────────────────────────────────────────────────────────────────┐
│  GSD                                              [⚙] [👤]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  My Projects                           [+ New Project] [📂 Open]│
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ 🟢 TaskMgr  │ │ 🟡 EcomAPI  │ │ ⚪ BlogCMS  │               │
│  │             │ │             │ │             │               │
│  │ M002: Auth  │ │ M001/S03/T02│ │ No activity │               │
│  │ S02 executing│ │ Paused      │ │             │               │
│  │ $4.20 spent │ │ $12.40 spent│ │ $0.00       │               │
│  │ Last: 2h ago│ │ Last: 1d ago│ │ Created 3d  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  Recent Sessions                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TaskMgr  "Add rate limiting to auth endpoints"  2h ago  │    │
│  │ EcomAPI  "Discuss payment gateway options"      1d ago  │    │
│  │ TaskMgr  "/gsd auto — M002 execution"           3h ago  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Data sources:**
- Project list: scan `~/.gsd/projects/` + recent session folders
- Per-project status: `gsd headless query` (instant, ~50ms per project)
- Sessions: scan session directories via `getProjectSessionsDir()`

### 5.2 Project Workspace — Main View

The workspace uses a **sidebar + main area** layout with collapsible panels.

```
┌───────┬───────────────────────────────────────────────────────┐
│ Side  │  Main Area                                            │
│ bar   │                                                       │
│       │  ┌─ Tabs ──────────────────────────────────────────┐  │
│ 💬 Chat│  │ [Chat] [Progress] [Roadmap] [Sessions] [Files]  │  │
│ 📊 Dash│  └─────────────────────────────────────────────────┘  │
│ 🗺 Road│                                                       │
│ 📝 Sess│  ┌─ Chat View ───────────────────────────────────┐   │
│ 📁 Files│  │                                               │   │
│ ⚙ Conf │  │  [Agent messages with markdown rendering]      │   │
│ 🧪 Pro  │  │  [Tool call indicators]                       │   │
│       │  │  [Code blocks with syntax highlighting]        │   │
│       │  │                                               │   │
│       │  ├───────────────────────────────────────────────┤   │
│       │  │  💡 Capture: [quick input field........] [+]  │   │
│       │  ├───────────────────────────────────────────────┤   │
│       │  │  [Message input area]            [Send] [▶Auto]│   │
│       │  └───────────────────────────────────────────────┘   │
├───────┴───────────────────────────────────────────────────────┤
│ Status Bar: 🟢 M001/S02/T03 executing │ $4.20/$50 │ sonnet-4 │
└───────────────────────────────────────────────────────────────┘
```

### 5.3 Progress Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  M001: Task Manager MVP                    [▶ Auto] [⏸ Pause]│
│                                                             │
│  Overall: ████████░░░░░░░░ 52%    $4.20 / $50.00 budget    │
│                                                             │
│  ✅ S01: Data Model         3/3 tasks    $1.20    12 min    │
│  🔄 S02: Auth System        1/3 tasks    $2.10    ongoing   │
│     ✅ T01: Schema           $0.80                          │
│     🔄 T02: JWT Middleware   $1.30  (executing...)          │
│     ⬜ T03: Login Flow                                      │
│  ⬜ S03: API Endpoints       0/4 tasks                      │
│  ⬜ S04: Frontend            0/3 tasks                      │
│                                                             │
│  ┌─ Cost Breakdown ────────┐  ┌─ Phase Breakdown ─────────┐│
│  │  █████ Execution $3.00  │  │  █ Research    $0.50      ││
│  │  ██ Planning     $0.80  │  │  ██ Planning   $0.80      ││
│  │  █ Research      $0.40  │  │  █████ Execute $3.00      ││
│  └─────────────────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Roadmap View

Visual card layout with dependency arrows:

```
┌──────────────┐     ┌──────────────┐
│ S01: Data    │────→│ S02: Auth    │────→┐
│ Model  ✅    │     │ System  🔄   │     │   ┌──────────────┐
│ Risk: Low    │     │ Risk: Medium │     ├──→│ S04: Frontend│
└──────────────┘     └──────────────┘     │   │ ⬜           │
                     ┌──────────────┐     │   │ Risk: Medium │
                     │ S03: API     │────→┘   └──────────────┘
                     │ Endpoints ⬜ │
                     │ Risk: Low    │
                     └──────────────┘
```

Dependency lines rendered with SVG (same approach as GSD's HTML reports).

### 5.5 Session Browser

```
┌─────────────────────────────────────────────────────────────┐
│  Sessions                    [🔍 Search...] [Sort: Recent ▾]│
│                                                             │
│  ┌─ Thread View ────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  📌 Active Session                                   │   │
│  │  "Implementing JWT middleware for S02"                │   │
│  │  42 messages · 1h ago · $2.10                        │   │
│  │                                                      │   │
│  │  Previous Sessions                                   │   │
│  │  ├─ "M001 auto-mode execution"                       │   │
│  │  │   128 messages · 3h ago · $4.20                   │   │
│  │  │   └─ "Fix: auth schema migration"                 │   │
│  │  │       12 messages · 2h ago · $0.30                │   │
│  │  ├─ "Discuss: Auth system architecture"              │   │
│  │  │   24 messages · 1d ago · $0.80                    │   │
│  │  └─ "Initial project discussion"                     │   │
│  │      36 messages · 2d ago · $1.20                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Resume Selected] [Rename] [Export]                        │
└─────────────────────────────────────────────────────────────┘
```

**Data source:** `SessionBrowserResponse` from the bridge service API.

### 5.6 New Project Wizard

```
Step 1: Basics         Step 2: Details        Step 3: Go
──────────────         ───────────────        ──────────

[Project Name]         [Tech stack]           Summary of choices
[Location 📁]          [Constraints]          [Start with Discussion]
[○ New project]        [Description]          [Start Auto Mode]
[○ Existing code]                             [Just Create .gsd/]
```

### 5.7 Brownfield Onboarding

```
┌─────────────────────────────────────────────────────────────┐
│  Import Existing Project                                     │
│                                                             │
│  📂 Selected: /Users/you/projects/my-express-app            │
│                                                             │
│  GSD detected:                                              │
│  ✅ Git repository (main branch, 142 commits)               │
│  ✅ Node.js project (package.json found)                     │
│  ✅ TypeScript (tsconfig.json found)                         │
│  ✅ Express.js framework                                     │
│  ℹ️  No .gsd/ directory — will be created                    │
│                                                             │
│  [Start Discussion →]  [Skip to Auto Mode →]               │
│                                                             │
│  ── or migrate from GSD v1 ──                               │
│  📦 .planning/ directory detected                           │
│  [Migrate to GSD v2 →]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.8 Configuration Panel

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
│                                                             │
│  [General] [Models] [Git] [Budget] [Verification] [Advanced]│
│                                                             │
│  ── General ──                                              │
│  Token Profile:  [budget ▾] [balanced ▾] [quality ▾]        │
│  Workflow Mode:  [Solo ▾] [Team ▾]                          │
│  Skill Discovery: [auto ▾] [suggest ▾] [off ▾]             │
│                                                             │
│  ── Models (per phase) ──                                   │
│  Research:    [claude-sonnet-4-6 ▾]                         │
│  Planning:    [claude-opus-4-6 ▾]   + Fallback: [+ Add]    │
│  Execution:   [claude-sonnet-4-6 ▾]                         │
│  Completion:  [claude-sonnet-4-6 ▾]                         │
│                                                             │
│  ── Budget ──                                               │
│  Ceiling: [$50.00]  Enforcement: [pause ▾]                  │
│                                                             │
│  [Save] [Reset to Defaults]                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Pro User / Hidden Gems Area

Accessible via a **"Pro Tools" or "Advanced"** tab in the sidebar (collapsed by default, with a 🧪 beaker or ⚡ icon).

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Pro Tools                                                │
│                                                             │
│  ── Orchestration ──                                        │
│  [Parallel Milestones]  [Headless Launcher]  [Worktrees]    │
│                                                             │
│  ── Diagnostics ──                                          │
│  [Forensics]  [Doctor]  [Activity Logs]  [Routing History]  │
│                                                             │
│  ── Tuning ──                                               │
│  [Model Routing]  [Token Profiles]  [Hooks]  [Reactive Exec]│
│                                                             │
│  ── Integrations ──                                         │
│  [MCP Servers]  [Remote Questions]  [GitHub Sync]           │
│  [Custom Models]  [AGENTS.md]  [RUNTIME.md]                 │
│                                                             │
│  ── Data ──                                                 │
│  [Requirements]  [Decisions]  [Knowledge Base]              │
│  [Skill Health]  [Budget Pressure Map]                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Hidden Gem Features — Detailed

| Feature | What It Does | Why It's Pro |
|---|---|---|
| **Parallel Milestones** | GUI for `/gsd parallel start/status/stop/merge`. Worker status cards, per-worker cost, merge conflict resolution | Complex orchestration most users don't need |
| **Forensics Debugger** | Anomaly detection, unit traces, cost spikes, stuck loop analysis | Post-mortem investigation |
| **Routing History** | Visualize `.gsd/routing-history.json` — which models were picked for which tasks, success rates, adaptive learning state | Optimization deep-dive |
| **Hooks Editor** | YAML editor for `post_unit_hooks` and `pre_dispatch_hooks` with syntax validation and template snippets | Extension point for power users |
| **Headless Launcher** | Form to compose `gsd headless` commands with all flags, copy to clipboard or launch directly | CI/cron integration |
| **Worktree Manager** | List worktrees with merge status, dirty status, unpushed commits, age. One-click cleanup of merged worktrees | Git management |
| **MCP Server Config** | Visual editor for `.mcp.json` with test button (calls `mcp_servers` → `mcp_discover`) | Integration with external tools |
| **Custom Models** | Visual editor for `~/.gsd/agent/models.json`. Add Ollama, vLLM, LM Studio endpoints | Local model users |
| **Reactive Execution** | Toggle + dependency graph visualization of parallel task execution within a slice | Experimental feature |
| **Budget Pressure Map** | Visual showing how model tier assignments change at 50%/75%/90% budget thresholds | Cost optimization |
| **Skill Health** | Table with usage counts, success rates, token trends, staleness warnings per skill | Skill maintenance |
| **RUNTIME.md Editor** | Edit runtime context (API URLs, env vars, service ports) in a structured form | DevOps-oriented users |
| **Steer / Undo / Skip** | Buttons to hard-steer plans, undo last unit, or skip a unit during execution | Fine-grained control |
| **GitHub Sync** | Bootstrap and status for syncing milestones → GitHub Issues/PRs/Milestones | Team integration |

---

## 7. Data Contracts — What GSD Exposes

### 7.1 Instant State (`gsd headless query`)

```typescript
interface QuerySnapshot {
  state: {
    activeMilestone: { id: string; title: string } | null;
    activeSlice: { id: string; title: string } | null;
    activeTask: { id: string; title: string } | null;
    phase: Phase; // "executing" | "planning" | "researching" | etc.
    registry: Array<{ id: string; status: string; title?: string }>;
    progress: {
      milestones: { done: number; total: number };
      slices?: { done: number; total: number };
      tasks?: { done: number; total: number };
    };
    blockers: string[];
  };
  next: {
    action: 'dispatch' | 'stop' | 'skip';
    unitType?: string;
    unitId?: string;
    reason?: string;
  };
  cost: {
    workers: Array<{ milestoneId: string; cost: number; state: string }>;
    total: number;
  };
}
```

### 7.2 RPC Session State

```typescript
interface RpcSessionState {
  model?: { provider: string; id: string; contextWindow: number };
  thinkingLevel: ThinkingLevel;
  isStreaming: boolean;
  sessionFile?: string;
  sessionId: string;
  sessionName?: string;
  messageCount: number;
  extensionsReady: boolean;
}
```

### 7.3 Session Browser (REST-like from bridge)

```typescript
interface SessionBrowserSession {
  id: string;
  path: string;
  name?: string;
  createdAt: string;
  modifiedAt: string;
  messageCount: number;
  firstMessage: string;
  isActive: boolean;
  depth: number; // for thread tree
}
```

### 7.4 Metrics Ledger (`metrics.json`)

```typescript
interface UnitMetrics {
  type: string;       // "execute-task", "plan-slice", etc.
  id: string;         // "M001/S01/T01"
  model: string;
  tokens: { input: number; output: number; total: number };
  cost: number;       // USD
  toolCalls: number;
  tier?: string;      // "light" | "standard" | "heavy"
}
```

---

## 8. Error Handling & Recovery Flows

### 8.1 GSD Child Process Crashes

```
GUI detects: child process exited unexpectedly
  → Show toast: "GSD session crashed. [Restart] [View Logs]"
  → On restart: spawn new RPC child; GSD reads disk state + crash recovery
  → Auto-mode resumes from last completed unit
```

### 8.2 Provider Errors (Rate Limit, Server Error)

```
GUI receives: extension_ui_request with "rate limit" or "server error" message
  → Show non-blocking banner: "Rate limited. Auto-resuming in 60s..."
  → Countdown timer visible
  → User can click "Resume Now" or "Switch Model"
```

### 8.3 Budget Ceiling Reached

```
GUI receives: notification "Budget ceiling reached"
  → Show modal: "Budget of $50.00 reached."
  → Options: [Increase Budget] [Switch to Budget Profile] [Stop]
  → "Increase Budget" opens inline editor for budget_ceiling
```

### 8.4 Stuck Loop Detected

```
GUI receives: notification "Loop detected on M001/S02/T03"
  → Show alert panel with:
    - Which unit is stuck
    - Last 5 dispatch events
    - [View Forensics] [Edit Task Plan] [Skip Unit] [Retry]
```

### 8.5 Extension UI Requests → GUI Dialogs

| GSD sends | GUI renders |
|---|---|
| `method: "select"` | Dropdown or radio group dialog |
| `method: "confirm"` | Yes/No modal |
| `method: "input"` | Text input modal |
| `method: "editor"` | Code editor modal (Monaco/CodeMirror) |
| `method: "notify"` | Toast notification |
| `method: "setStatus"` | Status bar update |
| `method: "setWidget"` | Dashboard widget update |

---

## 9. TDD Strategy

### 9.1 Testing Layers

| Layer | Tool | What Gets Tested |
|---|---|---|
| **Unit** | Vitest | Zustand stores, utility functions, data transformers, hooks |
| **Component** | Vitest + @testing-library/react | Each UI component in isolation with mocked data |
| **Integration** | Vitest | Store ↔ component interaction, RPC message handling |
| **Service** | Vitest | Tauri IPC command handlers (mock child process) |
| **E2E** | Playwright + @tauri-apps/cli test | Full app flows (create project, run auto, check progress) |

### 9.2 TDD Workflow per Feature

```
1. Write failing test(s) for the feature
2. Implement minimum code to pass
3. Refactor
4. Write component test with mocked GSD responses
5. Write integration test with real RPC message flow (mocked child process)
```

### 9.3 Mock Strategy

**GSD Mock Server:** A mock that implements the JSONL protocol and replays recorded sessions. This lets us test the full GUI without a real GSD installation.

```typescript
// test/mocks/gsd-mock-server.ts
class MockGsdServer {
  handleCommand(cmd: RpcCommand): RpcResponse { /* ... */ }
  emitEvent(event: AgentEvent): void { /* ... */ }
  // Pre-recorded scenarios:
  static scenarios = {
    newProject: [...],      // discussion → roadmap → auto
    autoModeRun: [...],     // executing tasks with progress
    rateLimit: [...],       // provider error + resume
    stuckLoop: [...],       // stuck detection → diagnostics
  }
}
```

### 9.4 Test File Convention

```
src/
  components/
    project-gallery/
      ProjectGallery.tsx
      ProjectGallery.test.tsx    ← component test
      ProjectCard.tsx
      ProjectCard.test.tsx
  stores/
    project-store.ts
    project-store.test.ts        ← unit test
  services/
    gsd-rpc-client.ts
    gsd-rpc-client.test.ts       ← service test
  hooks/
    use-gsd-state.ts
    use-gsd-state.test.ts        ← hook test
tests/
  e2e/
    create-project.spec.ts       ← E2E test
    auto-mode.spec.ts
```

---

## 10. Implementation Phases & GSD Agent Prompts

### Phase 1: Project Scaffolding & Core Shell

**What:** Tauri 2 + React + Vite + Tailwind + shadcn/ui project. App shell with sidebar, routing, theme (dark/light). No GSD integration yet.

**GSD Agent Prompt:**

```
Create a new Tauri 2 desktop application in D:\AiProjects\gsd-gui with the following stack:
- Tauri 2 (latest stable) with Rust backend
- React 19 + TypeScript 5.7+
- Vite 6 as build tool
- Tailwind CSS 4
- shadcn/ui component library (initialize with "new-york" style, dark mode)
- Zustand for state management
- TanStack Query (React Query) for async data
- Vitest + @testing-library/react for tests
- Lucide React for icons

Project structure:
- src/              → React frontend
  - components/     → UI components (one folder per component with co-located tests)
  - stores/         → Zustand stores
  - services/       → GSD communication layer (RPC client, headless query)
  - hooks/          → Custom React hooks
  - lib/            → Utilities, types, constants
  - pages/          → Top-level route components
- src-tauri/        → Tauri Rust backend
  - src/            → Rust commands and process management
- tests/
  - e2e/            → Playwright E2E tests
  - mocks/          → Mock GSD server for testing

The app shell should have:
1. A responsive sidebar with navigation icons (Chat, Dashboard, Roadmap, Sessions, Files, Config, Pro)
2. A main content area with tab-based navigation
3. A status bar at the bottom
4. Dark/light theme toggle using next-themes pattern
5. A "Home" / project gallery as the default view

Write tests FIRST (TDD):
- Test that the sidebar renders all navigation items
- Test that clicking nav items switches the main content
- Test that the status bar displays
- Test theme toggle works

Use shadcn/ui components: Sidebar, Tabs, Button, Badge, Tooltip.
The Tauri window should start at 1200x800 with a minimum of 900x600.
Title: "GSD" with the app icon.

Do NOT implement any GSD integration yet — this phase is pure shell.
Verification: npm run test should pass, npm run dev should show the app shell.
```

---

### Phase 2: GSD Process Manager (Tauri Backend)

**What:** Rust-side process management — spawning `gsd --mode rpc`, JSONL communication, `gsd headless query`.

**GSD Agent Prompt:**

```
Implement the GSD process manager in the Tauri backend (src-tauri/) for gsd-gui.

Requirements:
1. A Rust module `gsd_process.rs` that:
   - Spawns `gsd --mode rpc` as a child process for a given project directory
   - Reads JSONL lines from the child's stdout
   - Writes JSONL commands to the child's stdin
   - Detects child process crashes and reports them
   - Supports graceful shutdown (SIGTERM → wait → SIGKILL)
   - Only one child per project at a time

2. A Rust module `gsd_query.rs` that:
   - Runs `gsd headless query` in a given directory
   - Parses the JSON output
   - Returns the QuerySnapshot as a serialized struct

3. Tauri commands (invoke-able from React):
   - `start_gsd_session(project_path: String)` → starts RPC child
   - `stop_gsd_session()` → stops current child
   - `send_gsd_command(command: String)` → writes JSONL to stdin
   - `query_gsd_state(project_path: String)` → runs headless query, returns JSON
   - `list_projects()` → scans ~/.gsd/projects/ and returns project paths

4. Tauri events (emitted to React frontend):
   - `gsd-event` → forwards every JSONL line from the child's stdout
   - `gsd-process-exit` → emitted when child exits (with exit code)
   - `gsd-process-error` → emitted on spawn/communication errors

5. File watcher:
   - Watch `.gsd/STATE.md` and `.gsd/metrics.json` for changes
   - Emit `gsd-file-changed` event with the file path
   - Use notify-rs crate for cross-platform file watching

Write Rust unit tests for:
- JSONL line parsing
- Command serialization
- Process lifecycle (start → send → receive → stop)
- Query result parsing

The `gsd` binary path should be resolved by checking:
1. `GSD_BIN_PATH` environment variable
2. `which gsd` / `where gsd` on PATH
3. Common npm global paths

Do NOT implement any React frontend changes yet.
Verification: cargo test should pass.
```

---

### Phase 3: React ↔ Tauri Bridge & State Management

**What:** React hooks and stores that consume Tauri events and provide GSD state to components.

**GSD Agent Prompt:**

```
Implement the React-side GSD integration layer for gsd-gui.

Requirements:

1. `src/services/gsd-client.ts` — Tauri IPC wrapper:
   - `startSession(projectPath: string): Promise<void>`
   - `stopSession(): Promise<void>`
   - `sendCommand(command: RpcCommand): Promise<void>`
   - `queryState(projectPath: string): Promise<QuerySnapshot>`
   - `listProjects(): Promise<ProjectInfo[]>`
   - Subscribe to `gsd-event`, `gsd-process-exit`, `gsd-process-error` Tauri events

2. `src/stores/gsd-store.ts` — Zustand store:
   - `state: QuerySnapshot | null` — current GSD state
   - `sessionState: RpcSessionState | null` — RPC session info
   - `messages: AgentMessage[]` — conversation history
   - `isConnected: boolean` — whether RPC child is running
   - `isStreaming: boolean` — whether agent is currently responding
   - `pendingUIRequests: ExtensionUIRequest[]` — queued UI prompts
   - Actions: `connect(path)`, `disconnect()`, `sendPrompt(msg)`, `respondToUIRequest(id, response)`

3. `src/stores/project-store.ts` — Zustand store:
   - `projects: ProjectInfo[]` — list of known projects
   - `activeProject: ProjectInfo | null`
   - `recentSessions: SessionInfo[]`
   - Actions: `loadProjects()`, `selectProject(id)`, `createProject(opts)`, `importProject(path)`

4. `src/hooks/use-gsd-state.ts` — React hook:
   - Returns current GSD state with auto-polling via TanStack Query
   - Refreshes on `gsd-file-changed` events
   - Provides `phase`, `progress`, `cost`, `activeMilestone`, etc.

5. `src/hooks/use-gsd-events.ts` — React hook:
   - Subscribes to the GSD event stream
   - Dispatches events to the appropriate store actions
   - Handles extension_ui_request routing

6. `src/lib/types.ts` — TypeScript types:
   - Mirror the GSD RPC types (RpcCommand, RpcResponse, AgentEvent, ExtensionUIRequest, QuerySnapshot)
   - These should be manually defined (not imported from GSD source)

Write tests FIRST:
- gsd-store: test state transitions (idle → connecting → connected → streaming)
- gsd-store: test message accumulation from events
- gsd-store: test UI request queuing and response
- project-store: test project loading and selection
- use-gsd-state hook: test polling and event-driven refresh
- gsd-client: test with mocked Tauri invoke/listen

Create `tests/mocks/mock-gsd-events.ts` with pre-recorded event sequences for:
- A successful auto-mode run (start → tool calls → task complete → slice complete)
- A discussion session (prompt → response → prompt → response)
- An error scenario (rate limit → auto-resume)

Verification: npm run test should pass all new tests.
```

---

### Phase 4: Project Gallery & New Project Wizard

**What:** Home screen with project cards, new project creation, brownfield import.

**GSD Agent Prompt:**

```
Implement the Project Gallery (home screen) and New Project Wizard for gsd-gui.

Requirements:

1. `ProjectGallery` component:
   - Grid of project cards showing: name, status indicator (green/yellow/gray), current milestone/slice, cost, last activity
   - "New Project" button and "Open Existing" button
   - "Recent Sessions" list below the grid
   - Empty state when no projects exist
   - Search/filter for projects
   - Each card is clickable → navigates to the project workspace

2. `ProjectCard` component:
   - Shows project name, phase badge, progress bar, cost, last activity time
   - Status indicators: 🟢 active/executing, 🟡 paused/blocked, ⚪ idle/no activity
   - Click opens the project workspace

3. `NewProjectWizard` component (multi-step dialog):
   - Step 1: Project name, folder path (with native directory picker via Tauri dialog), project type (new/existing)
   - Step 2: Description, tech stack preferences, constraints (free-form text areas)
   - Step 3: Summary + action choice (Start Discussion / Start Auto / Just Initialize)
   - On submit: creates the project folder (if new), calls `gsd headless new-milestone --context-text "<description>"`
   - For existing code: detects .git, package.json, etc. and shows detected stack

4. `BrownfieldImporter` component:
   - Native folder picker
   - Detects: git status, package.json, language files, existing .gsd/ or .planning/
   - Shows detection results
   - Offers: "Start Discussion", "Skip to Auto", "Migrate from v1" (if .planning/ found)
   - On import: calls `startSession(selectedPath)` and sends `/gsd` prompt

Write tests FIRST:
- ProjectGallery: renders project cards from store data
- ProjectGallery: empty state when no projects
- ProjectGallery: search filters projects by name
- ProjectCard: displays correct status colors
- ProjectCard: click calls navigate
- NewProjectWizard: step navigation (next/back)
- NewProjectWizard: validates required fields
- NewProjectWizard: submit calls correct GSD commands
- BrownfieldImporter: detects project type from file list

Use shadcn/ui: Card, Button, Input, Dialog, Steps (or custom stepper), Badge, Command (for search).
Verification: npm run test should pass.
```

---

### Phase 5: Chat Interface & Auto Mode Controls

**GSD Agent Prompt:**

```
Implement the Chat interface and Auto Mode controls for gsd-gui.

Requirements:

1. `ChatView` component:
   - Scrollable message list with alternating user/assistant messages
   - Assistant messages rendered as Markdown (react-markdown + remark-gfm)
   - Code blocks with syntax highlighting (shiki)
   - Tool call indicators (collapsible: "Used tool: Read file.ts" with expand to see details)
   - Streaming indicator when agent is responding
   - Auto-scroll to bottom on new messages

2. `MessageInput` component:
   - Multi-line text input (auto-growing textarea)
   - Send button (also Enter to send, Shift+Enter for newline)
   - Disabled while agent is streaming
   - Slash command autocomplete (/ triggers command list from `get_commands`)

3. `AutoModeControls` component:
   - "▶ Start Auto" button → sends `/gsd auto` prompt
   - "⏸ Pause" button (visible during auto) → sends `/gsd stop`
   - "⏭ Next Step" button → sends `/gsd next`
   - "Quick Task" button → sends `/gsd quick`
   - Status indicator: "Auto mode running..." with elapsed time
   - "Steer" button → opens text input that sends via `steer` RPC command

4. `CaptureInput` component:
   - Always-visible quick input field above the main input
   - "💡 Capture:" prefix
   - Submit sends `/gsd capture "<text>"` prompt
   - Badge showing pending capture count

5. `UIRequestDialog` component:
   - Renders GSD's extension_ui_request as proper GUI dialogs:
     - `select` → Radio group or dropdown
     - `confirm` → Yes/No buttons
     - `input` → Text field
     - `notify` → Toast notification (non-blocking)
   - Auto-dismisses after timeout if specified
   - Response sent back via Tauri IPC → stdin

Write tests FIRST:
- ChatView: renders messages correctly (user, assistant, tool calls)
- ChatView: auto-scrolls on new messages
- ChatView: renders markdown and code blocks
- MessageInput: sends on Enter, newline on Shift+Enter
- MessageInput: disabled during streaming
- AutoModeControls: shows correct buttons for each state
- UIRequestDialog: renders select/confirm/input correctly
- UIRequestDialog: sends response on user action
- CaptureInput: sends capture command

Verification: npm run test should pass.
```

---

### Phase 6: Progress Dashboard, Roadmap, Cost Charts

**GSD Agent Prompt:**

```
Implement the Progress Dashboard, Roadmap View, and Cost Charts for gsd-gui.

Requirements:

1. `ProgressDashboard` component:
   - Milestone/slice/task tree view with completion indicators (✅ 🔄 ⬜)
   - Overall progress bar with percentage
   - Current activity indicator ("Executing M001/S02/T03...")
   - Per-slice cost and duration
   - Expandable/collapsible tree nodes

2. `RoadmapView` component:
   - Card-based layout for slices
   - Dependency arrows between cards (SVG lines)
   - Risk level badges (Low=green, Medium=yellow, High=red)
   - Status badges (Done, In Progress, Pending, Blocked)
   - Click card to expand → shows tasks and description

3. `CostOverview` component:
   - Budget ceiling bar (used/remaining with color zones: green/yellow/red)
   - Cost breakdown by phase (bar chart using Recharts)
   - Cost breakdown by model (pie or bar chart)
   - Cost projection for remaining work
   - Per-slice cost table

4. Data fetching:
   - Use TanStack Query to poll `gsd headless query` every 2 seconds
   - Parse metrics.json for detailed cost data
   - Parse ROADMAP.md for slice/dependency data (via headless query state)

Write tests FIRST:
- ProgressDashboard: renders tree from GSD state
- ProgressDashboard: correct completion indicators
- RoadmapView: renders slice cards with dependencies
- RoadmapView: correct risk/status badges
- CostOverview: budget bar shows correct percentages
- CostOverview: charts render from metrics data

Use shadcn/ui: Collapsible, Badge, Progress, Card, Table.
Use Recharts for charts (BarChart, PieChart).
Verification: npm run test should pass.
```

---

### Phase 7: Session Browser & Configuration Panel

**GSD Agent Prompt:**

```
Implement the Session Browser and Configuration Panel for gsd-gui.

Requirements:

1. `SessionBrowser` component:
   - List of all sessions for the active project
   - Thread view (parent-child relationships shown with indentation)
   - Search bar with fuzzy matching on session name and first message
   - Sort options: Recent, Threaded, Relevance
   - Per-session metadata: name, message count, date, cost, first message preview
   - Active session highlighted
   - Actions: Resume (switch_session RPC), Rename (input dialog), Export HTML

2. `ConfigPanel` component with tabs:
   - General: token_profile selector, workflow mode, skill_discovery
   - Models: per-phase model selection with dropdowns populated from get_available_models
   - Git: isolation mode, merge strategy, auto_push, commit_docs toggles
   - Budget: ceiling input, enforcement mode selector
   - Verification: command list editor (add/remove/reorder), auto_fix toggle, max_retries
   - Advanced tab → links to Pro Tools area

3. `ModelSelector` component:
   - Dropdown with all available models grouped by provider
   - Current model highlighted
   - Per-phase assignment with fallback list management
   - "Test Connection" button

4. Data:
   - Session list from bridge service session browser API
   - Config from preferences.md parsing (via headless or file read)
   - Config saves write to .gsd/preferences.md

Write tests FIRST:
- SessionBrowser: renders sessions from mock data
- SessionBrowser: search filters sessions
- SessionBrowser: resume calls switch_session
- ConfigPanel: renders all settings from preferences
- ConfigPanel: save writes correct YAML
- ModelSelector: populates from available models list

Verification: npm run test should pass.
```

---

### Phase 8: Pro Tools Area

**GSD Agent Prompt:**

```
Implement the Pro Tools area for gsd-gui — the advanced features section accessible from the sidebar.

Requirements:

1. `ProToolsLayout` component:
   - Grid of tool cards organized by category (Orchestration, Diagnostics, Tuning, Integrations, Data)
   - Each card opens a focused panel/dialog

2. Implement these panels (each as a separate component):

   a. `ParallelPanel`: Start/stop/status for parallel milestone workers. Worker cards with progress and cost.
   b. `ForensicsPanel`: Run `/gsd forensics`. Show anomaly list, unit traces, cost analysis.
   c. `DoctorPanel`: Run `/gsd doctor`. Show issues with severity. "Fix" button for auto-fixable issues.
   d. `WorktreePanel`: List worktrees with merge/dirty/unpushed status. Cleanup button for safe-to-remove.
   e. `HooksEditor`: YAML form editor for post_unit_hooks and pre_dispatch_hooks with validation.
   f. `RoutingHistoryPanel`: Table of routing decisions from routing-history.json with success rates.
   g. `SkillHealthPanel`: Table of skills with usage count, success%, token trend, staleness warning.
   h. `RemoteQuestionsSetup`: Setup wizard for Slack/Discord/Telegram with test message.
   i. `MCPServersPanel`: Editor for .mcp.json with "Test Connection" button.
   j. `HeadlessLauncher`: Form builder for gsd headless commands with all flags.
   k. `KnowledgeEditor`: View/edit KNOWLEDGE.md with categorized entries (rules, patterns, lessons).
   l. `DecisionsTable`: Searchable/filterable table of DECISIONS.md entries.
   m. `RequirementsTracker`: Table of REQUIREMENTS.md with status badges.
   n. `RuntimeEditor`: Structured form for RUNTIME.md (API endpoints, env vars, services).
   o. `AgentsEditor`: Edit AGENTS.md with preview.
   p. `ActivityLogViewer`: Scrollable JSONL log viewer with filters.
   q. `BudgetPressureMap`: Visual showing model tier changes at budget thresholds.
   r. `CustomModelsEditor`: JSON editor for ~/.gsd/agent/models.json with validation.
   s. `VisualizerView`: Port of GSD's 4-tab visualizer (Progress, Dependencies, Metrics, Timeline).

3. Each panel that runs a GSD command should:
   - Show a loading state while the command runs
   - Display results in a structured format
   - Handle errors gracefully with retry options

Write tests for each panel:
- Renders correctly with mock data
- Handles loading/error states
- User actions trigger correct GSD commands

Verification: npm run test should pass.
```

---

### Phase 9: Polish, E2E Tests, Packaging

**GSD Agent Prompt:**

```
Final polish and packaging for gsd-gui.

Requirements:

1. E2E tests with Playwright:
   - Test: Launch app → project gallery is shown
   - Test: Create new project → wizard completes → project appears in gallery
   - Test: Open project → workspace shows chat tab
   - Test: Send message → response appears in chat
   - Test: Start auto mode → progress updates in dashboard
   - Test: Open settings → change model → save → verified
   - Test: Open pro tools → doctor runs → results displayed

2. Polish:
   - Loading skeletons for all async content
   - Keyboard shortcuts: Ctrl+N (new project), Ctrl+1-7 (switch tabs), Escape (pause auto)
   - Window title shows project name and current phase
   - Notification toast system for GSD events
   - Responsive layout (minimum 900x600)
   - Smooth animations for tab switches and panel transitions (Motion/Framer)

3. Packaging:
   - Configure Tauri for all three platforms:
     - Windows: `.msi` (WiX) and `.exe` (NSIS) installers
     - macOS: `.dmg` installer with universal binary (arm64 + x86_64 for Apple Silicon + Intel)
     - Linux: `.deb`, `.rpm`, and `.AppImage`
   - macOS code signing and notarization:
     - Configure signing identity in `tauri.conf.json` under `bundle.macOS`
     - Set up `notarytool` for Apple notarization (requires Apple Developer account)
     - Document the signing environment variables for CI (`APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_TEAM_ID`)
   - App icon: provide icon source as 1024x1024 PNG; Tauri generates `.icns` (macOS), `.ico` (Windows), and PNGs (Linux)
   - Version from package.json
   - Auto-updater configuration (Tauri's built-in updater with GitHub Releases backend)
   - Ensure `gsd` binary is found on PATH (show setup instructions if not found)
   - CI/CD: GitHub Actions workflow matrix for all three platforms

4. Documentation:
   - README.md with screenshots, install instructions, development guide
   - CONTRIBUTING.md
   - Architecture diagram

Verification: npm run test (unit), npm run test:e2e (Playwright), cargo tauri build completes.
```

---

## Appendix A: File & Folder Structure

```
gsd-gui/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── gsd_process.rs      ← child process management
│       ├── gsd_query.rs        ← headless query runner
│       └── file_watcher.rs     ← .gsd/ file watching
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx            ← project gallery
│   │   └── Workspace.tsx       ← project workspace shell
│   ├── components/
│   │   ├── app-shell/
│   │   ├── project-gallery/
│   │   ├── new-project-wizard/
│   │   ├── brownfield-importer/
│   │   ├── chat/
│   │   ├── auto-mode-controls/
│   │   ├── progress-dashboard/
│   │   ├── roadmap-view/
│   │   ├── cost-overview/
│   │   ├── session-browser/
│   │   ├── config-panel/
│   │   ├── model-selector/
│   │   ├── ui-request-dialog/
│   │   ├── capture-input/
│   │   ├── notification-center/
│   │   ├── status-bar/
│   │   └── pro-tools/
│   │       ├── ProToolsLayout.tsx
│   │       ├── parallel-panel/
│   │       ├── forensics-panel/
│   │       ├── doctor-panel/
│   │       ├── worktree-panel/
│   │       ├── hooks-editor/
│   │       ├── routing-history/
│   │       ├── skill-health/
│   │       ├── remote-questions/
│   │       ├── mcp-servers/
│   │       ├── headless-launcher/
│   │       ├── knowledge-editor/
│   │       ├── decisions-table/
│   │       ├── requirements-tracker/
│   │       ├── runtime-editor/
│   │       ├── agents-editor/
│   │       ├── activity-log/
│   │       ├── budget-pressure/
│   │       ├── custom-models/
│   │       └── visualizer/
│   ├── stores/
│   │   ├── gsd-store.ts
│   │   ├── project-store.ts
│   │   └── ui-store.ts
│   ├── services/
│   │   ├── gsd-client.ts
│   │   └── file-reader.ts
│   ├── hooks/
│   │   ├── use-gsd-state.ts
│   │   ├── use-gsd-events.ts
│   │   └── use-project.ts
│   ├── lib/
│   │   ├── types.ts            ← GSD protocol types
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── tests/
│   ├── e2e/
│   │   └── *.spec.ts
│   └── mocks/
│       ├── mock-gsd-server.ts
│       └── mock-gsd-events.ts
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Appendix B: Risk Assessment

| Risk | Mitigation |
|---|---|
| **GSD binary not found** | Check on startup, show setup instructions with install command |
| **RPC protocol changes** | Pin GSD version in README; the RPC protocol is stable and used by VS Code extension |
| **Tauri webview quirks** | Use standard HTML/CSS; avoid bleeding-edge APIs; test on all 3 platforms |
| **macOS notarization** | Configure signing identity in `tauri.conf.json`; CI builds via GitHub Actions with Apple Developer certificate |
| **macOS Gatekeeper** | Unsigned dev builds trigger "unidentified developer" warning; document `xattr -cr` workaround for local dev; production builds must be signed + notarized |
| **Linux WebKitGTK availability** | Document `libwebkitgtk-4.1-dev` as prerequisite; AppImage bundles runtime dependencies |
| **WebView2 missing on old Windows** | Tauri includes a WebView2 bootstrapper that auto-installs it; fallback dialog if offline |
| **File watcher performance** | Debounce events; only watch specific files, not entire `.gsd/` tree |
| **Large session histories** | Virtualized list rendering (react-window or TanStack Virtual) |
| **Windows path issues** | Normalize paths everywhere; use Tauri's path API; test with spaces and Unicode |
| **Multiple GSD versions** | Display GSD version in status bar; warn if version is too old |
| **Apple Silicon + Intel compatibility** | Tauri builds universal binaries by default; CI matrix tests both architectures |

---

*This document serves as the complete specification for building gsd-gui. Each phase prompt is self-contained and ready for a GSD agent to execute.*
