# M004: Data Views & Configuration

**Vision:** Full visibility into project progress, costs, sessions, and configuration — turning raw GSD data into actionable visual dashboards.

## Success Criteria

- [ ] Progress dashboard renders milestone/slice/task tree with completion indicators and progress bars
- [ ] Roadmap view shows slice cards with risk badges and status indicators
- [ ] Cost overview shows budget bar, phase/model breakdown charts (Recharts), per-slice cost table
- [ ] Session browser lists sessions with search, metadata, and resume action
- [ ] Config panel renders tabbed settings and saves changes
- [ ] All tests pass, build succeeds, no regressions from M003 baseline (182 tests)

## Slices

- [x] **S01: Recharts + data types & mock data** `risk:low` `depends:[]`
  > After this: Recharts installed, milestone/session/cost data types defined, mock data fixtures available
- [x] **S02: Progress dashboard** `risk:medium` `depends:[S01]`
  > After this: /milestones shows tree of milestones/slices/tasks with completion status and progress
- [x] **S03: Roadmap view** `risk:low` `depends:[S01]`
  > After this: /timeline shows slice cards with risk badges and status indicators
- [x] **S04: Cost overview** `risk:medium` `depends:[S01]`
  > After this: /costs shows budget bar, phase/model charts, per-slice cost table
- [x] **S05: Session browser** `risk:low` `depends:[S01]`
  > After this: Sessions page shows list with search, metadata, resume action
- [x] **S06: Config panel** `risk:low` `depends:[]`
  > After this: /settings shows tabbed config UI for models, git, budget, verification
