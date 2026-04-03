# Sprint 34 Plan — ComfyUI Workflow Integration

**Version:** v0.9.5  
**Theme:** AI Production  
**Points:** 16  
**Duration:** 3 weeks (2026-05-15 → 2026-06-05)  
**Status:** Pending

---

## Overview

Sprint 34 builds a **visual workflow builder** for ComfyUI pipelines, enabling users to create, customize, and execute AI rendering workflows directly from the timeline.

---

## Stories

### S34-01: ComfyUI Workflow Builder (6 points) — P0

**Status:** Pending  
**Priority:** P0

#### Description
Visual workflow builder for creating and editing ComfyUI pipelines.

#### Features
- Node-based workflow editor (drag & drop)
- Pre-built templates:
  - Deforum (zoom/pan animations)
  - FramePack (frame interpolation)
  - AnimateDiff (text-to-video)
  - CogVideoX (advanced generation)
- Parameter mapping from timeline events
- Save/load workflow JSON
- Test run single event
- Node library sidebar

#### Acceptance Criteria
- [ ] Workflow editor UI (canvas + nodes)
- [ ] 4+ templates included
- [ ] Map timeline params to workflow inputs
- [ ] Save/load workflows to JSON
- [ ] Test run single event
- [ ] Node library with search
- [ ] Unit tests (8+)
- [ ] E2E test (create workflow → test)

#### Technical Design

**New Files:**
```
src/lib/components/app/WorkflowEditor.svelte    (~400 lines)
src/lib/components/app/WorkflowNode.svelte      (~150 lines)
src/lib/components/app/NodeLibrary.svelte       (~120 lines)
src/lib/components/app/WorkflowTemplates.svelte (~100 lines)
src/lib/utils/workflow-builder.ts               (~200 lines)
src/lib/utils/workflow-templates.ts             (~150 lines)
```

**Workflow Structure:**
```typescript
interface ComfyWorkflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  links: WorkflowLink[];
  parameters: ParameterMapping[];
}

interface WorkflowNode {
  id: string;
  type: string; // CheckpointLoader, CLIPTextEncode, etc.
  position: [number, number];
  inputs: Record<string, any>;
  outputs: string[];
}

interface WorkflowLink {
  id: string;
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

interface ParameterMapping {
  workflowParam: string; // e.g., "positive_prompt"
  timelineField: string; // e.g., "frame.actors[0].prompt"
  transform?: (value: any) => any;
}
```

**Templates:**
```typescript
// workflow-templates.ts
export const DEFORUM_TEMPLATE: ComfyWorkflow = {
  name: 'Deforum Zoom/Pan',
  nodes: [
    { type: 'CheckpointLoader', ... },
    { type: 'CLIPTextEncode', ... },
    { type: 'DeforumAnimation', ... },
    { type: 'SaveImage', ... },
  ],
  links: [...],
};

export const FRAMEPACK_TEMPLATE: ComfyWorkflow = { ... };
export const ANIMATEDIFF_TEMPLATE: ComfyWorkflow = { ... };
export const COGVIDEOX_TEMPLATE: ComfyWorkflow = { ... };
```

#### Implementation Plan

**Week 1: Core Editor**

**Day 1-2: Canvas & Nodes**
- [ ] WorkflowEditor canvas setup
- [ ] WorkflowNode component
- [ ] Drag & drop positioning
- [ ] Connection lines (SVG)

**Day 3-4: Node Library**
- [ ] NodeLibrary sidebar
- [ ] Node categories
- [ ] Search functionality
- [ ] Drag to add nodes

**Day 5: Links**
- [ ] Create links between nodes
- [ ] Delete links
- [ ] Validate connections

**Week 2: Templates & Mapping**

**Day 6-7: Templates**
- [ ] Create Deforum template
- [ ] Create FramePack template
- [ ] Create AnimateDiff template
- [ ] Create CogVideoX template
- [ ] WorkflowTemplates component

**Day 8-9: Parameter Mapping**
- [ ] ParameterMapping UI
- [ ] Map timeline fields to workflow
- [ ] Transform functions
- [ ] Test mapping

**Day 10: Save/Load & Tests**
- [ ] Save workflow JSON
- [ ] Load workflow JSON
- [ ] Unit tests (8+)
- [ ] E2E test

---

### S34-02: Batch Render Queue (5 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Queue multiple timeline events for batch rendering via ComfyUI.

#### Features
- Select events → "Render batch"
- Queue management UI (pause, resume, cancel)
- Priority ordering (drag to reorder)
- Estimated time calculation per event
- Output folder selection
- Render settings (resolution, format)

#### Acceptance Criteria
- [ ] Batch queue UI component
- [ ] Send batch to ComfyUI API
- [ ] Track queue status per event
- [ ] Cancel/pause/resume queue
- [ ] ETA calculation
- [ ] Output folder picker
- [ ] Unit tests (10+)

#### Technical Design

**New Files:**
```
src/lib/components/app/BatchQueue.svelte       (~200 lines)
src/lib/components/app/QueueItem.svelte        (~100 lines)
src/lib/utils/render-queue.ts                  (~180 lines)
```

**Queue Structure:**
```typescript
interface RenderQueue {
  items: RenderItem[];
  status: 'idle' | 'rendering' | 'paused' | 'completed';
  currentItemId?: string;
  outputFolder: string;
}

interface RenderItem {
  id: string;
  eventId: string;
  status: 'pending' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  eta?: number; // seconds
  outputPath?: string;
  error?: string;
  workflowId: string;
}
```

