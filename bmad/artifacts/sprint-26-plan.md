# Sprint 26 Planning

**Sprint Number:** 26
**Status:** Planning
**Target Points:** 9-14 pts
**Theme:** Production Completion — ComfyUI UI, Performance, Polish

---

## Sprint Goal

Complete S24-04 UI integration (9 pts) and add performance optimizations or features based on user feedback gathered from v0.3.0.

---

## Backlog & Story Selection

### Must-Have (9 pts)

#### S24-04-UI: ComfyUI Webhook UI (9 pts) — PRIORITY

**Description:** Complete the UI integration for the ComfyUI backend foundation built in S24-04.

**Features:**

- Settings panel for ComfyUI server configuration (host, port, API key)
- Generate buttons + progress indicators for per-event generation
- Image preview gallery for generated outputs
- Batch generation workflow
- IndexedDB storage for generated images

**Acceptance Criteria:**

- [x] Settings modal for server configuration
- [x] Generate button in PropertiesPanel when event selected
- [x] Progress bar showing generation % complete
- [x] Image preview (swipeable gallery)
- [x] Batch operation: "Generate all"
- [x] Store outputs in IndexedDB
- [x] Webhook endpoint validation
- [x] Error handling + retry logic
- [x] Tests cover main flows (5+ tests)
- [x] 100% unit test pass rate

**Acceptance Criteria Met Check:**
Will be verified during implementation.

---

### Should-Have (3-5 pts)

#### S26-01: Performance Optimization (3 pts) — OPTIONAL

**Focus Areas:**

1. Virtual scrolling for large timelines (>1000 events)
2. Debounce localStorage writes
3. Lazy load presentation mode route

**Why:** Users report slowdown with 500+ events.

---

#### S26-02: UI Polish (2 pts) — OPTIONAL

**Focus Areas:**

1. Animation transitions (fade, slide)
2. Empty states for all panels
3. Loading spinners for async operations

---

## Estimation

| Story           | Points | Effort | Risk   |
| --------------- | ------ | ------ | ------ |
| S24-04-UI       | 9      | High   | Medium |
| S26-01 (perf)   | 3      | Medium | Low    |
| S26-02 (polish) | 2      | Low    | Low    |
| **Total**       | **14** | —      | —      |

**Recommendation:** Commit to S24-04-UI (9 pts). Add S26-01 if time permits.

---

## Technical Approach

### S24-04-UI: ComfyUI Webhook Integration

**New Components:**

1. `ComfyUISettings.svelte` — Server configuration modal
2. `GenerationPanel.svelte` — Generate buttons + progress
3. `ImageGallery.svelte` — Preview carousel

**New Utilities:**

1. `comfyui-client.ts` — HTTP client for ComfyUI API
2. `generation-indexeddb.ts` — IndexedDB wrapper for images
3. `webhook-handler.ts` — Incoming webhook listener

**New Routes:**

1. `src/routes/webhook/comfyui/+server.ts` — POST endpoint for webhooks

**Modified Components:**

1. `PropertiesPanel.svelte` — Add Generate button
2. `SystemFooter.svelte` — Add Settings button

**Data Flow:**

```
User clicks "Generate"
  → Selection: event + model params
  → ComfyUI settings dialog (if unconfigured)
  → HTTP POST to ComfyUI API
  → Polling for job status OR webhook callback
  → Image received → store in IndexedDB
  → Display in gallery
```

**Webhook Flow:**

```
ComfyUI job completes
  → POST /webhook/comfyui with image data
  → Server-side handler: extract image
  → Send to client via WebSocket (future enhancement)
  → Update generation store
  → Show in gallery
```

---

## Risk & Mitigation

| Risk                  | Probability | Mitigation                                       |
| --------------------- | ----------- | ------------------------------------------------ |
| ComfyUI API changes   | Low         | Document API version, add version check          |
| Webhook timing issues | Medium      | Implement exponential backoff + polling fallback |
| Large image storage   | Medium      | Compress images before IndexedDB (80% reduction) |
| CORS issues           | Low         | Configure ComfyUI CORS headers in docs           |

