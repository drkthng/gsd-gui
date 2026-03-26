---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Implement demo GsdClient and wire factory

Create src/services/demo-client.ts implementing GsdClient interface with in-memory mock data. Detect Tauri via window.__TAURI_INTERNALS__. Update createGsdClient() to return demo client when not in Tauri. Fix project-gallery.tsx dialog import. Ensure all existing tests pass.

## Inputs

- `src/services/gsd-client.ts`
- `src/lib/types.ts`
- `src/test/mock-data.ts`

## Expected Output

- `src/services/demo-client.ts`
- `src/services/gsd-client.ts (modified)`

## Verification

npm run test -- --run && browser check: no invoke errors, projects page shows data