**Queue Manager:**
```typescript
// render-queue.ts
class RenderQueueManager {
  private queue: RenderQueue;
  private comfyClient: ComfyApiClient;
  
  async addItem(item: RenderItem): Promise<void>;
  async startRendering(): Promise<void>;
  async pause(): Promise<void>;
  async cancel(itemId: string): Promise<void>;
  async removeItem(itemId: string): Promise<void>;
  
  private async renderNext(): Promise<void>;
  private updateProgress(itemId: string, progress: number): void;
}
```

#### Implementation Plan

**Day 1-2: Queue Manager**
- [ ] Create render-queue.ts
- [ ] add/remove items
- [ ] Start/pause/cancel logic
- [ ] Unit tests (6+)

**Day 3-4: Queue UI**
- [ ] BatchQueue component
- [ ] QueueItem component
- [ ] Status indicators
- [ ] Progress bars

**Day 5: ComfyUI Integration**
- [ ] Send to ComfyUI API
- [ ] Poll for progress
- [ ] Handle completion
- [ ] Unit tests (4+)

---

### S34-03: Render Progress Tracking (5 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Real-time render progress with live previews and notifications.

#### Features
- Progress bar per event (0-100%)
- Current frame preview (thumbnail)
- ETA calculation based on progress rate
- Render log viewer (scrolling)
- Toast notification on complete
- Render history (last 20 renders)
- Open output folder on complete

#### Acceptance Criteria
- [ ] Progress panel component
- [ ] WebSocket updates from ComfyUI
- [ ] Preview thumbnails
- [ ] Log viewer with auto-scroll
- [ ] Toast on complete/error
- [ ] Render history
- [ ] Unit tests (8+)

#### Technical Design

**New Files:**
```
src/lib/components/app/RenderProgress.svelte   (~180 lines)
src/lib/components/app/RenderLog.svelte        (~100 lines)
src/lib/components/app/RenderHistory.svelte    (~120 lines)
src/lib/utils/comfy-api-client.ts              (~150 lines)
```

**ComfyUI API Client:**
```typescript
// comfy-api-client.ts
class ComfyApiClient {
  private ws: WebSocket;
  private baseUrl: string;
  
  async connect(): Promise<void>;
  async submitPrompt(prompt: ComfyPrompt): Promise<string>; // returns sessionId
  async getProgress(sessionId: string): Promise<Progress>;
  async getPreview(sessionId: string): Promise<Blob>;
  async cancel(sessionId: string): Promise<void>;
  
  onProgress(callback: (sessionId: string, progress: number) => void): void;
  onComplete(callback: (sessionId: string, output: Output) => void): void;
}
```

**Progress State:**
```typescript
interface RenderProgress {
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  currentFrame?: number;
  totalFrames?: number;
  eta?: number; // seconds
  previewUrl?: string;
  logs: string[];
}
```

#### Implementation Plan

**Day 1-2: API Client**
- [ ] Create comfy-api-client.ts
- [ ] WebSocket connection
- [ ] Submit prompt API
- [ ] Progress polling
- [ ] Unit tests (5+)

**Day 3-4: Progress UI**
- [ ] RenderProgress component
- [ ] Progress bar with percentage
- [ ] ETA display
- [ ] Preview thumbnail

**Day 5: Logs & History**
- [ ] RenderLog component
- [ ] Auto-scrolling logs
- [ ] RenderHistory component
- [ ] Toast notifications
- [ ] Unit tests (3+)

---

## Technical Debt

- [ ] Handle ComfyUI server disconnect
- [ ] Retry failed renders
- [ ] Cache workflow outputs

---

## Testing Plan

### Unit Tests (26 total)
- workflow-builder.test.ts (8 tests)
- workflow-templates.test.ts (4 tests)
- render-queue.test.ts (6 tests)
- comfy-api-client.test.ts (8 tests)

### Integration Tests (4 total)
- workflow-to-comfy.spec.ts
- batch-render-queue.spec.ts
- progress-websocket.spec.ts
- render-history.spec.ts

### E2E Tests (2 total)
- workflow-create-test-run.spec.ts
- batch-render-complete.spec.ts

---

## Infrastructure

### ComfyUI Setup

**Requirements:**
- ComfyUI running on port 8188
- Custom nodes installed:
  - Deforum
  - FramePack
  - AnimateDiff
  - CogVideoX

**Configuration:**
```
Settings → Production → ComfyUI
- URL: http://localhost:8188
- Auto-connect: Yes
- Default workflow: Deforum
```

---

## Definition of Done

- [ ] All stories complete
- [ ] 26+ unit tests passing
- [ ] 6 integration/E2E tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Manual QA pass (render test)
- [ ] ComfyUI integration tested
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.9.5 — ComfyUI Workflow Integration

**New Features:**
- 🎨 **Workflow Builder** — Visual node-based editor for ComfyUI pipelines
- 📦 **4 Templates** — Deforum, FramePack, AnimateDiff, CogVideoX ready to use
- 🔄 **Batch Rendering** — Queue multiple events for sequential rendering
- 📊 **Progress Tracking** — Real-time progress with live previews
- 📜 **Render Logs** — View detailed logs during rendering
- 🏆 **Render History** — Track last 20 renders with outputs

**Improvements:**
- Direct ComfyUI API integration
- Parameter mapping from timeline to workflow
- ETA calculation for renders

**Technical:**
- Workflow JSON format compatible with ComfyUI
- WebSocket for real-time progress
- Queue management with pause/resume

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-05-15  
**Sprint End:** 2026-06-05
