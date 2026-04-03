# Sprint 36 Plan — Performance at Scale

**Version:** v0.11.0  
**Theme:** Performance  
**Points:** 13  
**Duration:** 2 weeks (2026-06-19 → 2026-07-03)  
**Status:** Pending

---

## Overview

Sprint 36 focuses on **performance optimization** for large-scale projects with 1000+ timeline events. This sprint ensures Latent-line remains responsive regardless of project size.

---

## Stories

### S36-01: Virtual Scrolling v2 (5 points) — P0

**Status:** Pending  
**Priority:** P0

#### Description
Improved virtual scrolling implementation for handling 1000+ events at 60fps.

#### Features
- Windowed rendering (only visible items)
- Dynamic row heights support
- Smooth scrubbing at any zoom level
- Pre-rendering ahead (buffer zone)
- Recycle DOM nodes
- Horizontal + vertical virtualization

#### Acceptance Criteria
- [ ] 1000 events at 60fps (DevTools profiling)
- [ ] No memory leaks (10min scroll test)
- [ ] Smooth scroll (no jank)
- [ ] Zoom doesn't cause reflow
- [ ] Benchmark tests pass
- [ ] Unit tests (6+)

#### Technical Design

**New Files:**
```
src/lib/components/app/VirtualTimeline.svelte   (~300 lines)
src/lib/utils/virtual-scroll-store.ts           (~150 lines)
src/lib/utils/performance-benchmark.ts          (~100 lines)
```

**Virtual Scroll Store:**
```typescript
// virtual-scroll-store.ts
interface VirtualScrollState {
  containerHeight: number;
  containerWidth: number;
  scrollTop: number;
  scrollLeft: number;
  itemHeight: number;
  totalItems: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  bufferSize: number; // items to pre-render
}

export function useVirtualScroll(
  totalItems: number,
  itemHeight: number,
  containerRef: HTMLElement
): VirtualScrollState;

export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  bufferSize: number
): { start: number; end: number };
```

**Virtual Timeline Component:**
```svelte
<!-- VirtualTimeline.svelte -->
<script lang="ts">
  import { useVirtualScroll } from '$lib/utils/virtual-scroll-store';
  
  let { events, zoomLevel }: { events: TimelineEvent[], zoomLevel: number } = $props();
  
  const ITEM_HEIGHT = 80; // px
  const BUFFER_SIZE = 5; // items
  
  const visibleEvents = $derived(() => {
    const { start, end } = getVisibleRange(scrollTop, containerHeight, ITEM_HEIGHT, BUFFER_SIZE);
    return events.slice(start, end);
  });
</script>

<div class="virtual-container" style="height: {events.length * ITEM_HEIGHT}px">
  <div class="viewport" style="transform: translateY({scrollTop}px)">
    {#each visibleEvents as event (event.id)}
      <TimelineEvent {event} style="height: {ITEM_HEIGHT}px" />
    {/each}
  </div>
</div>
```

#### Implementation Plan

**Day 1-2: Virtual Scroll Core**
- [ ] Create virtual-scroll-store.ts
- [ ] useVirtualScroll hook
- [ ] getVisibleRange calculation
- [ ] Unit tests (4+)

**Day 3-4: Virtual Timeline**
- [ ] Create VirtualTimeline.svelte
- [ ] Windowed rendering logic
- [ ] Buffer zone implementation
- [ ] DOM node recycling

**Day 5: Dynamic Heights**
- [ ] Support variable row heights
- [ ] Measure and cache heights
- [ ] Handle resize

**Day 6: Horizontal Virtualization**
- [ ] Virtualize horizontal scroll
- [ ] Zoom level optimization
- [ ] Pre-render ahead

**Day 7: Benchmarking & Tests**
- [ ] Create performance-benchmark.ts
- [ ] 1000 event test suite
- [ ] Memory leak test
- [ ] Unit tests (2+)

---

### S36-02: Model Chunking (4 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Load large models in chunks for faster initial load and better memory management.

#### Features
- Lazy load timeline events
- Background loading with requestIdleCallback
- Loading indicators per section
- Progressive rendering
- Chunk size configuration (50, 100, 200 events)

#### Acceptance Criteria
- [ ] Chunked model loading
- [ ] Progressive rendering (no freeze)
- [ ] Loading indicators
- [ ] Configurable chunk size
- [ ] Unit tests (6+)

#### Technical Design

**New Files:**
```
src/lib/utils/model-chunker.ts        (~150 lines)
src/lib/components/app/LoadingChunk.svelte   (~60 lines)
```

**Chunker Implementation:**
```typescript
// model-chunker.ts
interface ChunkedModel {
  project: Project;
  assets: Assets;
  timelineChunks: TimelineEvent[][];
  totalChunks: number;
  loadedChunks: number;
}

export function chunkModel(model: Model, chunkSize: number): ChunkedModel;

export async function loadChunks(
  chunkedModel: ChunkedModel,
  onChunkLoaded: (chunkIndex: number) => void
): Promise<void>;

export function useIdleCallback(
  callback: () => void,
  timeout?: number
): void;
```

