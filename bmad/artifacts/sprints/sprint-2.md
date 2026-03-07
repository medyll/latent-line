# Sprint 2 – Shared State & Editing Foundation

**Duration:** 2026-03-05 → 2026-03-12
**Capacity:** ~14 story points (solo dev)

## Sprint Goal

Enable full asset data visibility in PropertiesPanel via a shared Svelte context, and add basic inline editing for timeline frame properties.

## Stories

| ID     | Epic         | Title                                 | Points | Priority |
| :----- | :----------- | :------------------------------------ | :----: | :------- |
| ST-006 | Shared State | Lift assetStore to Svelte context     |   3    | Must     |
| ST-007 | Shared State | PropertiesPanel: full asset data      |   2    | Must     |
| ST-008 | Editing      | PropertiesPanel: inline frame editing |   5    | Should   |
| ST-009 | Quality      | E2E tests for component interactions  |   3    | Should   |
| ST-010 | Performance  | Bundle analysis and size optimization |   1    | Could    |

**Total:** 14 points

## Dependencies

- ST-007 depends on ST-006 (assetStore must be in context first)
- ST-008 depends on ST-007 (panel must distinguish event vs asset context)
- ST-009 can run in parallel with ST-008

## Definition of Done (sprint-level)

- [ ] ST-006 + ST-007 complete: PropertiesPanel shows asset name/prompt when asset selected
- [ ] ST-008 complete: Camera zoom and lighting type editable from PropertiesPanel
- [ ] ST-009 complete: Playwright tests cover asset selection + timeline event selection flows
- [ ] All unit tests still passing (35+)
- [ ] No new a11y warnings in dev server output

## Risks

- Svelte context (`setContext`/`getContext`) requires components to be in the same tree; verify app.svelte hierarchy before implementing ST-006
- PropertiesPanel editing (ST-008) touches reactive model state — structuredClone + immutable update pattern required to avoid cross-component pollution
