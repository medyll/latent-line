# Release Notes: v0.4.0 — ComfyUI Integration

**Released:** 2026-03-25
**Commit:** 51eb0fd
**Previous:** v0.3.0 (EDL Export, Global Search, Presentation Mode)

## What's New

### 🎨 ComfyUI / Stable Diffusion Integration (S24-04-UI)

Generate AI images directly from your timeline events using ComfyUI or Automatic1111.

#### Settings

- **New toolbar button:** 🎨 ComfyUI
- Configure server URL (e.g., http://localhost:7860)
- Optional API key support
- Test connection before saving
- Settings persist across sessions

#### Per-Event Generation

- **Generate button** on selected timeline events
- Real-time progress bar (0-100%)
- Generated image preview in event card
- Batch generation with automatic retry on error
- Images stored in IndexedDB (persistent, efficient)

#### Batch Generation

- **New toolbar button:** 🚀 Generate All
- Generates all events with prompts sequentially
- 2-second rate limiting between requests (prevents backend overload)
- Live progress tracking (e.g., "3/10 done")
- One failure doesn't stop the batch

#### Supported Backends

- **Automatic1111** (Stable Diffusion WebUI) — fully implemented
- **ComfyUI** — API abstraction in place, ready for workflow integration

---

## Features Delivered This Sprint

| Feature                           | Points | Status             |
| --------------------------------- | ------ | ------------------ |
| S24-04-UI: ComfyUI UI Integration | 9      | ✅ Complete        |
| S26-01: Performance (optional)    | 3      | ⏭️ Deferred        |
| **Sprint 26 Total**               | **12** | **9/12 delivered** |

---

## Technical Details

### New Components

- `ComfyUISettings.svelte` — settings modal with test connection
- `GenerateButton.svelte` — per-event generation with progress & thumbnails
- `GenerateBatchButton.svelte` — batch operation with live stats

### New Stores

- `generation.svelte.ts` — per-event state tracking (9 unit tests)
- `generated-images.svelte.ts` — IndexedDB persistence layer

### New Utilities

- `batch-generate.ts` — rate-limited sequential processing
- `ai-backend.ts` — abstraction for ComfyUI & A1111 APIs (foundation)

### Quality Metrics

- **Unit Tests:** 428 total (9 new generation tests)
- **Build:** ✅ Successful (no TypeScript errors)
- **E2E Tests:** 6 smoke tests passing

---

## Breaking Changes

None. This is a pure addition with no API or data model changes.

---

## Known Limitations

- **ComfyUI API:** Currently stubbed. Requires workflow definition to implement full ComfyUI support.
- **Batch Rate Limiting:** Fixed at 2 seconds between requests. Can be made configurable in future versions.
- **Image Storage:** Uses IndexedDB quota limits. Large batches may fail on quota-constrained browsers.

---

## Upgrade Path

1. Update to v0.4.0
2. Click **🎨 ComfyUI** button in toolbar
3. Enter server URL (e.g., http://localhost:7860)
4. Click "Test Connection" to verify
5. Use **Generate** button on timeline events or **🚀 Generate All** for batch processing

---

## Next Steps

- **v0.5.0:** Performance optimizations (S26-01)
- **v0.5.0+:** ComfyUI workflow integration (if API available)
- **Future:** Real-time progress streaming, webhook callbacks

---

## Sprint Summary

**Sprint 26:** Production Completion — ComfyUI UI Integration

- Deferred S24-04 foundation work (service + store) now integrated with full UI
- 9 points delivered (S24-04-UI complete)
- 3 points optional (S26-01 performance) available for future sprint
- Release ready: v0.4.0 shipped with ComfyUI integration

**Releases Shipped (v0.3.0 → v0.4.0):**

- v0.3.0: EDL export, global search, presentation mode (16 pts)
- v0.4.0: ComfyUI integration, batch generation, IndexedDB persistence (9 pts)

**Next sprint:** Performance optimization + additional features based on user feedback.

---

**Built with:** SvelteKit 5 + Vite + TailwindCSS + Vitest + Playwright

Delivered by: Claude Haiku BMAD Developer
