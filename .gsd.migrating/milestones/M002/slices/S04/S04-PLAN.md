# S04: GSD Session Store & Project Store

**Goal:** Create gsd-store.ts and project-store.ts Zustand stores that manage GSD session state, messages, streaming state, pending UI requests, project list, and active project.

**Proof Level:** unit — all store state transitions and actions tested via Vitest

## Success Criteria

- gsd-store manages session lifecycle (idle→connecting→connected→streaming→disconnected→error), messages, streaming flag, pending UI requests
- project-store manages project list, active project, loading state
- All store actions tested via getState()/setState() pattern
- npm run test passes with 0 failures

## Tasks

- [ ] **T01: GSD session store** `est:45min`
- [ ] **T02: Project store** `est:30min`