---

## Test Strategy

### Unit Tests (90% coverage target)

- ComfyUI client HTTP methods
- Generation store state mutations
- IndexedDB image operations
- Webhook payload validation
- Error handling + retries

### Integration Tests (5-10 smoke tests)

- End-to-end generation flow (with mock ComfyUI)
- Settings persistence
- Webhook reception + image storage

### Manual QA

- Real ComfyUI instance (if available)
- Error scenarios (server down, API errors)
- Large batch generation (10+ concurrent)

---

## Implementation Phases

### Phase 1: Backend (2-3 days)

- [ ] Implement ComfyUI HTTP client
- [ ] Build generation store (Svelte 5 runes)
- [ ] Create webhook handler route
- [ ] Setup IndexedDB schema
- [ ] Unit tests (25+ tests)

### Phase 2: Frontend (2-3 days)

- [ ] ComfyUISettings modal component
- [ ] GenerationPanel with progress
- [ ] ImageGallery carousel
- [ ] Integration with PropertiesPanel
- [ ] Error states + loading states

### Phase 3: Polish (1 day)

- [ ] Component styling + animations
- [ ] Accessibility (keyboard nav, aria labels)
- [ ] Documentation
- [ ] Final testing + QA sign-off

### Phase 4: Release (1 day)

- [ ] Code audit
- [ ] Final tests (430+ passing)
- [ ] Create v0.4.0 release notes
- [ ] Tag and merge

---

## Files to Create/Modify

### New Files (8)

```
src/lib/services/comfyui-client.ts           (+180 lines)
src/lib/services/comfyui-client.test.ts      (+200 lines)
src/lib/stores/generation-indexeddb.svelte.ts (+150 lines)
src/lib/components/ComfyUISettings.svelte    (+150 lines)
src/lib/components/GenerationPanel.svelte    (+200 lines)
src/lib/components/ImageGallery.svelte       (+180 lines)
src/routes/webhook/comfyui/+server.ts        (+100 lines)
src/lib/utils/webhook-handler.ts             (+120 lines)
```

### Modified Files (3)

```
src/lib/components/workspace/properties/PropertiesPanel.svelte
src/lib/components/workspace/SystemFooter.svelte
src/lib/stores/generation.svelte.ts
```

---

## Success Criteria

| Criterion           | Metric             | Status |
| ------------------- | ------------------ | ------ |
| S24-04-UI complete  | 9 pts delivered    | ⏳     |
| All tests pass      | 430+ passing       | ⏳     |
| Code audit approved | No critical issues | ⏳     |
| Bundle size         | <50 kB gzipped     | ⏳     |
| E2E smoke tests     | 3+ passing         | ⏳     |
| Documentation       | Complete           | ⏳     |

---

## Timeline Estimate

| Phase              | Estimate     | Actual |
| ------------------ | ------------ | ------ |
| Phase 1 (Backend)  | 2-3 days     | ⏳     |
| Phase 2 (Frontend) | 2-3 days     | ⏳     |
| Phase 3 (Polish)   | 1 day        | ⏳     |
| Phase 4 (Release)  | 1 day        | ⏳     |
| **Total**          | **6-8 days** | **⏳** |

**Recommended:** 1 week (5 working days)

---

## Decision Points

1. **Should we support A1111 (Automatic1111) in addition to ComfyUI?**
   - Recommended: Yes, but phase 2 (v0.5.0)
   - Reason: Unified client abstraction already designed

2. **Should webhook or polling be the primary method?**
   - Recommended: Polling + webhook optional
   - Reason: More reliable, works without server config

3. **Should we compress images before IndexedDB?**
   - Recommended: Yes (WebP 80% quality)
   - Reason: Reduces storage, faster display

---

## Sprint Kickoff

**Start:** After v0.3.0 release
**Duration:** 1 week
**Team:** Developer (async implementation)
**Next Review:** After Phase 2 (Frontend complete)

---

**Prepared by:** BMAD Planning
**Date:** 2026-03-25
**Status:** READY FOR KICKOFF
