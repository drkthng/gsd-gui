# S04: Polish — toasts, keyboard shortcuts, skeletons — UAT

**Milestone:** M005
**Written:** 2026-03-25T14:36:19.689Z

# S04 UAT: Polish — toasts, keyboard shortcuts

## Preconditions
- App running via `npm run dev` or `cargo tauri dev`
- At least one project loaded with GSD session active

## Test Cases

### TC1: Keyboard shortcut — Ctrl+N navigates to Projects
1. From any page, press **Ctrl+N**
2. **Expected:** App navigates to the Projects page

### TC2: Keyboard shortcut — Ctrl+1 through Ctrl+7 switch tabs
1. Press **Ctrl+1** → Expected: navigate to Chat
2. Press **Ctrl+2** → Expected: navigate to Dashboard
3. Press **Ctrl+3** → Expected: navigate to Sessions
4. Press **Ctrl+4** → Expected: navigate to Projects
5. Press **Ctrl+5** → Expected: navigate to Pro Tools
6. Press **Ctrl+6** → Expected: navigate to Config
7. Press **Ctrl+7** → Expected: navigate to Logs

### TC3: Keyboard shortcut — Escape pauses auto mode
1. Start an auto-mode session (streaming state)
2. Press **Escape**
3. **Expected:** Session state transitions to disconnected

### TC4: Shortcuts ignored in text inputs
1. Focus a text input or textarea (e.g., chat message input)
2. Press **Ctrl+N** or **Ctrl+1**
3. **Expected:** No navigation occurs; keystrokes go to the input field

### TC5: Toast on task completion
1. Run a GSD session that completes a task
2. **Expected:** A success toast appears with task completion message

### TC6: Toast on error
1. Trigger a GSD error (e.g., disconnect backend)
2. **Expected:** An error toast appears with the error message

### TC7: Toast on budget warning
1. Trigger budget warning state in GSD store
2. **Expected:** A warning toast appears with budget alert message

### TC8: No duplicate toasts on re-render
1. Observe toasts during normal operation
2. **Expected:** Each event fires exactly one toast, not duplicates on React re-renders

## Edge Cases
- Ctrl+8 and above: should be ignored (no action)
- Multiple rapid shortcut presses: should navigate correctly without race conditions
- Toast auto-dismissal: toasts should disappear after timeout
