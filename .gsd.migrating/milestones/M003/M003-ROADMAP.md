# M003: Core Screens

**Vision:** Replace all placeholder pages with functional, store-connected UI — project gallery, new project wizard, chat interface, auto mode controls, and UI request dialogs.

## Success Criteria

- [ ] Project gallery shows real project data from project-store with search/filter and empty state
- [ ] New project wizard completes 3-step flow with native folder picker and creates project
- [ ] Import flow detects git, package.json, .gsd/ and offers appropriate actions
- [ ] Chat view renders markdown messages with code syntax highlighting and streaming
- [ ] Auto mode start/pause/stop/steer buttons work and map to correct RPC commands
- [ ] extension_ui_request renders as select/confirm/input/notify dialogs with response routing
- [ ] All tests pass, build succeeds, no regressions from M002 baseline (136 tests)

## Slices

- [x] **S01: shadcn/ui components & shared primitives** `risk:low` `depends:[]`
  > After this: All needed shadcn/ui components installed, EmptyState and LoadingState primitives available
- [x] **S02: Project gallery & project card** `risk:low` `depends:[S01]`
  > After this: /projects shows real project data from store with search, status indicators, and empty state
- [x] **S03: New project wizard & brownfield import** `risk:medium` `depends:[S01,S02]`
  > After this: Users can create new projects via wizard with folder picker, or import existing projects
- [x] **S04: Chat view & message input** `risk:high` `depends:[S01]`
  > After this: /chat shows real conversation with markdown rendering, code blocks, streaming, auto-scroll
- [x] **S05: Auto mode controls & UI request dialogs** `risk:medium` `depends:[S04]`
  > After this: Start/pause/stop/steer buttons control execution, extension_ui_request renders as GUI dialogs
