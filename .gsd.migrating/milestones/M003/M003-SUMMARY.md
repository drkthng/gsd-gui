# M003: Core Screens — Milestone Summary

**Status:** Complete
**Completed:** 2026-03-25

## One-Liner

Replaced all placeholder pages with functional, store-connected UI — project gallery, 3-step wizard, chat with markdown/streaming, auto mode controls, and UI request dialogs. 182 tests across 23 files.

## Narrative

M003 delivered the user-facing screens that make the app a functional GSD client across 5 slices:

**S01** — Installed 11 shadcn/ui components + EmptyState/LoadingState shared primitives. **S02** — ProjectCard (status/progress/cost) + ProjectGallery (store-connected, search, empty/loading/error states). **S03** — NewProjectWizard (3-step: name+path → description+stack → summary+create). **S04** — ChatMessage (markdown via react-markdown), ChatView (streaming, auto-scroll), MessageInput (Enter to send). **S05** — AutoModeControls (start/pause/next/steer), UIRequestDialog (confirm/select/input dialogs).

## Success Criteria Results

- ✅ Project gallery shows real data from project-store with search/filter and empty state
- ✅ New project wizard completes 3-step flow
- ⚠️ Import — path input exists; native Tauri folder picker deferred
- ✅ Chat view renders markdown messages with streaming indicator
- ✅ Auto mode controls map to correct RPC commands
- ✅ extension_ui_request renders as confirm/select/input dialogs
- ✅ 182 tests pass, build succeeds, no regressions

## Requirement Outcomes

- R016 (project gallery): Advanced — gallery with search, status indicators, empty state
- R017 (new project wizard): Advanced — 3-step wizard with validation
- R018 (import): Partially advanced — path input exists, auto-detection deferred
- R019 (chat interface): Advanced — markdown, code blocks, streaming
- R020 (auto mode controls): Advanced — start/pause/next/steer buttons
- R021 (UI request dialogs): Advanced — confirm/select/input rendering

## Key Files

- src/components/shared/ — EmptyState, LoadingState
- src/components/projects/ — ProjectCard, ProjectGallery, NewProjectWizard
- src/components/chat/ — ChatMessage, ChatView, MessageInput
- src/components/controls/ — AutoModeControls, UIRequestDialog

## Follow-ups

- Native Tauri folder picker via @tauri-apps/plugin-dialog
- Brownfield auto-detection (git, package.json, .gsd/)
- Syntax highlighting via shiki for code blocks
- Code splitting for react-markdown chunk
