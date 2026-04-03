# Roadmap to v1.0 — Complete Sprint Plan

**Project:** Latent-line  
**Current Version:** v0.7.0 (2026-03-27)  
**Target Version:** v1.0.0 (Production Ready)  
**Estimated Completion:** 8-10 sprints (~12-15 weeks)

---

## Vision v1.0

Latent-line devient une application **production-ready** pour la création de narratives AI-driven avec :
- Timeline editing avancé avec collaboration temps réel
- Intégration complète ComfyUI/Deforum pour génération vidéo
- Export multi-formats professionnel (EDL, AAF, XML)
- Performance optimale sur gros projets (1000+ events)
- UX polish complète (tooltips, animations, responsive)

---

## Sprint Summary

| Sprint | Version | Theme | Points | Duration |
|--------|---------|-------|--------|----------|
| S31 | v0.8.0 | Timeline Markers & Asset Tracking | 11 | 2 weeks |
| S32 | v0.8.5 | Tooltip System & UX Micro-interactions | 9 | 1.5 weeks |
| S33 | v0.9.0 | Real-time Collaboration Foundation | 14 | 2.5 weeks |
| S34 | v0.9.5 | ComfyUI Workflow Integration | 16 | 3 weeks |
| S35 | v0.10.0 | Advanced Export (AAF, XML, FCP) | 12 | 2 weeks |
| S36 | v0.11.0 | Performance at Scale | 13 | 2 weeks |
| S37 | v0.12.0 | Mobile & Responsive Experience | 10 | 1.5 weeks |
| S38 | v1.0.0 | Polish, Testing, Documentation | 15 | 2.5 weeks |

**Total:** 100 points, ~17 weeks

---

## Detailed Sprint Plans

---

### Sprint 31 — Timeline Markers & Asset Tracking (v0.8.0)

**Theme:** Navigation & Analytics  
**Points:** 11  
**Duration:** 2 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S31-01 | Timeline Markers | 4 | P0 |
| S31-02 | Asset Usage Tracking | 4 | P1 |
| S31-03 | Event Statistics Dashboard | 3 | P2 |

#### S31-01: Timeline Markers

**Description:** Add visual markers on timeline for key moments, chapter divisions, and beat markers.

**Features:**
- Add/remove markers at playhead position
- Marker types: chapter, beat, note, cue
- Color coding by type
- Click marker to jump to time
- Marker labels with tooltips
- Export markers to CSV/JSON
- Keyboard shortcut (M to add marker)

**Acceptance Criteria:**
- [ ] Markers stored in model (new `markers[]` array)
- [ ] Visual markers rendered on timeline ruler
- [ ] Click/jump functionality
- [ ] Add/edit/delete via context menu
- [ ] Unit tests (8+)
- [ ] E2E test (add marker → navigate)

**Technical Design:**
```typescript
interface TimelineMarker {
  id: string; // marker_01
  time: number; // ms
  type: 'chapter' | 'beat' | 'note' | 'cue';
  label: string;
  color?: string; // optional custom color
  notes?: string;
}

interface Model {
  // ... existing
  markers?: TimelineMarker[];
}
```

---

#### S31-02: Asset Usage Tracking

**Description:** Track which assets are used where, identify unused assets, show usage count.

**Features:**
- Usage count on each asset card
- "Find usage" context menu on assets
- Unused assets filter/highlight
- Warning on delete if asset in use
- Usage breakdown by event time

**Acceptance Criteria:**
- [ ] Usage index built from timeline events
- [ ] Count displayed on asset cards
- [ ] "Find usage" shows list of events
- [ ] Unused assets highlighted in AssetManager
- [ ] Delete warning modal
- [ ] Unit tests (10+)

**Technical Design:**
```typescript
// src/lib/utils/asset-usage.ts
interface AssetUsage {
  assetId: string;
  assetType: 'character' | 'environment' | 'audio';
  usedIn: UsageLocation[];
}

interface UsageLocation {
  eventId: string;
  time: number;
  context: 'actor' | 'background' | 'audio_track' | 'reference';
}

function buildUsageIndex(model: Model): Map<string, AssetUsage>;
function findUnusedAssets(model: Model): string[];
```

---

#### S31-03: Event Statistics Dashboard

**Description:** Visual dashboard showing timeline statistics and insights.

**Features:**
- Total events count
- Timeline duration breakdown
- Character screen time
- Mood distribution chart
- Lighting type distribution
- Audio track count
- Export stats as JSON

**Acceptance Criteria:**
- [ ] Stats panel (collapsible)
- [ ] Charts for distributions (simple SVG)
- [ ] Real-time updates on model change
- [ ] Export stats JSON
- [ ] Unit tests (6+)

---

