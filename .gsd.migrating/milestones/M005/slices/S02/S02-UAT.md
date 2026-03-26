# S02: Diagnostics panels — UAT

**Milestone:** M005
**Written:** 2026-03-25T12:45:10.096Z

# S02 UAT: Diagnostics Panels

## Preconditions
- App running at localhost:1420
- Pro Tools page accessible via sidebar navigation

## Test Cases

### TC1: LogViewer Panel renders
1. Navigate to /pro-tools/log-viewer
2. **Expected:** Page shows "Log Viewer" heading
3. **Expected:** Mock log entries visible with timestamp, message, and source
4. **Expected:** Level badges show (info/warn/error) with appropriate color variants

### TC2: Debugger Panel renders
1. Navigate to /pro-tools/debugger
2. **Expected:** Page shows "Debugger" heading
3. **Expected:** Mock debug sessions visible with agent name and current step
4. **Expected:** Status badges show (paused/running/stopped)

### TC3: Metrics Panel renders
1. Navigate to /pro-tools/metrics
2. **Expected:** Page shows "Metrics" heading
3. **Expected:** Mock metrics visible with name, value, and unit
4. **Expected:** Trend indicators (↑/↓/→) and badges shown

### TC4: Trace Viewer Panel renders
1. Navigate to /pro-tools/trace-viewer
2. **Expected:** Page shows "Trace Viewer" heading
3. **Expected:** Mock traces visible with operation, duration, and span count
4. **Expected:** Status badges show (ok/error/timeout)

### TC5: Pro Tools grid links to panels
1. Navigate to /pro-tools
2. Click on any Diagnostics category panel card
3. **Expected:** Navigates to the correct panel route

### TC6: Loading/error states via ProToolPanel
1. Each panel uses ProToolPanel wrapper with status='ready'
2. **Expected:** If status were 'loading', spinner would show
3. **Expected:** If status were 'error', error message with retry button would show