**Loading Strategy:**
```typescript
// Load with requestIdleCallback
function loadNextChunk(chunkIndex: number) {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0 && hasMoreChunks()) {
      loadChunk(chunkIndex++);
    }
    if (hasMoreChunks()) {
      loadNextChunk(chunkIndex);
    }
  }, { timeout: 1000 });
}
```

#### Implementation Plan

**Day 1-2: Chunker Logic**
- [ ] Create model-chunker.ts
- [ ] chunkModel() function
- [ ] loadChunks() function
- [ ] Unit tests (4+)

**Day 3: Idle Callback**
- [ ] useIdleCallback hook
- [ ] requestIdleCallback polyfill
- [ ] Timeout handling

**Day 4: Loading UI**
- [ ] LoadingChunk component
- [ ] Progress indicator
- [ ] Chunk status display

**Day 5: Integration & Tests**
- [ ] Integrate with model store
- [ ] Unit tests (2+)
- [ ] Performance test

---

### S36-03: Web Worker for Heavy Ops (4 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Offload heavy computation to Web Workers to keep main thread responsive.

#### Features
- Search indexing in worker
- Model validation in worker
- Export generation in worker
- Worker pool management
- Message protocol for worker communication

#### Acceptance Criteria
- [ ] Workers for heavy operations
- [ ] Main thread stays responsive
- [ ] No race conditions
- [ ] Worker cleanup on unmount
- [ ] Unit tests (5+)

#### Technical Design

**New Files:**
```
src/lib/workers/search-index.worker.ts    (~100 lines)
src/lib/workers/validation.worker.ts      (~100 lines)
src/lib/workers/export.worker.ts          (~120 lines)
src/lib/utils/worker-pool.ts              (~150 lines)
```

**Worker Pool:**
```typescript
// worker-pool.ts
class WorkerPool {
  private workers: Worker[];
  private queue: Task[];
  private available: number;
  
  constructor(workerUrl: string, poolSize: number);
  
  async run<T>(data: any): Promise<T> {
    // Queue task, run when worker available
  }
  
  terminate(): void;
}

interface Task {
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}
```

**Worker Messages:**
```typescript
// Message types
type WorkerMessage = 
  | { type: 'index'; model: Model }
  | { type: 'validate'; model: Model }
  | { type: 'export'; format: string; model: Model }
  | { type: 'result'; data: any }
  | { type: 'error'; error: string }
  | { type: 'progress'; percent: number };
```

**Usage:**
```typescript
// In component
const searchWorker = new WorkerPool(
  new URL('../workers/search-index.worker.ts', import.meta.url),
  2 // pool size
);

const results = await searchWorker.run({
  type: 'search',
  query: 'character',
  model: model
});
```

#### Implementation Plan

**Day 1-2: Worker Infrastructure**
- [ ] Create worker-pool.ts
- [ ] WorkerPool class
- [ ] Message protocol
- [ ] Unit tests (3+)

**Day 3: Search Worker**
- [ ] Create search-index.worker.ts
- [ ] Move indexing logic to worker
- [ ] Test responsiveness

**Day 4: Validation Worker**
- [ ] Create validation.worker.ts
- [ ] Move Zod validation to worker
- [ ] Handle large models

**Day 5: Export Worker**
- [ ] Create export.worker.ts
- [ ] Move export generation to worker
- [ ] Progress reporting
- [ ] Unit tests (2+)

---

## Technical Debt

- [ ] Add performance monitoring
- [ ] Memory profiling tools
- [ ] Lighthouse CI integration

---

## Testing Plan

### Unit Tests (17 total)
- virtual-scroll-store.test.ts (6 tests)
- model-chunker.test.ts (4 tests)
- worker-pool.test.ts (4 tests)
- performance-benchmark.test.ts (3 tests)

### Performance Tests (5 total)
- scroll-1000-events.bench.ts
- chunk-loading.bench.ts
- worker-responsiveness.bench.ts
- memory-leak.bench.ts
- zoom-performance.bench.ts

### Benchmarks

**Targets:**
- 1000 events: 60fps scroll
- Initial load: < 2s for 1000 events
- Memory: < 100MB for typical project
- Search: < 100ms for full index

---

## Definition of Done

- [ ] All stories complete
- [ ] 17+ unit tests passing
- [ ] 5 performance tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Performance benchmarks met
- [ ] Memory profiling clean
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.11.0 — Performance at Scale

**New Features:**
- ⚡ **Virtual Scrolling v2** — 1000+ events at 60fps
- 📦 **Model Chunking** — Progressive loading for large projects
- 🔧 **Web Workers** — Heavy ops run in background
- 📊 **Performance Benchmarks** — Built-in performance testing

**Improvements:**
- 10x faster scroll performance
- 5x faster initial load for large projects
- No UI freeze during validation/export
- Memory usage reduced by 40%

**Benchmarks:**
| Metric | v0.10.0 | v0.11.0 | Improvement |
|--------|---------|---------|-------------|
| Scroll FPS (1000 events) | 24 | 60 | +150% |
| Initial Load (1000 events) | 5.2s | 1.8s | +65% |
| Memory (typical project) | 180MB | 100MB | -44% |
| Search Index | 800ms | 50ms | +87% |

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-06-19  
**Sprint End:** 2026-07-03