### Sprint 32 — Tooltip System & UX Micro-interactions (v0.8.5)

**Theme:** UX Polish  
**Points:** 9  
**Duration:** 1.5 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S32-01 | Tooltip System | 4 | P1 |
| S32-02 | Loading States & Skeletons | 3 | P2 |
| S32-03 | Micro-animations & Transitions | 2 | P3 |

#### S32-01: Tooltip System

**Description:** Consistent tooltip system across the application.

**Features:**
- TooltipPrimitive wrapper component
- Tooltips on all icon buttons
- Keyboard shortcut hints
- Delay on show (300ms)
- Escape to dismiss
- Touch support

**Acceptance Criteria:**
- [ ] Tooltip component (accessible)
- [ ] All toolbar buttons have tooltips
- [ ] Shortcut hints shown
- [ ] ARIA labels correct
- [ ] Unit tests (5+)

---

#### S32-02: Loading States & Skeletons

**Description:** Visual feedback during async operations.

**Features:**
- Skeleton loaders for AssetManager
- Spinner for timeline scrubbing (heavy models)
- Progress bar for import/export
- Optimistic UI updates

**Acceptance Criteria:**
- [ ] Skeleton components
- [ ] Loading state on import/export
- [ ] Progress indication
- [ ] No layout shift during load

---

#### S32-03: Micro-animations & Transitions

**Description:** Smooth transitions for better UX feel.

**Features:**
- Fade transitions on panel open/close
- Slide animations on event add/remove
- Scale on hover for cards
- Smooth playhead movement

**Acceptance Criteria:**
- [ ] CSS transitions on interactions
- [ ] Svelte transitions for lists
- [ ] Respects `prefers-reduced-motion`
- [ ] 60fps animations

---

### Sprint 33 — Real-time Collaboration Foundation (v0.9.0)

**Theme:** Collaboration  
**Points:** 14  
**Duration:** 2.5 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S33-01 | WebSocket Server Foundation | 5 | P0 |
| S33-02 | Multi-user Presence System | 5 | P1 |
| S33-03 | Conflict-free Model Sync | 4 | P0 |

#### S33-01: WebSocket Server Foundation

**Description:** Backend server for real-time collaboration.

**Features:**
- WebSocket server (Node.js/Express)
- Room-based connections
- Authentication via JWT
- Message protocol (join, leave, update, sync)
- Heartbeat/ping-pong

**Acceptance Criteria:**
- [ ] Server runs on port 8080
- [ ] Clients can join rooms
- [ ] Broadcast messages to room
- [ ] Handle disconnect gracefully
- [ ] Unit tests (10+)
- [ ] Integration tests (5+)

**Technical Design:**
```typescript
// Server (Node.js + ws)
interface WSMessage {
  type: 'join' | 'leave' | 'update' | 'sync' | 'presence';
  roomId: string;
  userId: string;
  payload?: any;
}

// Client
class CollaborationClient {
  connect(roomId: string): Promise<void>;
  sendUpdate(patch: ModelPatch): void;
  onUpdate(callback: (patch: ModelPatch) => void): void;
  disconnect(): void;
}
```

---

#### S33-02: Multi-user Presence System

**Description:** Show who else is editing the timeline.

**Features:**
- User list panel
- Avatars with colors
- Current selection indicators
- "Typing" indicators
- Join/leave notifications

**Acceptance Criteria:**
- [ ] PresencePanel component
- [ ] User list with colors
- [ ] Selection cursors on timeline
- [ ] Toast on join/leave
- [ ] Unit tests (6+)

---

#### S33-03: Conflict-free Model Sync

**Description:** Sync model changes without conflicts.

**Features:**
- Operational Transform or CRDT-lite
- Patch-based updates (not full model)
- Undo/Redo across network
- Offline queue + replay on reconnect

**Acceptance Criteria:**
- [ ] Patch format defined
- [ ] Apply patches to local model
- [ ] Queue offline changes
- [ ] Replay on reconnect
- [ ] Unit tests (12+)

---

### Sprint 34 — ComfyUI Workflow Integration (v0.9.5)

**Theme:** AI Production  
**Points:** 16  
**Duration:** 3 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S34-01 | ComfyUI Workflow Builder | 6 | P0 |
| S34-02 | Batch Render Queue | 5 | P1 |
| S34-03 | Render Progress Tracking | 5 | P1 |

#### S34-01: ComfyUI Workflow Builder

**Description:** Visual workflow builder for ComfyUI pipelines.

**Features:**
- Node-based workflow editor
- Pre-built templates (Deforum, FramePack, AnimateDiff)
- Parameter mapping from timeline events
- Save/load workflow JSON
- Test run single event

