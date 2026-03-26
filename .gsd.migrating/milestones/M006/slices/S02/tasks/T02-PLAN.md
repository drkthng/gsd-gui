---
estimated_steps: 27
estimated_files: 4
skills_used: []
---

# T02: Rewire milestones, timeline, and costs pages to real data

Replace mock data imports in the three production pages with the `useMilestoneData` hook from T01. Each page needs loading, error, and no-project-selected states. Update `pages.test.tsx` to mock the hook module.

**Current state of each page:**
- `milestones-page.tsx`: imports `mockMilestones` from `@/test/mock-data`, passes directly to `<ProgressDashboard milestones={milestones} />`
- `timeline-page.tsx`: imports `mockMilestones`, flatmaps slices, passes to `<RoadmapView slices={slices} />`
- `costs-page.tsx`: imports `mockCostData` from `@/test/mock-data`, passes to `<CostOverview data={data} />`

**What to change in each page:**
1. Remove `import { mockMilestones/mockCostData } from "@/test/mock-data"`
2. Add `import { useMilestoneData } from "@/hooks/use-milestone-data"`
3. Call `const { milestones, costData, isLoading, error } = useMilestoneData()`
4. Add conditional rendering:
   - If no active project selected: show EmptyState with message like "Select a project to view milestones"
   - If isLoading: show `<LoadingState message="Loading milestone data\u2026" />`
   - If error: show error message
   - Otherwise: render the existing dashboard component with real data

**Existing shared components available:**
- `<LoadingState message="..." />` from `@/components/shared/loading-state`
- `<EmptyState icon={...} title="..." description="..." />` from `@/components/shared/empty-state`

**Test update strategy for `pages.test.tsx`:**
The current test checks for `M001` text (from mockMilestones) in MilestonesPage and `Rust process manager` in TimelinePage. After this change, pages render empty state when no project is selected (the default). The test needs to either:
- Mock `useMilestoneData` to return data, OR
- Mock `useProjectStore` to have an activeProject set

Recommended: mock `@/hooks/use-milestone-data` module at the top of the test file to return mock data by default. This keeps the existing content assertions working. Add new test cases for the no-project and loading states.

**Important:** Do NOT delete `src/test/mock-data.ts` — it's still used by dashboard component tests (`progress-dashboard.test.tsx`, `roadmap-view.test.tsx`, `cost-overview.test.tsx`, `session-browser.test.tsx`).

**Knowledge entries to respect:**
- K009: jsdom has no matchMedia — test-utils.tsx handles this via beforeEach
- K012: heading queries need `level: 1` when pages have sub-headings
- K-M002-06: test-utils wrapper must include ALL providers

## Inputs

- ``src/hooks/use-milestone-data.ts` — useMilestoneData hook from T01 returning { milestones, costData, isLoading, error, refetch }`
- ``src/lib/types.ts` — MilestoneInfo, CostData types`
- ``src/pages/milestones-page.tsx` — current page with `import { mockMilestones } from '@/test/mock-data'``
- ``src/pages/timeline-page.tsx` — current page with `import { mockMilestones } from '@/test/mock-data'``
- ``src/pages/costs-page.tsx` — current page with `import { mockCostData } from '@/test/mock-data'``
- ``src/pages/__tests__/pages.test.tsx` — existing 28 tests checking page rendering with unique text per page`
- ``src/components/shared/loading-state.tsx` — existing LoadingState component`
- ``src/components/shared/empty-state.tsx` — existing EmptyState component with icon/title/description props`
- ``src/test/mock-data.ts` — keep this file intact; still needed by dashboard component tests`
- ``src/stores/project-store.ts` — useProjectStore for checking activeProject in hook`

## Expected Output

- ``src/pages/milestones-page.tsx` — uses useMilestoneData hook, shows loading/empty/error/no-project states, zero mock imports`
- ``src/pages/timeline-page.tsx` — uses useMilestoneData hook, shows loading/empty/error/no-project states, zero mock imports`
- ``src/pages/costs-page.tsx` — uses useMilestoneData hook, shows loading/empty/error/no-project states, zero mock imports`
- ``src/pages/__tests__/pages.test.tsx` — mocks useMilestoneData, tests data/loading/no-project states for rewired pages`

## Verification

npm run test -- --run src/pages/__tests__/pages.test.tsx && npm run build
