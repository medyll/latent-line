# Sprint 7 – Testing & Validation Focus

**Duration:** 2026-03-09 → 2026-03-23 (2 weeks)
**Capacity:** 1 dev × 10 dev-days

## Sprint Goal

Strengthen test coverage with visual regression detection and comprehensive API/model validation, ensuring confidence in feature stability across all sprints.

## Stories

| ID      | Category  | Title                                               | Points | Priority | Status |
| ------- | --------- | --------------------------------------------------- | ------ | -------- | ------ |
| TST-001 | Visual    | Screenshot test baseline for all components         | 3      | Must     | Ready  |
| TST-002 | Visual    | Visual regression detection setup (baseline + diff) | 3      | Must     | Ready  |
| TST-003 | API/Model | Expand model schema edge case tests                 | 2      | Should   | Ready  |
| TST-004 | API/Model | Add input validation tests for all fields           | 2      | Should   | Ready  |

**Total:** 10 points (100% capacity)

## Critical Path

1. **TST-001** (baseline) → **TST-002** (regression setup) — Visual foundation
2. **TST-003** + **TST-004** (parallel) — API/model validation

## Dependencies

- Requires: Sprint 6 complete (all features stable)
- Blocked by: None

## Definition of Done (sprint-level)

- [ ] All 4 stories implemented and tested
- [ ] Baseline screenshots captured for all 14 components
- [ ] Visual regression detection script working locally
- [ ] Model validation edge cases covered (95%+ coverage)
- [ ] All existing tests still passing (141 unit + 6 E2E)
- [ ] CI ready for regression detection

## Risks

- **Time risk:** Screenshot capture across 14 components + regression setup may exceed 10 dev-days
  - _Mitigation:_ Prioritize critical components first (SequenceOrchestrator, PropertiesPanel, AudioTimeline), defer nice-to-have components to Sprint 8
- **Dependency risk:** Screenshot testing requires stable visual design
  - _Mitigation:_ Lock component styling before Sprint 7 begins

## Notes

- Visual baseline will be checked into `.github/screenshots/` for CI integration
- Model validation can reuse existing test infrastructure (vitest)
- E2E test expansion deferred to Sprint 8
