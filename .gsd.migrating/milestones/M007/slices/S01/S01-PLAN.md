# S01: Demo Backend in gsd-client.ts

**Goal:** Create a demo GsdClient implementation that returns mock data when Tauri is not available, so the app works in a browser
**Demo:** App loads in browser without invoke errors. Projects and milestones show demo data.

## Must-Haves

- No invoke errors in browser console. Projects page shows demo projects. All 381+ existing tests pass.

## Proof Level

- This slice proves: unit + browser manual

## Integration Closure

Demo client plugs into existing store/hook consumers transparently via createGsdClient() factory

## Verification

- Console log when demo mode is active

## Tasks

- [x] **T01: Implement demo GsdClient and wire factory** `est:45m`
  Create src/services/demo-client.ts implementing GsdClient interface with in-memory mock data. Detect Tauri via window.__TAURI_INTERNALS__. Update createGsdClient() to return demo client when not in Tauri. Fix project-gallery.tsx dialog import. Ensure all existing tests pass.
  - Files: `src/services/demo-client.ts`, `src/services/gsd-client.ts`, `src/components/projects/project-gallery.tsx`
  - Verify: npm run test -- --run && browser check: no invoke errors, projects page shows data

## Files Likely Touched

- src/services/demo-client.ts
- src/services/gsd-client.ts
- src/components/projects/project-gallery.tsx
