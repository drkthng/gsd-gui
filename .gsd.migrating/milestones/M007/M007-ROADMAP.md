# M007: M007

**Vision:** Make the app fully functional when running in a browser (outside Tauri) by providing a demo/mock backend that returns realistic data. Chat works with simulated responses, projects load with demo data, milestones display correctly. Verified with browser-based E2E tests.

## Success Criteria

- App loads in browser without any invoke errors
- Chat accepts messages and shows simulated assistant responses
- Projects page shows demo projects without errors
- Milestones page shows demo milestone data with filtering
- All existing unit tests still pass (381+)
- Browser E2E tests verify all major flows

## Slices

- [ ] **S01: Demo Backend in gsd-client.ts** `risk:medium` `depends:[]`
  > After this: App loads in browser without invoke errors. Projects and milestones show demo data.

- [ ] **S02: Chat Demo Flow & Browser E2E** `risk:low` `depends:[S01]`
  > After this: User types message in chat, sees simulated streaming response. E2E tests pass.

## Boundary Map

```\nBrowser → createGsdClient() → isTauri? → TauriClient (invoke/listen)\n                                    → !isTauri? → DemoClient (in-memory mock)\n```