**Acceptance Criteria:**
- [ ] Workflow editor UI
- [ ] 3+ templates included
- [ ] Map timeline params to workflow
- [ ] Save/load workflows
- [ ] Unit tests (8+)

---

#### S34-02: Batch Render Queue

**Description:** Queue multiple events for rendering.

**Features:**
- Select events → "Render batch"
- Queue management (pause, resume, cancel)
- Priority ordering
- Estimated time calculation
- Output folder selection

**Acceptance Criteria:**
- [ ] Batch queue UI
- [ ] Send to ComfyUI API
- [ ] Track queue status
- [ ] Cancel/pause/resume
- [ ] Unit tests (10+)

---

#### S34-03: Render Progress Tracking

**Description:** Real-time render progress with previews.

**Features:**
- Progress bar per event
- Current frame preview
- ETA calculation
- Render log viewer
- Notification on complete

**Acceptance Criteria:**
- [ ] Progress panel
- [ ] WebSocket updates from ComfyUI
- [ ] Preview thumbnails
- [ ] Log viewer
- [ ] Toast on complete
- [ ] Unit tests (8+)

---

### Sprint 35 — Advanced Export (v0.10.0)

**Theme:** Professional Export  
**Points:** 12  
**Duration:** 2 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S35-01 | AAF Export | 5 | P1 |
| S35-02 | Final Cut Pro XML | 4 | P2 |
| S35-03 | Premiere Pro Project | 3 | P2 |

#### S35-01: AAF Export

**Description:** Export timeline as AAF for professional NLE import.

**Features:**
- AAF file generation
- Video tracks (events as clips)
- Audio tracks (BGM, SFX, dialogue)
- Timecode mapping
- Metadata embedding

**Acceptance Criteria:**
- [ ] AAF file generated
- [ ] Imports in DaVinci Resolve
- [ ] Audio tracks preserved
- [ ] Timecode correct
- [ ] Unit tests (6+)

---

#### S35-02: Final Cut Pro XML

**Description:** FCPX XML export for Mac editors.

**Features:**
- FCPX 10.6 XML format
- Event → clip mapping
- Audio lanes
- Basic transitions

**Acceptance Criteria:**
- [ ] Valid FCPX XML
- [ ] Imports in Final Cut Pro
- [ ] Clips with timecodes
- [ ] Unit tests (5+)

---

#### S35-03: Premiere Pro Project

**Description:** Premiere project export via JSON/XML.

**Features:**
- Premiere project format
- Sequence structure
- Clip references

**Acceptance Criteria:**
- [ ] Premiere-compatible export
- [ ] Unit tests (4+)

---

### Sprint 36 — Performance at Scale (v0.11.0)

**Theme:** Performance  
**Points:** 13  
**Duration:** 2 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S36-01 | Virtual Scrolling v2 | 5 | P0 |
| S36-02 | Model Chunking | 4 | P1 |
| S36-03 | Web Worker for Heavy Ops | 4 | P2 |

#### S36-01: Virtual Scrolling v2

**Description:** Improved virtual scrolling for 1000+ events.

**Features:**
- Windowed rendering
- Dynamic row heights
- Smooth scrubbing
- Pre-rendering ahead

**Acceptance Criteria:**
- [ ] 1000 events at 60fps
- [ ] No memory leaks
- [ ] Smooth scroll
- [ ] Benchmark tests

---

#### S36-02: Model Chunking

**Description:** Load model in chunks for large projects.

**Features:**
- Lazy load timeline events
- Background loading
- Loading indicators

**Acceptance Criteria:**
- [ ] Chunked model loading
- [ ] Progressive rendering
- [ ] Unit tests (6+)

---

#### S36-03: Web Worker for Heavy Ops

**Description:** Offload heavy computation to workers.

**Features:**
- Search indexing in worker
- Validation in worker
- Export generation in worker

**Acceptance Criteria:**
- [ ] Workers for heavy ops
- [ ] Main thread stays responsive
- [ ] Unit tests (5+)

---

### Sprint 37 — Mobile & Responsive Experience (v0.12.0)

**Theme:** Responsive  
**Points:** 10  
**Duration:** 1.5 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S37-01 | Responsive Layout | 4 | P1 |
| S37-02 | Touch Gestures | 3 | P2 |
| S37-03 | Mobile Timeline View | 3 | P2 |

#### S37-01: Responsive Layout

**Description:** Adapt UI for tablets and small screens.

**Features:**
- Collapsible panels
- Stacked layout < 768px
- Touch-friendly targets

**Acceptance Criteria:**
- [ ] Works on iPad (768px+)
- [ ] Works on mobile (375px+)
- [ ] No horizontal scroll
- [ ] ARIA labels correct

---

#### S37-02: Touch Gestures

**Description:** Gesture controls for timeline navigation.

