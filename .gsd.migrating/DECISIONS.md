# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M001 | arch | Desktop framework | Tauri 2 | < 1s startup, ~10MB binary, native OS webview. Escape hatch to Electron viable (~1-2 weeks rewrite) since Rust layer is intentionally thin and all Tauri IPC isolated behind gsd-client.ts abstraction. | Yes — if macOS WKWebView causes issues, switch to Electron | collaborative |
| D002 | M001 | arch | Frontend stack | React 19 + TypeScript 5.7+ + Vite 6 | Modern React with type safety. Vite for fast HMR and builds. Specified in architecture spec. | No | human |
| D003 | M001 | library | Styling and component library | Tailwind CSS 4 + shadcn/ui (new-york style) | Utility-first CSS with accessible Radix primitives. shadcn/ui components are open code — no vendor lock-in. Tailwind CSS 4 for modern CSS-first config. | No | human |
| D004 | M001 | library | State management library | Zustand | Lightweight, no-boilerplate, easy to test. Stores are plain functions. Specified in architecture spec. | No | human |
| D005 | M001 | pattern | IPC isolation pattern for Electron escape hatch | Single gsd-client.ts abstraction — only file allowed to import @tauri-apps/api | If Tauri WKWebView causes macOS issues, the entire React frontend is portable to Electron by rewriting one file. No Tauri imports scattered across components. | No | collaborative |
| D006 | M001 | convention | Testing approach | TDD with Vitest + @testing-library/react, tests co-located with source | Tests written before implementation. Co-located for discoverability. Vitest for speed. Specified by user and architecture spec. | No | human |
| D007 |  | workflow | Git branching strategy and main branch protection | All development happens on feature/milestone branches (e.g. `develop`, `milestone/M003`). The `main` branch is protected — only merge commits from completed, tested branches. Never commit directly to main. | User mandate: under no circumstances is development to be done on main. Main is the stable release branch. | No | human |
| D008 | M006/S02 | pattern | useMilestoneData hook approach — useState+useEffect vs TanStack Query | useState+useEffect with Zustand subscription, not TanStack Query | The hook subscribes to Zustand store state (activeProject) to trigger fetches. TanStack Query's queryKey-based invalidation doesn't naturally compose with external Zustand state changes. useState+useEffect keeps the reactive chain simple: Zustand state → useEffect → IPC call → local state. A fetch generation ref discards stale responses on rapid project switching. | Yes — if TanStack Query gains better Zustand integration or if query caching becomes needed | agent |
