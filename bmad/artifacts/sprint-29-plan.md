# Sprint 29 Planning

**Sprint Number:** 29  
**Status:** Planning  
**Target Points:** 12-16 pts  
**Theme:** Post-Release Features & Performance

---

## Sprint Goal

Following the successful v0.5.0 release, Sprint 29 focuses on:
1. Performance optimizations for large timelines
2. User-requested features from v0.5.0 feedback
3. Technical debt cleanup
4. Preparation for v0.6.0

---

## Backlog & Story Selection

### Must-Have (8-10 pts)

#### S29-01: Virtual Scrolling for Large Timelines (5 pts)
**Description:** Implement virtual scrolling to handle timelines with 500+ events without performance degradation.

**Features:**
- Virtual list component for timeline events
- Windowing for off-screen events
- Smooth scrolling with 60fps target
- Progressive loading indicator

**Acceptance Criteria:**
- [ ] Timeline renders 1000+ events without lag
- [ ] Scroll performance maintains 60fps
- [ ] Memory usage stays under 200MB
- [ ] Unit tests (10+ tests)
- [ ] E2E performance test

---

#### S29-02: Bulk Event Operations (3 pts)
**Description:** Allow users to perform operations on multiple selected events simultaneously.

**Features:**
- Multi-select with Shift+Click / Ctrl+Click
- Bulk delete, duplicate, move
- Batch property editing (camera, lighting, FX)
- Selection marquee (drag to select)

**Acceptance Criteria:**
- [ ] Multi-select works with keyboard modifiers
- [ ] Bulk operations apply to all selected events
- [ ] Undo/Redo works for bulk operations
- [ ] Visual feedback for selection state

---

#### S29-03: Performance Profiling Tools (2 pts)
**Description:** Add developer tools to identify and diagnose performance bottlenecks.

**Features:**
- Performance overlay (FPS, render time, memory)
- Event timing breakdown
- Component render profiling
- Export performance report

**Acceptance Criteria:**
- [ ] Toggle performance overlay
- [ ] Real-time FPS display
- [ ] Render time per component
- [ ] Memory usage graph

---

### Should-Have (4-6 pts)

#### S29-04: UI/UX Polish — Professional Design (3 pts)
**Description:** Audit and refine entire application UI to ensure professional quality: pro, sober, light, airy, consistent, balanced.

**Features:**
- Spacing & typography consistency audit
- Color palette refinement (subtle accents)
- Component polish (buttons, forms, cards, modals)
- Visual hierarchy optimization
- Accessibility compliance check

**Acceptance Criteria:**
- [ ] All spacing uses design tokens (4px scale)
- [ ] Typography scale consistent (11-20px)
- [ ] Color contrast meets WCAG AA
- [ ] No visual clutter or decorations
- [ ] All states subtle (hover, active, selected)

---

#### S29-05: Enhanced Search & Filter (3 pts)
**Description:** Improve global search with advanced filtering options.

**Features:**
- Search by prompt, character, mood, lighting type
- Filter by time range
- Filter by asset usage
- Saved search presets

**Acceptance Criteria:**
- [ ] Full-text search across all fields
- [ ] Multiple filter criteria
- [ ] Search results highlight matches
- [ ] Keyboard shortcut (Ctrl+F)

---

#### S29-05: Keyboard Shortcuts Customization (2 pts)
**Description:** Allow users to customize keyboard shortcuts to their workflow.

**Features:**
- Shortcuts settings panel
- Preset configurations (default, Vim, Blender)
- Export/import shortcut presets
- Conflict detection

**Acceptance Criteria:**
- [ ] All shortcuts customizable
- [ ] Preset configurations
- [ ] Import/export presets
- [ ] Conflict warnings

---

#### S29-06: Auto-Save Improvements (1 pt)
**Description:** Enhance auto-save reliability and user feedback.

**Features:**
- Configurable auto-save interval
- Save status indicator improvements
- Recovery from crashes
- Version history (last 10 saves)

**Acceptance Criteria:**
- [ ] Configurable interval (30s - 5min)
- [ ] Clear save status indicator
- [ ] Crash recovery prompt
- [ ] Version history panel

---

## Estimation

| Story | Points | Effort | Risk | Priority |
|-------|--------|--------|------|----------|
| S29-01 (Virtual scrolling) | 5 | High | Medium | P0 |
| S29-02 (Bulk operations) | 3 | Medium | Low | P0 |
| S29-03 (Performance tools) | 2 | Low | Low | P1 |
| S29-04 (Enhanced search) | 3 | Medium | Low | P1 |
| S29-05 (Shortcuts config) | 2 | Low | Low | P2 |
| S29-06 (Auto-save) | 1 | Low | Low | P2 |
| **Total** | **16** | — | — | — |