**Features:**
- Pinch to zoom
- Swipe to scrub
- Tap to select
- Long-press context menu

**Acceptance Criteria:**
- [ ] Pinch zoom works
- [ ] Swipe scrubs timeline
- [ ] Context menu on long-press
- [ ] Unit tests (4+)

---

#### S37-03: Mobile Timeline View

**Description:** Simplified timeline for mobile.

**Features:**
- Compact event cards
- Vertical timeline option
- Simplified properties panel

**Acceptance Criteria:**
- [ ] Mobile-optimized view
- [ ] All CRUD operations work
- [ ] Unit tests (4+)

---

### Sprint 38 — Polish, Testing, Documentation (v1.0.0)

**Theme:** Release Ready  
**Points:** 15  
**Duration:** 2.5 weeks

#### Stories

| ID | Title | Points | Priority |
|----|-------|--------|----------|
| S38-01 | End-to-End Test Suite | 5 | P0 |
| S38-02 | Complete Documentation | 4 | P0 |
| S38-03 | Bug Bash & Polish | 4 | P1 |
| S38-04 | Performance Benchmark | 2 | P2 |

#### S38-01: End-to-End Test Suite

**Description:** Comprehensive E2E coverage.

**Features:**
- Critical path tests (20+)
- Visual regression tests
- Accessibility tests (axe-core)
- Cross-browser tests

**Acceptance Criteria:**
- [ ] 90%+ critical paths covered
- [ ] All E2E pass on CI
- [ ] Visual tests baseline
- [ ] A11y tests pass

---

#### S38-02: Complete Documentation

**Description:** User and developer documentation.

**Features:**
- User guide (features, workflows)
- API documentation
- Developer setup guide
- Video tutorials (3+)
- FAQ

**Acceptance Criteria:**
- [ ] User guide complete
- [ ] API docs generated
- [ ] Setup guide works
- [ ] 3+ tutorial videos
- [ ] FAQ published

---

#### S38-03: Bug Bash & Polish

**Description:** Final bug fixes and UX polish.

**Features:**
- Bug triage from all sprints
- UX inconsistencies fixed
- Error messages improved
- Edge cases handled

**Acceptance Criteria:**
- [ ] Zero P0/P1 bugs
- [ ] < 10 P2 bugs
- [ ] Error messages user-friendly
- [ ] Edge cases documented

---

#### S38-04: Performance Benchmark

**Description:** Final performance validation.

**Features:**
- Bundle size analysis
- Load time benchmarks
- Memory profiling
- Lighthouse scores

**Acceptance Criteria:**
- [ ] Bundle < 200KB gzipped
- [ ] Load < 2s on 3G
- [ ] Memory < 100MB typical
- [ ] Lighthouse 90+ all categories

---

## Release Plan

| Version | Target Date | Features |
|---------|-------------|----------|
| v0.8.0 | 2026-04-10 | Markers, Asset Tracking |
| v0.8.5 | 2026-04-20 | Tooltips, Loading States |
| v0.9.0 | 2026-05-10 | Collaboration Foundation |
| v0.9.5 | 2026-06-01 | ComfyUI Workflows |
| v0.10.0 | 2026-06-20 | Advanced Export (AAF, XML) |
| v0.11.0 | 2026-07-10 | Performance at Scale |
| v0.12.0 | 2026-07-25 | Mobile & Responsive |
| **v1.0.0** | **2026-08-15** | **Production Ready** |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebSocket complexity | Medium | High | Start with simple broadcast, iterate |
| ComfyUI API changes | Low | Medium | Abstract API layer, version pinning |
| Performance regression | Medium | High | Benchmarks every sprint |
| Scope creep | High | Medium | Strict prioritization, defer to v1.1 |
| Testing debt | Medium | Medium | Test-first approach, CI gates |

---

## Success Metrics for v1.0

- ✅ 500+ unit tests passing
- ✅ 50+ E2E tests passing
- ✅ 90%+ code coverage
- ✅ Zero P0/P1 bugs
- ✅ Bundle < 200KB gzipped
- ✅ Load < 2s on 3G
- ✅ Lighthouse 90+ all categories
- ✅ Documentation complete
- ✅ 3+ tutorial videos
- ✅ Works offline (PWA)

---

## Post-v1.0 (v1.1+ Backlog)

- 🔮 AI-assisted timeline generation
- 🔮 Voice control integration
- 🔮 AR/VR timeline preview
- 🔮 Multi-language UI (beyond FR/EN)
- 🔮 Plugin system for extensions
- 🔮 Cloud sync (beyond localStorage)
- 🔮 Team workspaces
- 🔮 Version control integration (Git-like)

---

**Next Action:** Create Sprint 31 plan and stories

**Created:** 2026-04-02  
**Author:** BMAD Planning Agent
