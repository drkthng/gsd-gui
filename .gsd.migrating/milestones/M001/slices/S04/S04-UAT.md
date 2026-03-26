# S04 UAT: Theme toggle, placeholder pages, shell polish

## Preconditions

1. `npm run tauri dev` launches the app successfully (or `npm run dev` for web-only verification)
2. All 97 tests pass (`npx vitest run`)
3. Browser DevTools accessible for localStorage and DOM inspection

---

## TC-01: ModeToggle renders in sidebar footer

**Steps:**
1. Launch the app via `npm run dev` and open `http://localhost:1420`
2. Look at the bottom of the sidebar (SidebarFooter area)

**Expected:**
- A button with a Sun or Moon icon is visible next to the sidebar collapse/expand trigger
- The button has an accessible label (inspect: `aria-label="Toggle theme"`)

---

## TC-02: Theme toggle — switch to Dark mode

**Steps:**
1. Click the theme toggle button (Sun/Moon icon) in the sidebar footer
2. A dropdown menu appears with three options: Light, Dark, System
3. Click "Dark"

**Expected:**
- The entire app switches to dark mode (dark background, light text)
- The `<html>` element has class `dark` (inspect via DevTools: `document.documentElement.classList`)
- `localStorage.getItem('gsd-ui-theme')` returns `"dark"`
- The dropdown closes after selection

---

## TC-03: Theme toggle — switch to Light mode

**Steps:**
1. Click the theme toggle button again
2. Click "Light"

**Expected:**
- The app switches to light mode (light background, dark text)
- The `<html>` element does NOT have class `dark`
- `localStorage.getItem('gsd-ui-theme')` returns `"light"`

---

## TC-04: Theme toggle — switch to System mode

**Steps:**
1. Click the theme toggle button
2. Click "System"

**Expected:**
- The app theme follows the operating system preference
- `localStorage.getItem('gsd-ui-theme')` returns `"system"`
- If OS is set to dark mode, app appears dark; if light, app appears light

---

## TC-05: Theme persistence across reload

**Steps:**
1. Set theme to "Dark" via the ModeToggle
2. Reload the page (F5 or Ctrl+R)

**Expected:**
- After reload, the app is still in dark mode
- `localStorage.getItem('gsd-ui-theme')` still returns `"dark"`
- No flash of wrong theme during load (ThemeProvider applies theme before first render via inline script or class)

---

## TC-06: Theme transitions are smooth

**Steps:**
1. Switch from Light to Dark mode
2. Observe the transition

**Expected:**
- Background and text colors transition smoothly (no hard snap)
- StatusBar footer area transitions smoothly
- Main content area transitions smoothly
- The `transition-colors` CSS class is applied to key elements

---

## TC-07: Chat page has distinct content

**Steps:**
1. Click "Chat" in the sidebar navigation

**Expected:**
- Page heading shows "Chat" as an `<h1>`
- A page-specific lucide icon is visible in the header area
- At least 2 mock data cards/sections are visible (e.g., "Start a Conversation", "Recent Sessions")
- Content describes chat/conversation functionality

---

## TC-08: Projects page has distinct content

**Steps:**
1. Click "Projects" in the sidebar

**Expected:**
- Heading: "Projects"
- Page-specific icon different from Chat page
- 2+ mock sections (e.g., "Active Projects", "Create New")
- Content describes project management

---

## TC-09: Milestones page has distinct content

**Steps:**
1. Click "Milestones" in the sidebar

**Expected:**
- Heading: "Milestones"
- Unique icon
- 2+ mock sections related to milestone tracking

---

## TC-10: Timeline page has distinct content

**Steps:**
1. Click "Timeline" in the sidebar

**Expected:**
- Heading: "Timeline"
- Unique icon
- 2+ mock sections related to timeline/schedule view

---

## TC-11: Costs page has distinct content

**Steps:**
1. Click "Costs" in the sidebar

**Expected:**
- Heading: "Costs"
- Unique icon (e.g., DollarSign or similar)
- 2+ mock sections related to cost tracking / token usage

---

## TC-12: Settings page has distinct content

**Steps:**
1. Click "Settings" in the sidebar

**Expected:**
- Heading: "Settings"
- Unique icon (e.g., gear/settings)
- 2+ mock sections related to configuration options

---

## TC-13: Help page has distinct content

**Steps:**
1. Click "Help" in the sidebar

**Expected:**
- Heading: "Help"
- Unique icon (e.g., HelpCircle)
- 2+ mock sections related to documentation/support

---

## TC-14: All pages look correct in Dark mode

**Steps:**
1. Set theme to Dark
2. Navigate through all 7 pages one by one

**Expected:**
- All pages render correctly in dark mode
- Card backgrounds use `bg-card` (dark variant)
- Text is readable (light-on-dark)
- No elements with hardcoded light-mode colors that break in dark

---

## TC-15: All pages look correct in Light mode

**Steps:**
1. Set theme to Light
2. Navigate through all 7 pages one by one

**Expected:**
- All pages render correctly in light mode
- Card backgrounds use `bg-card` (light variant)
- Text is readable (dark-on-light)
- No elements with hardcoded dark-mode colors that break in light

---

## TC-16: ModeToggle accessible when sidebar is collapsed

**Steps:**
1. Click the sidebar collapse trigger (SidebarTrigger) to collapse the sidebar to icon mode
2. Look at the sidebar footer

**Expected:**
- The ModeToggle icon button remains visible/accessible even when the sidebar is collapsed
- Clicking it still opens the dropdown with theme options

---

## Edge Cases

### EC-01: Rapid theme switching
- Rapidly click between Dark → Light → System → Dark
- Expected: No visual glitches, no error in console, theme state is consistent

### EC-02: localStorage cleared
- Clear `localStorage` in DevTools, then reload
- Expected: App defaults to "system" theme (ThemeProvider default), no crash

### EC-03: Dropdown keyboard navigation
- Open the ModeToggle dropdown, use Arrow keys to navigate, press Enter to select
- Expected: Keyboard navigation works correctly (Radix DropdownMenu provides this)
