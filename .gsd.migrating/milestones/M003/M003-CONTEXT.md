---
depends_on: [M002]
---

# M003: Core Screens

**Gathered:** 2026-03-25
**Status:** Ready for planning

## Project Description

M003 replaces all placeholder pages with functional, store-connected UI screens. Two major areas: (1) Project management — gallery with real data from project-store, new project wizard with Tauri native folder picker, brownfield import; (2) Chat & execution control — chat interface with markdown rendering, streaming, tool call indicators, auto/step mode controls, and extension_ui_request dialogs.

After M003, the app is a usable GSD client: users can browse projects, create new ones, chat with GSD, run auto mode, and respond to UI requests — all through the GUI.

## Why This Milestone

M002 built the nervous system (IPC bridge, stores, hooks). M003 builds the face — the screens users actually interact with. Without this, the app is a wired-up shell with placeholder pages. The chat interface is the highest-risk component: markdown rendering, streaming message accumulation, code syntax highlighting, and auto-scroll must all work together smoothly.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See a grid of real GSD projects with status, cost, and last activity
- Create a new project via a multi-step wizard with native folder picker
- Import an existing code project with auto-detection of git, languages, existing .gsd/
- Chat with GSD: send messages, see markdown-rendered responses with code blocks
- See streaming responses as they arrive (character by character)
- See tool call indicators (collapsible "Used tool: X" entries)
- Start/pause/stop auto mode with dedicated buttons
- Use "Next Step" for step mode execution
- Steer auto mode mid-execution
- Respond to extension_ui_request dialogs (select, confirm, input, notify)

## Completion Class

- Contract complete: All tests pass (npm run test), build succeeds, all 6 requirements advanced
- Integration complete: Stores drive UI, chat sends/receives via gsd-client, auto mode controls map to RPC commands
- Operational complete: Streaming works without jank, auto-scroll is smooth, empty states are informative

## Risks and Unknowns

- **Markdown rendering performance** — react-markdown + shiki for syntax highlighting could cause jank with large messages. Risk: medium. Retire in chat slice.
- **Streaming message accumulation** — Appending to messages array on every token could cause re-render storms. Need to batch updates or use refs. Risk: medium. Retire in chat slice.
- **Tauri dialog API for folder picker** — Need @tauri-apps/plugin-dialog. May require Tauri plugin setup in Cargo.toml. Risk: low. Retire in wizard slice.
- **shadcn/ui component availability** — May need to install additional components (Card, Dialog, Tabs, ScrollArea, RadioGroup, etc). Risk: low.

## Scope

### In Scope

- ProjectGallery: grid of project cards from project-store, search/filter, empty state
- ProjectCard: name, status indicator, milestone, progress bar, cost, last activity
- NewProjectWizard: 3-step dialog (basics → details → go), native folder picker, submit creates project
- BrownfieldImporter: folder picker, auto-detection, import flow
- ChatView: scrollable message list, markdown rendering, code blocks, streaming indicator, auto-scroll
- MessageInput: multi-line textarea, Enter to send, Shift+Enter newline, disabled while streaming
- AutoModeControls: start/pause/stop/next/steer buttons with state-aware visibility
- UIRequestDialog: select/confirm/input/notify rendering with response routing
- Additional shadcn/ui components as needed (Card, Dialog, ScrollArea, Tabs, RadioGroup, Textarea, etc.)

### Out of Scope

- Progress dashboard / milestone tree view (M004)
- Roadmap visualization with SVG dependency arrows (M004)
- Cost charts with Recharts (M004)
- Session browser (M004)
- Configuration panel (M004)
- Pro tools panels (M005)

## Relevant Requirements

- R016 — Project gallery with status, cost, last activity (primary owner)
- R017 — New project wizard (primary owner)
- R018 — Import existing projects with detection (primary owner)
- R019 — Chat interface with markdown, code blocks, streaming (primary owner)
- R020 — Auto/step mode controls (primary owner)
- R021 — extension_ui_request as GUI dialogs (primary owner)

## Technical Constraints

- TDD — tests written before implementation (D006)
- Only gsd-client.ts imports @tauri-apps/api (D005)
- New Tauri plugin imports (e.g. @tauri-apps/plugin-dialog) must also go through gsd-client.ts
- All stores already exist (gsd-store, project-store, ui-store) — screens consume them
- shadcn/ui new-york style, Tailwind CSS 4, lucide-react icons

## Slice Strategy

Order by risk, with dependencies:
1. **S01: shadcn/ui components + shared UI primitives** — Install needed components, build any shared pieces (empty state, loading state)
2. **S02: Project gallery & card** — R016. First real data-connected screen. Low-medium risk.
3. **S03: New project wizard & import** — R017, R018. Tauri dialog integration. Medium risk.
4. **S04: Chat view & message input** — R019. Markdown rendering + streaming. Highest risk.
5. **S05: Auto mode controls & UI request dialogs** — R020, R021. Depends on chat view context.
