# Sprint 30 Planning

**Sprint Number:** 30  
**Status:** Planning  
**Target Points:** 12-15 pts  
**Theme:** Enhanced UX & Automation

---

## Sprint Goal

Following v0.6.0 release, Sprint 30 focuses on:
1. Enhanced search and filtering capabilities
2. Keyboard shortcuts customization
3. Auto-save improvements
4. Technical debt cleanup from previous sprints

---

## Backlog & Story Selection

### Must-Have (8-10 pts)

#### S30-01: Enhanced Search & Filter (4 pts)
**Description:** Advanced search with multiple filter criteria and saved presets.

**Features:**
- Full-text search across all fields (prompts, characters, moods, lighting)
- Filter by time range
- Filter by asset usage
- Saved search presets
- Keyboard shortcut (Ctrl+F)

**Acceptance Criteria:**
- [ ] Search across timeline events, assets, config
- [ ] Multiple filter criteria combinable
- [ ] Search results highlight matches
- [ ] Save/load search presets
- [ ] Unit tests (10+)

---

#### S30-02: Keyboard Shortcuts Customization (3 pts)
**Description:** Allow users to customize keyboard shortcuts.

**Features:**
- Shortcuts settings panel
- Preset configurations (Default, Vim, Blender, Adobe)
- Export/import shortcut presets
- Conflict detection and warnings
- Reset to defaults

**Acceptance Criteria:**
- [ ] All shortcuts listed and customizable
- [ ] 4+ preset configurations
- [ ] Import/export as JSON
- [ ] Conflict detection
- [ ] Unit tests (8+)

---

#### S30-03: Auto-Save Improvements (2 pts)
**Description:** Enhanced auto-save with better feedback and recovery.

**Features:**
- Configurable auto-save interval (30s - 5min)
- Improved save status indicator
- Crash recovery prompt
- Version history (last 10 saves)
- Manual snapshot button

**Acceptance Criteria:**
- [ ] Configurable interval in Settings
- [ ] Clear save status (saved/saving/unsaved/error)
- [ ] Recovery prompt after crash
- [ ] Version history panel
- [ ] Unit tests (6+)

---

### Should-Have (4-5 pts)

#### S30-04: Timeline Markers Enhancement (2 pts)
**Description:** Improved markers with colors, labels, and navigation.

**Features:**
- Color-coded markers
- Custom labels
- Click to jump to marker
- Marker categories (chapter, beat, note)
- Export markers to CSV

**Acceptance Criteria:**
- [ ] 8+ marker colors
- [ ] Custom label editing
- [ ] Jump to marker on click
- [ ] Category filtering
- [ ] CSV export

---

#### S30-05: Asset Usage Tracking (2 pts)
**Description:** Track which assets are used in timeline events.

**Features:**
- Asset usage count display
- Find unused assets
- Quick navigation to using events
- Warning before deleting used assets

**Acceptance Criteria:**
- [ ] Usage count on each asset
- [ ] "Unused" filter
- [ ] Click to navigate to events
- [ ] Delete confirmation with usage info

---

#### S30-06: Tooltip Improvements (1 pt)
**Description:** Enhanced tooltips with more context and examples.

**Features:**
- Property descriptions
- Example values
- Keyboard shortcut hints
- Disable tooltips option

**Acceptance Criteria:**
- [ ] All form fields have tooltips
- [ ] Examples shown where relevant
- [ ] Shortcut hints in tooltips
- [ ] Toggle in Settings

---

## Estimation

| Story | Points | Effort | Risk | Priority |
|-------|--------|--------|------|----------|
| S30-01 (Enhanced search) | 4 | Medium | Low | P0 |
| S30-02 (Shortcuts config) | 3 | Medium | Low | P0 |
| S30-03 (Auto-save) | 2 | Low | Low | P0 |
| S30-04 (Markers) | 2 | Low | Low | P1 |
| S30-05 (Asset usage) | 2 | Low | Low | P1 |
| S30-06 (Tooltips) | 1 | Low | Low | P2 |
| **Total** | **14** | — | — | — |

