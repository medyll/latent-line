# Sprint 8 – CI Integration & E2E Hardening

**Duration:** 2026-03-23 → 2026-04-06 (2 weeks)
**Capacity:** 1 dev × 10 dev-days

## Sprint Goal

Deliver a fully automated CI pipeline (lint/typecheck/unit/E2E) and expand E2E test coverage to protect all key user flows, completing the testing infrastructure started in Sprint 7.

## Stories

| ID      | Category | Title                                                        | Points | Priority | Status |
| ------- | -------- | ------------------------------------------------------------ | ------ | -------- | ------ |
| CI-001  | CI       | Main GitHub Actions pipeline (lint + typecheck + unit + E2E) | 3      | Must     | Ready  |
| E2E-001 | E2E      | Expand E2E tests for asset CRUD and event editing flows      | 3      | Must     | Ready  |
| VR-001  | Visual   | Migrate visual regression to Playwright snapshot diffing     | 2      | Should   | Ready  |
| CI-002  | CI       | README CI badges + test coverage reporting                   | 2      | Should   | Ready  |

**Total:** 10 points (100% capacity)

## Critical Path

1. **CI-001** (pipeline) → **CI-002** (badges) — CI foundation
2. **E2E-001** (new tests) → **VR-001** (snapshot migration) — test expansion

## Dependencies

- Requires: Sprint 7 complete (218 unit tests stable, visual regression infra in place)
- Blocked by: None

## Definition of Done (sprint-level)

- [ ] All 4 stories implemented and tests passing
- [ ] GitHub Actions CI runs on every PR (lint + typecheck + unit + E2E)
- [ ] E2E tests cover: app boot, timeline load, event select, asset CRUD, event editing
- [ ] Visual regression uses Playwright native snapshots (no custom scripts)
- [ ] README shows passing CI badge
- [ ] All 218+ unit tests still passing in CI

## Risks

- **Visual snapshot platform differences:** Playwright snapshots differ between OS (Linux CI vs Windows dev)
  - _Mitigation:_ Run snapshot updates in CI via `--update-snapshots` on initial setup; commit CI-generated baselines
- **E2E flakiness:** Page navigation race conditions in SvelteKit
  - _Mitigation:_ Use `waitUntil: 'networkidle'` and explicit `waitForSelector` patterns

## Notes

- `visual-regression.yml` already exists; CI-001 creates a separate `ci.yml` for the main pipeline
- E2E tests go in `e2e/` directory (Playwright already configured)
- PRD milestone: "Add CI to run lint/typecheck/unit/e2e (story: add-ci)" — CI-001 fulfills this
