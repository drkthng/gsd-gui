# S03 UAT Script: App Shell — Sidebar, Routing, Main Content Area, Status Bar

**Preconditions:**
1. `npm install` has been run (all dependencies installed)
2. `npm run test` passes with 69 tests (10 test files)
3. `npm run tauri dev` successfully launches the Tauri window

---

## Test Case 1: Sidebar Renders All 7 Navigation Items

**Steps:**
1. Launch `npm run tauri dev`
2. Wait for the Tauri window to appear

**Expected:**
- The left sidebar shows 7 navigation items with icons and labels:
  - Chat (MessageSquare icon)
  - Projects (FolderKanban icon)
  - Milestones (Flag icon)
  - Timeline (Clock icon)
  - Costs (DollarSign icon)
  - Settings (Settings/gear icon)
  - Help (HelpCircle icon)
- The sidebar header shows "GSD" branding
- The sidebar footer has a collapse/expand trigger button

---

## Test Case 2: Sidebar Navigation Routes Between Views

**Steps:**
1. From the app's default view (Chat), click "Projects" in the sidebar
2. Observe the main content area
3. Click "Milestones" in the sidebar
4. Click "Timeline"
5. Click "Costs"
6. Click "Settings"
7. Click "Help"
8. Click "Chat" to return to the first view

**Expected:**
- Each click changes the main content area to show the corresponding page heading:
  - "Projects" → heading "Projects"
  - "Milestones" → heading "Milestones"
  - "Timeline" → heading "Timeline"
  - "Costs" → heading "Costs"
  - "Settings" → heading "Settings"
  - "Help" → heading "Help"
  - "Chat" → heading "Chat"
- The clicked sidebar item is visually highlighted (active state)
- Previously active items lose their highlight
- The URL bar (if visible in dev tools) shows the corresponding path (e.g., `/projects`)

---

## Test Case 3: Default Route and Index Redirect

**Steps:**
1. Launch the app (or navigate to `/` in the webview)
2. Observe which page loads

**Expected:**
- The app redirects from `/` to `/chat`
- The Chat page heading is visible
- The "Chat" sidebar item is highlighted as active

---

## Test Case 4: Status Bar Displays Mock Data

**Steps:**
1. With the app running, look at the bottom of the window

**Expected:**
- A thin status bar is visible at the very bottom of the app
- It displays three pieces of information:
  - Left side: Badge showing "M001 / S01 / T01" (mock milestone context)
  - Center-left: "Cost: $0.00" (mock cost)
  - Right side: "Model:" followed by a badge showing "Claude Sonnet" (mock model)
- The status bar has a muted background and small text
- It remains visible when navigating between views

---

## Test Case 5: Sidebar Collapse/Expand

**Steps:**
1. Click the sidebar trigger button (bottom of the sidebar)
2. Observe the sidebar state
3. Click the trigger again

**Expected:**
- First click: Sidebar collapses to icon-only mode (labels hidden, only icons visible)
- Second click: Sidebar expands back to full width with labels
- The main content area adjusts width accordingly
- Navigation still works in collapsed mode (clicking icons navigates)

---

## Test Case 6: Responsive Layout at 900×600

**Steps:**
1. Resize the Tauri window to approximately 900×600 pixels (the configured minimum)
2. Observe the layout

**Expected:**
- The layout does not break — no horizontal scrollbar, no overlapping elements
- Content remains readable
- The sidebar either collapses or remains functional
- The status bar remains visible at the bottom
- All 7 navigation items are still accessible

---

## Test Case 7: Mobile-Width Sidebar Behavior

**Steps:**
1. Resize the window width below 768px (if the Tauri minimum allows, or test in browser via `npm run dev` at a narrow width)
2. Observe the sidebar behavior
3. Click the sidebar trigger (should appear in the top bar on mobile)

**Expected:**
- Below 768px, the sidebar collapses to a hidden state
- A mobile header bar appears at the top with "GSD" label and a sidebar trigger
- Clicking the trigger opens the sidebar as a sheet/overlay
- Selecting a nav item closes the sheet and navigates to the page

---

## Test Case 8: Automated Test Verification

**Steps:**
1. Run `npm run test`

**Expected:**
- All 69 tests pass across 10 test files:
  - `src/components/app-shell/app-shell.test.tsx` — 7 tests (nav items, routing, store sync, mobile)
  - `src/components/status-bar/status-bar.test.tsx` — 4 tests (milestone, cost, model, footer role)
  - `src/pages/__tests__/pages.test.tsx` — 7 tests (one per page component)
  - `src/router.test.tsx` — 9 tests (route count, paths, pages render, redirect)
  - `src/App.test.tsx` — 3 tests (renders, sidebar, default view)
  - `src/components/theme-provider.test.tsx` — 10 tests
  - `src/lib/utils.test.ts` — 6 tests
  - `src/stores/ui-store.test.ts` — 11 tests
  - `src/services/gsd-client.test.ts` — 7 tests
  - `src/components/ui/button.test.tsx` — 5 tests

---

## Edge Cases

### EC1: Direct URL Navigation
1. In dev tools or browser mode (`npm run dev`), navigate directly to `/settings`
2. **Expected:** Settings page renders, Settings sidebar item is highlighted, Zustand activeView is "settings"

### EC2: Invalid Route
1. Navigate to a non-existent route (e.g., `/nonexistent`)
2. **Expected:** No page content renders in the main area (blank). No crash. Sidebar remains functional.

### EC3: Rapid Navigation
1. Click through all 7 sidebar items quickly in succession
2. **Expected:** Each page loads correctly without flicker or stale state. Final page matches last clicked item.

### EC4: Status Bar Persistence Across Navigation
1. Navigate through 3-4 different views
2. **Expected:** Status bar content (M001/S01/T01, $0.00, Claude Sonnet) remains unchanged and visible throughout all navigation.
