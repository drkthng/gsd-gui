# S05: TanStack Query Hooks & Event Routing

**Goal:** Create useGsdState hook (TanStack Query polling + event-driven refresh) and useGsdEvents hook (event stream subscription routing events to Zustand stores).

**Proof Level:** unit — hooks tested via renderHook with mocked client

## Success Criteria

- useGsdState returns QuerySnapshot with auto-polling and event-driven refresh
- useGsdEvents subscribes to all 4 event types and routes to gsd-store actions
- TanStack Query provider configured in App.tsx
- npm run test passes with 0 failures

## Tasks

- [ ] **T01: useGsdState hook + QueryClientProvider** `est:30min`
- [ ] **T02: useGsdEvents hook** `est:30min`
