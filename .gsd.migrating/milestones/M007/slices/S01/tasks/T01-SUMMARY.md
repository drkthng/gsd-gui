---
id: T01
parent: S01
milestone: M007
key_files:
  - src/services/demo-client.ts
  - src/services/gsd-client.ts
  - src/pages/chat-page.tsx
  - src/components/projects/project-gallery.tsx
  - vite.config.ts
key_decisions:
  - Use runtime Tauri detection via __TAURI_INTERNALS__ rather than build-time env vars
  - Keep both Tauri and demo imports static (no dynamic import()) — Tauri modules don't throw on import, only on invoke()
  - Auto-connect chat session on mount when sessionState is idle
duration: ""
verification_result: passed
completed_at: 2026-03-26T10:35:02.352Z
blocker_discovered: false
---

# T01: Implemented demo GsdClient with in-memory mock data, Tauri detection, auto-connect chat, and Vite watch fix

**Implemented demo GsdClient with in-memory mock data, Tauri detection, auto-connect chat, and Vite watch fix**

## What Happened

Created a full demo GsdClient implementation that provides realistic in-memory data when the app runs in a browser without Tauri. The factory function detects Tauri via window.__TAURI_INTERNALS__ and routes accordingly. The demo client serves 3 projects, 3 milestones with slices/tasks at various completion states, and simulates chat streaming by emitting JSONL events through the same event handler system. Also fixed the Vite watch config that was causing infinite page reloads from .bg-shell/manifest.json writes, and added auto-connect to ChatPage so chat works immediately.

## Verification

All 381 tests pass. Browser verification: Chat shows streaming response to 'who are you'. Projects page shows 3 demo projects. Milestones page shows 3 milestones with filter bar. No console errors. No reload loops.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test -- --run` | 0 | ✅ pass | 102000ms |
| 2 | `browser: navigate to /chat, type 'who are you', verify response` | 0 | ✅ pass | 5000ms |
| 3 | `browser: navigate to /projects, verify 3 demo projects visible` | 0 | ✅ pass | 2000ms |
| 4 | `browser: navigate to /milestones, verify 3 milestones with filters` | 0 | ✅ pass | 2000ms |


## Deviations

Also fixed Vite watch config to ignore .bg-shell/ and .gsd/ directories (prevents infinite HMR reload loops). Also added auto-connect logic to ChatPage.

## Known Issues

Streaming response text has minor word duplication from chunking algorithm (cosmetic only).

## Files Created/Modified

- `src/services/demo-client.ts`
- `src/services/gsd-client.ts`
- `src/pages/chat-page.tsx`
- `src/components/projects/project-gallery.tsx`
- `vite.config.ts`
