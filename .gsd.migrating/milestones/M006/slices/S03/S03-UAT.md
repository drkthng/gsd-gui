# S03: Milestone Filtering & Polish — UAT

**Milestone:** M006
**Written:** 2026-03-26T09:54:14.183Z

## UAT: Milestone Filtering & Polish

### Preconditions
- App is running with a project selected that has milestones in multiple statuses (at least one active/in-progress, one complete/done, one planned/pending)
- Navigate to Milestones page via sidebar

### Test 1: Filter bar renders with correct counts
1. Open the Milestones page with a project selected
2. **Expected:** A filter bar appears above the milestone list with four buttons: All, Active, Complete, Planned
3. **Expected:** Each button displays a count badge showing the number of milestones in that category
4. **Expected:** "All" button is selected by default (visually distinguished)

### Test 2: Filter by Active
1. Click the "Active" filter button
2. **Expected:** Only milestones with "in-progress" status are displayed
3. **Expected:** "Active" button is now visually selected, "All" is deselected
4. **Expected:** Milestones are grouped under an "Active" group header

### Test 3: Filter by Complete
1. Click the "Complete" filter button
2. **Expected:** Only milestones with "done" status are displayed
3. **Expected:** Group header shows "Complete" with correct count

### Test 4: Filter by Planned
1. Click the "Planned" filter button
2. **Expected:** Only milestones with "pending" or "blocked" status are displayed
3. **Expected:** Group header shows "Planned" with correct count

### Test 5: All filter shows everything
1. Click "All" filter button
2. **Expected:** All milestones are displayed, grouped by status (Active, Complete, Planned sections)
3. **Expected:** Each group has a header with label and count badge

### Test 6: Collapsible groups
1. With "All" filter active, verify all groups are expanded by default
2. Click a group header (e.g., "Active")
3. **Expected:** The group collapses, hiding its milestones
4. Click the same group header again
5. **Expected:** The group re-expands, showing milestones

### Test 7: Empty filter result
1. If all milestones are the same status, click a filter for a different status
2. **Expected:** No groups are rendered (empty state is graceful, no crashes)

### Test 8: Conditional states preserved
1. Deselect the active project (navigate to project gallery)
2. Navigate back to Milestones page with no project selected
3. **Expected:** "No project selected" empty state renders, no filter bar visible
4. Select a project and navigate to Milestones while data is loading
5. **Expected:** Loading spinner renders, no filter bar visible

### Test 9: Milestone tree preserved within groups
1. With milestones displayed, expand a milestone node within a group
2. **Expected:** Slices and tasks render beneath the milestone (ProgressDashboard tree behavior preserved)
3. **Expected:** Collapse/expand of the group does not lose the tree expansion state within it

### Edge Cases
- Project with only one status category: filter bar still renders, non-matching filters show empty
- Blocked milestones appear under "Planned" category alongside pending ones
- Filter state resets to "All" when switching projects (component remounts)
