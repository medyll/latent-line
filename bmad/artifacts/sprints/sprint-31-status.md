# Sprint 31 Status

**Version:** v0.8.0  
**Theme:** Timeline Markers & Asset Tracking  
**Points:** 11  
**Status:** In Progress  
**Start Date:** 2026-04-02  
**End Date:** 2026-04-16  

---

## Stories

### S31-01: Timeline Markers (4 points) — P0
**Status:** In Progress  
**Priority:** P0

#### Description
Add visual markers on timeline for key moments, chapter divisions, and beat markers.

#### Acceptance Criteria
- [ ] Markers stored in model (new `markers[]` array)
- [ ] Visual markers rendered on timeline ruler
- [ ] Click/jump functionality
- [ ] Add/edit/delete via context menu
- [ ] Export to CSV/JSON
- [ ] Unit tests (8+)
- [ ] E2E test (add marker → navigate)

#### Tasks
- [ ] Create marker-types.ts
- [ ] Update model-types.ts with markers field
- [ ] Update model-template.ts schema
- [ ] Update model-store.svelte.ts for marker CRUD
- [ ] Create TimelineMarkers.svelte
- [ ] Create MarkerEditor.svelte
- [ ] Export markers to CSV/JSON
- [ ] Unit tests (8+)
- [ ] E2E test

---

### S31-02: Asset Usage Tracking (4 points) — P1
**Status:** Pending  
**Priority:** P1

#### Description
Track which assets are used where, identify unused assets, show usage count.

#### Acceptance Criteria
- [ ] Usage index built from timeline events
- [ ] Count displayed on asset cards
- [ ] "Find usage" shows list of events
- [ ] Unused assets highlighted in AssetManager
- [ ] Delete warning modal
- [ ] Unit tests (10+)

#### Tasks
- [ ] Create asset-usage.ts
- [ ] buildUsageIndex() function
- [ ] findUnusedAssets() function
- [ ] Create UsageBadge.svelte
- [ ] Create UsageModal.svelte
- [ ] Delete warning modal
- [ ] Unit tests (10+)

---

### S31-03: Event Statistics Dashboard (3 points) — P2
**Status:** Pending  
**Priority:** P2

#### Description
Visual dashboard showing timeline statistics and insights.

#### Acceptance Criteria
- [ ] Stats panel (collapsible)
- [ ] Charts for distributions (simple SVG)
- [ ] Real-time updates on model change
- [ ] Export stats JSON
- [ ] Unit tests (6+)

#### Tasks
- [ ] Create stats-calculator.ts
- [ ] calculateStats() function
- [ ] Create StatsPanel.svelte
- [ ] Charts (SVG)
- [ ] Export stats JSON
- [ ] Unit tests (6+)

---

## Progress

**Points Completed:** 0 / 11  
**Stories Completed:** 0 / 3  
**Days Remaining:** 14

---

## Notes

- Sprint started: 2026-04-02
- Focus on S31-01 (Timeline Markers) first - P0 priority
- Model schema changes needed for markers array
