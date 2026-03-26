---
estimated_steps: 13
estimated_files: 10
skills_used: []
---

# T01: Build session-manager, state-inspector, secrets, and config-editor panels

Create 4 panels (session-manager, state-inspector, secrets, config-editor) following the established pattern from debugger-panel.tsx: mock data array, Card+Badge layout, ProToolPanel wrapper. Add co-located tests. Wire routes into router.tsx and add barrel exports to panels/index.ts.

Pattern to follow (from debugger-panel.tsx):
- Define a TypeScript interface for the mock data shape
- Create a MOCK_* const array with 3-5 items
- Use ProToolPanel with title and status='ready'
- Render Cards with CardHeader (title + Badge) and CardContent
- Add data-testid on each card

Panel specs:
- session-manager: Mock active sessions with id, name, status (active/idle/terminated), startedAt
- state-inspector: Mock state entries with id, key, value, type (string/number/boolean/object)
- secrets: Mock secrets with id, name, source (env/vault/config), masked value (****)
- config-editor: Mock config items with id, key, value, category (agent/project/system)

Test pattern (from debugger-panel.test.tsx): render panel, assert title heading, assert mock items render, assert status badges.

## Inputs

- ``src/components/pro-tools/panels/debugger-panel.tsx` — reference pattern for panel implementation`
- ``src/components/pro-tools/panels/debugger-panel.test.tsx` — reference pattern for panel tests`
- ``src/components/pro-tools/pro-tool-panel.tsx` — wrapper component to use`
- ``src/components/pro-tools/panels/index.ts` — barrel export to extend`
- ``src/router.tsx` — add routes for new panels`

## Expected Output

- ``src/components/pro-tools/panels/session-manager-panel.tsx` — new panel component`
- ``src/components/pro-tools/panels/session-manager-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/state-inspector-panel.tsx` — new panel component`
- ``src/components/pro-tools/panels/state-inspector-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/secrets-panel.tsx` — new panel component`
- ``src/components/pro-tools/panels/secrets-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/config-editor-panel.tsx` — new panel component`
- ``src/components/pro-tools/panels/config-editor-panel.test.tsx` — tests`
- ``src/components/pro-tools/panels/index.ts` — updated barrel with 4 new exports`
- ``src/router.tsx` — 4 new routes added`

## Verification

npx vitest --run -- session-manager-panel state-inspector-panel secrets-panel config-editor-panel && npx vitest --run
