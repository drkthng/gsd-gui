# S06: End-to-End Integration Proof — Summary

**Status:** Complete
**Tests added:** 3 new status-bar tests (7 total, replacing 4 old mock-based tests) → 136 total

## What This Slice Delivered

- **StatusBar** rewritten from hardcoded mock data to live store/hook data:
  - Session state from useGsdStore (idle/connecting/connected/streaming/disconnected/error)
  - Milestone + cost from useGsdState TanStack Query hook
  - Active project name from useProjectStore
  - Destructive badge variant for error state
- **useGsdEvents** mounted in AppShell — event subscriptions active for the entire app lifecycle
- **gsd-client mock** added to app-shell.test.tsx and App.test.tsx (needed since AppShell now imports useGsdEvents)
- **Import boundary verified**: grep confirms only gsd-client.ts and tauri-mock.ts import @tauri-apps/api

## Integration Proof

The full event flow is now wired: Rust emits Tauri events → gsd-client.ts listen() → useGsdEvents parses JSONL → Zustand stores update → React components re-render with live data. File changes invalidate TanStack Query cache → useGsdState refetches → StatusBar shows updated milestone/cost.

## Key Files

- src/components/status-bar/status-bar.tsx (rewritten)
- src/components/status-bar/status-bar.test.tsx (rewritten)
- src/components/app-shell/app-shell.tsx (useGsdEvents mounted)
- src/components/app-shell/app-shell.test.tsx (gsd-client mock added)
- src/App.test.tsx (gsd-client mock added)
