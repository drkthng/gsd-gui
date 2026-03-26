---
estimated_steps: 1
estimated_files: 6
skills_used: []
---

# T01: Install sonner, create toast system, wire to GSD events

Install sonner (the shadcn/ui-recommended toast library), add Toaster to the provider tree in App.tsx, create a useToastNotifications hook that subscribes to GSD store state changes and fires toasts for task completion, errors, and budget warnings. Write tests first (TDD).

## Inputs

- ``src/App.tsx` — provider tree where Toaster must be added`
- ``src/stores/gsd-store.ts` — GSD event state (messages, error, sessionState) that toasts react to`
- ``src/components/app-shell/app-shell.tsx` — where useToastNotifications hook will be called`
- ``package.json` — add sonner dependency`

## Expected Output

- ``src/hooks/use-toast-notifications.ts` — hook that watches gsd-store and fires sonner toasts`
- ``src/hooks/__tests__/use-toast-notifications.test.ts` — tests for toast firing logic`
- ``src/App.tsx` — updated with Sonner Toaster component`
- ``src/components/app-shell/app-shell.tsx` — updated to call useToastNotifications`
- ``src/App.test.tsx` — updated to verify Toaster renders`

## Verification

npm run test -- --run && npm run build
