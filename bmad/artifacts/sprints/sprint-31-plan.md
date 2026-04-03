# Sprint 31 Plan — Timeline Markers & Asset Tracking

**Version:** v0.8.0  
**Theme:** Navigation & Analytics  
**Points:** 11  
**Duration:** 2 weeks (2026-04-02 → 2026-04-16)  
**Status:** Pending

---

## Overview

Sprint 31 introduces **timeline markers** for navigation and **asset usage tracking** to help users understand their timeline composition. This sprint focuses on power-user features for better timeline management.

---

## Stories

### S31-01: Timeline Markers (4 points) — P0

**Status:** Pending  
**Priority:** P0

#### Description
Add visual markers on timeline for key moments, chapter divisions, and beat markers.

#### Features
- Add/remove markers at playhead position
- Marker types: chapter, beat, note, cue
- Color coding by type
- Click marker to jump to time
- Marker labels with tooltips
- Export markers to CSV/JSON
- Keyboard shortcut (M to add marker)

#### Acceptance Criteria
- [ ] Markers stored in model (new `markers[]` array)
- [ ] Visual markers rendered on timeline ruler
- [ ] Click/jump functionality
- [ ] Add/edit/delete via context menu
- [ ] Export to CSV/JSON
- [ ] Unit tests (8+)
- [ ] E2E test (add marker → navigate)

#### Technical Design

**New Files:**
```
src/lib/components/app/TimelineMarkers.svelte   (~180 lines)
src/lib/components/app/MarkerEditor.svelte      (~120 lines)
src/lib/utils/marker-utils.ts                   (~100 lines)
src/lib/model/marker-types.ts                   (~50 lines)
```

**Type Definition:**
```typescript
// src/lib/model/marker-types.ts
export type MarkerType = 'chapter' | 'beat' | 'note' | 'cue';

export interface TimelineMarker {
  id: string; // marker_01
  time: number; // ms
  type: MarkerType;
  label: string;
  color?: string; // optional custom color
  notes?: string;
}

export interface Model {
  // ... existing fields
  markers?: TimelineMarker[];
}
```

**Marker Colors (default):**
```typescript
const MARKER_COLORS: Record<MarkerType, string> = {
  chapter: '#ef4444', // red
  beat: '#3b82f6',    // blue
  note: '#f59e0b',    // amber
  cue: '#10b981',     // green
};
```

#### Implementation Plan

**Day 1-2: Types & Store**
- [ ] Create marker-types.ts
- [ ] Update model-types.ts with markers field
- [ ] Update model-template.ts schema
- [ ] Update model-store.svelte.ts for marker CRUD
- [ ] Unit tests for types/schema

**Day 3-4: Marker Component**
- [ ] Create TimelineMarkers.svelte
- [ ] Render markers on timeline ruler
- [ ] Click to jump functionality
- [ ] Context menu (add/edit/delete)
- [ ] Tooltip on hover

**Day 5: Marker Editor**
- [ ] Create MarkerEditor.svelte (modal)
- [ ] Form for type, label, color, notes
- [ ] Validation
- [ ] Keyboard shortcut (M key)

**Day 6: Export & Tests**
- [ ] Export markers to CSV
- [ ] Export markers to JSON
- [ ] Unit tests (8+)
- [ ] E2E test

#### Dependencies
- None (standalone feature)

#### Risks
| Risk | Probability | Mitigation |
|------|-------------|------------|
| Timeline layout disruption | Low | Absolute positioning overlay |
| Marker overlap at zoom out | Medium | Min spacing, clustering |

---

### S31-02: Asset Usage Tracking (4 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Track which assets are used where, identify unused assets, show usage count.

#### Features
- Usage count on each asset card
- "Find usage" context menu on assets
- Unused assets filter/highlight
- Warning on delete if asset in use
- Usage breakdown by event time

#### Acceptance Criteria
- [ ] Usage index built from timeline events
- [ ] Count displayed on asset cards
- [ ] "Find usage" shows list of events
- [ ] Unused assets highlighted in AssetManager
- [ ] Delete warning modal
- [ ] Unit tests (10+)

#### Technical Design

**New Files:**
```
src/lib/utils/asset-usage.ts          (~150 lines)
src/lib/components/app/UsageBadge.svelte   (~60 lines)
src/lib/components/app/UsageModal.svelte   (~100 lines)
```