**Recommendation:** Commit to S29-01, S29-02, S29-03 (10 pts). Add S29-04 if time permits.

---

## Technical Approach

### S29-01: Virtual Scrolling

**New Components:**
```
src/lib/components/workspace/virtual-list.svelte
├── Windowing logic
├── Scroll position tracking
├── Item recycling
└── Dynamic height support
```

**Implementation:**
- Use `@tanstack/virtual` or custom implementation
- Maintain Svelte 5 reactivity
- Support variable-height event cards
- Preserve selection state during scroll

---

### S29-02: Bulk Operations

**Modified Components:**
- `SequenceOrchestrator.svelte` — Multi-select logic
- `TimelineEvent.svelte` — Selection visual feedback
- `PropertiesPanel.svelte` — Bulk edit mode

**Store Updates:**
- `model-store.svelte.ts` — Multi-selection state
- `history.svelte.ts` — Bulk undo/redo

---

### S29-03: Performance Tools

**New Components:**
```
src/lib/components/dev/PerformanceOverlay.svelte
├── FPS counter
├── Render time graph
├── Memory usage
└── Component breakdown
```

**Utilities:**
- `performance-monitor.ts` — Metrics collection
- `render-tracker.ts` — Component render timing

---

## Risk & Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Virtual scrolling complexity | Medium | Use @tanstack/virtual library |
| Multi-select conflicts | Low | Clear visual feedback, undo support |
| Performance overhead | Low | Lazy loading, debounced updates |
| Breaking existing features | Low | Comprehensive test coverage |

---

## Test Strategy

### Unit Tests (90% coverage target)
- Virtual list windowing logic
- Multi-selection state management
- Bulk operation handlers
- Performance metrics collection

### Integration Tests (5-10 scenarios)
- Large timeline rendering (500+ events)
- Multi-select + bulk delete
- Performance overlay accuracy

### Performance Tests (new)
- Timeline render time vs event count
- Scroll FPS measurement
- Memory leak detection

---

## Implementation Phases

### Phase 1: Virtual Scrolling (3 days)
- [ ] Install @tanstack/virtual
- [ ] Create virtual-list component
- [ ] Integrate with timeline
- [ ] Performance testing
- [ ] Unit tests (10+)

### Phase 2: Bulk Operations (2 days)
- [ ] Multi-select state management
- [ ] Visual feedback (highlighting)
- [ ] Bulk delete/duplicate/move
- [ ] Undo/Redo integration
- [ ] Unit tests (8+)

### Phase 3: Performance Tools (1 day)
- [ ] FPS counter
- [ ] Render time tracking
- [ ] Memory monitoring
- [ ] Toggle overlay
- [ ] Unit tests (5+)

### Phase 4: Polish & Testing (1 day)
- [ ] Bug fixes
- [ ] Accessibility review
- [ ] Documentation updates
- [ ] Final QA

---

## Success Criteria

| Criterion | Metric | Status |
|-----------|--------|--------|
| Virtual scrolling | 1000+ events at 60fps | ⏳ |
| Bulk operations | 5+ operations supported | ⏳ |
| Performance tools | 4+ metrics displayed | ⏳ |
| All tests pass | 460+ passing | ⏳ |
| Code audit approved | No critical issues | ⏳ |
| Documentation | Complete | ⏳ |

---

## Timeline Estimate

| Phase | Estimate | Actual |
|-------|----------|--------|
| Phase 1 (Virtual scrolling) | 3 days | ⏳ |
| Phase 2 (Bulk operations) | 2 days | ⏳ |
| Phase 3 (Performance tools) | 1 day | ⏳ |
| Phase 4 (Polish) | 1 day | ⏳ |
| **Total** | **7 days** | **⏳** |

**Recommended:** 1.5 weeks (7-8 working days)

---

## Decision Points

1. **Virtual scrolling library vs custom?**
   - Recommended: @tanstack/virtual (proven, maintained)
   - Alternative: Custom implementation (more control, more work)

2. **Multi-select modifier keys?**
   - Recommended: Ctrl+Click (single), Shift+Click (range)
   - Standard convention, matches file explorers

3. **Performance overlay always available or dev-only?**
   - Recommended: Always available (Settings → Advanced)
   - Useful for users with large projects

---

## Sprint Kickoff

**Start:** After v0.5.0 release
**Duration:** 1.5 weeks
**Team:** Developer (async implementation)
**Next Review:** After Phase 2 (Bulk operations complete)

---

**Prepared by:** BMAD Planning  
**Date:** 2026-03-27  
**Status:** READY FOR KICKOFF
