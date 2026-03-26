# S05: TanStack Query Hooks & Event Routing — Summary

**Status:** Complete
**Tests added:** 8 (4 useGsdState, 4 useGsdEvents) → 133 total

## What This Slice Delivered

- **@tanstack/react-query** installed and QueryClientProvider added to App.tsx
- **useGsdState hook**: TanStack Query hook polling `queryState` every 2s with staleTime 1s. Disabled when no project path. Returns standard useQuery result with isLoading/isSuccess/isError/data.
- **useGsdEvents hook**: Subscribes to all 4 Tauri event types (gsd-event, process-exit, process-error, file-changed). Routes JSONL events to gsd-store.handleGsdEvent after JSON.parse. Routes process events to handleProcessExit/handleProcessError. File change events invalidate TanStack Query cache for immediate refetch.
- **test-utils.tsx** updated to include QueryClientProvider in renderWithProviders wrapper.

## Key Files

- src/hooks/use-gsd-state.ts + test
- src/hooks/use-gsd-events.ts + test
- src/App.tsx (QueryClientProvider)
- src/test/test-utils.tsx (QueryClientProvider in wrapper)