**Usage Index:**
```typescript
// src/lib/utils/asset-usage.ts
export interface AssetUsage {
  assetId: string;
  assetType: 'character' | 'environment' | 'audio';
  usedIn: UsageLocation[];
}

export interface UsageLocation {
  eventId: string;
  time: number;
  context: 'actor' | 'background' | 'audio_track' | 'reference';
}

export function buildUsageIndex(model: Model): Map<string, AssetUsage>;
export function findUnusedAssets(model: Model): string[];
export function getUsageCount(model: Model, assetId: string): number;
```

#### Implementation Plan

**Day 1-2: Usage Index**
- [ ] Create asset-usage.ts
- [ ] buildUsageIndex() function
- [ ] findUnusedAssets() function
- [ ] Unit tests (6+)

**Day 3: UI Components**
- [ ] Create UsageBadge.svelte
- [ ] Display count on asset cards
- [ ] Highlight unused assets (opacity 0.6)

**Day 4: Context Menu & Modal**
- [ ] "Find usage" context menu item
- [ ] Create UsageModal.svelte
- [ ] Show usage list with times
- [ ] Click to navigate to event

**Day 5: Delete Warning & Tests**
- [ ] Warning modal on delete if in use
- [ ] Unit tests (4+)
- [ ] Integration tests

---

### S31-03: Event Statistics Dashboard (3 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Visual dashboard showing timeline statistics and insights.

#### Features
- Total events count
- Timeline duration breakdown
- Character screen time
- Mood distribution chart
- Lighting type distribution
- Audio track count
- Export stats as JSON

#### Acceptance Criteria
- [ ] Stats panel (collapsible)
- [ ] Charts for distributions (simple SVG)
- [ ] Real-time updates on model change
- [ ] Export stats JSON
- [ ] Unit tests (6+)

#### Technical Design

**New Files:**
```
src/lib/components/app/StatsPanel.svelte     (~200 lines)
src/lib/utils/stats-calculator.ts            (~120 lines)
```

**Stats Structure:**
```typescript
interface TimelineStats {
  totalEvents: number;
  totalDuration: number; // ms
  characterScreenTime: Map<string, number>; // ms per character
  moodDistribution: Record<Mood, number>; // count per mood
  lightingDistribution: Record<LightingType, number>;
  audioTrackCount: number;
  markerCount: number;
  averageEventDuration: number;
}
```

#### Implementation Plan

**Day 1: Stats Calculator**
- [ ] Create stats-calculator.ts
- [ ] calculateStats(model) function
- [ ] Unit tests (4+)

**Day 2-3: Stats Panel**
- [ ] Create StatsPanel.svelte
- [ ] Summary cards (events, duration)
- [ ] Simple bar charts (SVG)
- [ ] Character screen time list

**Day 4: Export & Polish**
- [ ] Export stats as JSON
- [ ] Real-time updates ($effect)
- [ ] Unit tests (2+)

---

## Technical Debt

- [ ] Update model-example.ts with markers
- [ ] Update model inspector to show markers
- [ ] Update export/import to include markers

---

## Testing Plan

### Unit Tests (24 total)
- marker-types.test.ts (6 tests)
- marker-utils.test.ts (6 tests)
- asset-usage.test.ts (8 tests)
- stats-calculator.test.ts (4 tests)

### E2E Tests (3 total)
- markers-add-navigate.spec.ts
- asset-usage-find.spec.ts
- stats-panel-display.spec.ts

---

## Definition of Done

- [ ] All stories complete
- [ ] 24+ unit tests passing
- [ ] 3 E2E tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Manual QA pass
- [ ] CHANGELOG.md updated
- [ ] README.md updated (features list)

---

## Release Notes Draft

### v0.8.0 — Timeline Markers & Asset Tracking

**New Features:**
- 📍 **Timeline Markers** — Add chapter, beat, note, and cue markers. Click to jump, export to CSV.
- 📊 **Asset Usage Tracking** — See which assets are used where. Find unused assets instantly.
- 📈 **Statistics Dashboard** — View timeline stats: event count, screen time, mood distribution.

**Improvements:**
- Better timeline navigation with visual markers
- Asset management with usage insights

**Technical:**
- New `markers[]` field in Model schema
- Asset usage index for real-time tracking

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-04-02  
**Sprint End:** 2026-04-16
