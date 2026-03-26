# S03: Data & Tuning panels — UAT

**Milestone:** M005
**Written:** 2026-03-25T14:12:12.151Z

## UAT: S03 — Data & Tuning Panels

### Preconditions
- Dev server running (`npm run dev`)
- Navigate to Pro Tools page via sidebar

### Test 1: All 12 new panels accessible via routes
1. Navigate to `/pro-tools/session-manager` → Panel renders with "Session Manager" heading and session cards
2. Navigate to `/pro-tools/state-inspector` → Panel renders with state entries showing key/value/type
3. Navigate to `/pro-tools/secrets` → Panel renders with masked secret values (****)
4. Navigate to `/pro-tools/config-editor` → Panel renders with config items grouped by category
5. Navigate to `/pro-tools/benchmarks` → Panel renders with benchmark results and scores
6. Navigate to `/pro-tools/resource-monitor` → Panel renders with CPU/Memory/Disk/Network usage
7. Navigate to `/pro-tools/prompt-lab` → Panel renders with prompt experiments
8. Navigate to `/pro-tools/ab-testing` → Panel renders with A/B test variants
9. Navigate to `/pro-tools/dependency-graph` → Panel renders with dependency nodes
10. Navigate to `/pro-tools/coverage-map` → Panel renders with file coverage percentages
11. Navigate to `/pro-tools/token-usage` → Panel renders with token/cost records
12. Navigate to `/pro-tools/theme-preview` → Panel renders with theme entries and active indicators

**Expected:** Each panel shows mock data in Card layout with colored Badge status indicators.

### Test 2: Pro Tools grid shows all 19 panels
1. Navigate to `/pro-tools`
2. Verify grid displays 19 panel cards across 5 categories
3. Click any of the 12 new panels → navigates to panel detail view

### Test 3: Panel loading/error states
1. Each panel wraps content in ProToolPanel with status='ready'
2. Verify panel header shows title and green "ready" indicator

### Test 4: Unit tests pass
1. Run `npx vitest --run` → 303 tests pass across 49 files
2. No test regressions from S01/S02 baseline (255 tests)
