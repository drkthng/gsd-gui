# M002: GSD Backend Bridge

**Vision:** Bridge the M001 React shell to the GSD CLI — Rust backend for process management, JSONL RPC, headless query, file watching; React frontend for IPC wiring, state stores, hooks, and integration proof.

## Slices

- [x] **S01: Rust process manager & JSONL bridge** `risk:high` `depends:[]`
  > After this: Tauri can spawn gsd --mode rpc, send commands via stdin, receive JSONL events via stdout
- [x] **S02: Headless query & file watcher** `risk:medium` `depends:[S01]`
  > After this: Tauri can query GSD state and watch .gsd/ for file changes
- [x] **S03: React IPC client wiring** `risk:medium` `depends:[S01,S02]`
  > After this: gsd-client.ts calls real Tauri invoke/listen, shared TypeScript types exist
- [x] **S04: GSD session store & project store** `risk:low` `depends:[S03]`
  > After this: Zustand stores manage session state, messages, project list — consumed by any React component
- [x] **S05: TanStack Query hooks & event routing** `risk:low` `depends:[S02,S04]`
  > After this: useGsdState hook provides cached auto-refreshing state, useGsdEvents routes events to stores
- [x] **S06: End-to-end integration proof** `risk:medium` `depends:[S05]`
  > After this: Status bar shows real GSD data, full event flow proven from Rust through stores to UI