**Recommendation:** Commit to S30-01, S30-02, S30-03 (9 pts). Add S30-04 if time permits.

---

## Technical Approach

### S30-01: Enhanced Search

**New Components:**
```
src/lib/components/app/SearchPanel.svelte
├── Search input with debounce
├── Filter chips
├── Results list
└── Saved presets panel
```

**Utilities:**
- `search-index.ts` — Full-text search index
- `search-filters.ts` — Filter logic

---

### S30-02: Keyboard Shortcuts

**Store:**
```typescript
// shortcuts.svelte.ts
interface ShortcutConfig {
  [action: string]: string; // e.g., { 'undo': 'Ctrl+Z' }
}
```

**Components:**
- `ShortcutsPanel.svelte` — Settings UI
- `ShortcutRecorder.svelte` — Key capture input

---

### S30-03: Auto-Save

**Modified:**
- `persistence.ts` — Configurable interval
- `model-store.svelte.ts` — Version history

**New:**
- `version-history.ts` — Save version management

---

## Risk & Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Search performance | Low | Debounce, index-based search |
| Shortcut conflicts | Medium | Validation, warnings |
| Version history memory | Low | Limit to 10 versions |
| Breaking existing features | Low | Comprehensive tests |

---

## Test Strategy

### Unit Tests (90% coverage target)
- Search index creation and queries
- Shortcut parsing and conflict detection
- Auto-save timing and recovery
- Version history management

### Integration Tests
- Search → Navigate to result
- Shortcut → Action execution
- Crash → Recovery prompt

---

## Implementation Phases

### Phase 1: Enhanced Search (2 days)
- [ ] Search index creation
- [ ] Filter logic
- [ ] Results panel
- [ ] Saved presets
- [ ] Tests (10+)

### Phase 2: Keyboard Shortcuts (1.5 days)
- [ ] Shortcuts store
- [ ] Settings panel
- [ ] Key recorder
- [ ] Presets
- [ ] Tests (8+)

### Phase 3: Auto-Save (1 day)
- [ ] Configurable interval
- [ ] Version history
- [ ] Recovery logic
- [ ] Tests (6+)

### Phase 4: Polish (0.5 day)
- [ ] Bug fixes
- [ ] Documentation
- [ ] Final QA

---

## Success Criteria

| Criterion | Metric | Status |
|-----------|--------|--------|
| Search performance | < 100ms for 1000 events | ⏳ |
| Shortcut customization | All actions customizable | ⏳ |
| Auto-save reliability | No data loss on crash | ⏳ |
| All tests pass | 460+ passing | ⏳ |
| Code audit approved | No critical issues | ⏳ |

---

## Timeline Estimate

| Phase | Estimate | Actual |
|-------|----------|--------|
| Phase 1 (Search) | 2 days | ⏳ |
| Phase 2 (Shortcuts) | 1.5 days | ⏳ |
| Phase 3 (Auto-save) | 1 day | ⏳ |
| Phase 4 (Polish) | 0.5 day | ⏳ |
| **Total** | **5 days** | **⏳** |

**Recommended:** 1 week (5 working days)

---

## Decision Points

1. **Search library vs custom?**
   - Recommended: Custom (simple needs, no dependencies)
   - Alternative: Fuse.js (fuzzy search, +5KB)

2. **Shortcut storage location?**
   - Recommended: localStorage + export/import
   - Sync with project file: No (user-specific)

3. **Version history limit?**
   - Recommended: 10 versions
   - Storage: ~500KB for typical projects

---

## Sprint Kickoff

**Start:** After v0.6.0 release
**Duration:** 1 week
**Team:** Developer (async implementation)
**Next Review:** After Phase 2 (Shortcuts complete)

---

**Prepared by:** BMAD Planning  
**Date:** 2026-03-27  
**Status:** READY FOR KICKOFF
