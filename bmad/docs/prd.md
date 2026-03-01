# Product Requirements Document — LatentLine

## 1. Problem Statement

AI-generated video/scene production (Stable Diffusion, ControlNet, TTS) requires orchestrating dozens of interdependent parameters across characters, environments, camera, lighting, FX, and audio. Today, producers manage this via raw JSON files or disconnected scripts — a workflow that is error-prone, opaque, and not suited for narrative-level thinking.

**LatentLine** is a deterministic, modular scene orchestrator: a visual interface for assembling, editing, and exporting structured production models that drive AI rendering pipelines.

---

## 2. Product Vision

> "A professional orchestration workstation for AI-generated story sequences — where the unit of work is a *scene*, not a prompt."

LatentLine bridges narrative intent and technical execution. The user thinks in characters, actions, and timings. The system outputs a validated JSON model consumed by rendering pipelines.

---

## 3. Target Users

| Persona | Description |
|---|---|
| **AI Director** | Creates short films / animated sequences using Stable Diffusion + TTS. Needs a visual timeline, not raw JSON. |
| **Technical Producer** | Manages rendering config (checkpoints, samplers, seeds). Needs export precision and Zod-validated output. |
| **Story Prototyper** | Explores narrative structure quickly. Needs fast asset setup and synoptic visualization. |

---

## 4. Core Concepts

| Concept | Definition |
|---|---|
| **Model** | The canonical top-level object: `{ project, assets, timeline, config }`. The source of truth. |
| **Asset** | A reusable entity: `Character`, `EnvironmentAsset`, or `AudioAsset`. Referenced by ID in the timeline. |
| **TimelineEvent** | A keyed entry `Record<string, TimelineEvent>` with a `time` (frame) and a `TimelineFrame` payload. |
| **TimelineFrame** | The delta state at a given time: actors, camera, lighting, FX, ControlNet, audio tracks, audio-reactive. |
| **Config** | Rendering metadata: checkpoint, sampler, seed, TTS engine. |

---

## 5. Functional Requirements

### 5.1 Global Asset Manager (Left Panel)

| ID | Requirement |
|---|---|
| AM-01 | List all characters with ID, name, voice_id, reference count |
| AM-02 | Add / edit / delete characters with inline form validation (Zod) |
| AM-03 | Manage character outfits (prompt + optional LoRA file) per character |
| AM-04 | List environment assets with prompt and optional reference image |
| AM-05 | Add / edit / delete environment assets |
| AM-06 | List audio assets with ID, URL, label |
| AM-07 | Add / edit / delete audio assets |
| AM-08 | Validate all asset IDs are unique and referenced correctly in the timeline |
| AM-09 | Highlight orphaned assets (defined but never used in timeline) |

### 5.2 Sequence Orchestrator — Synoptic View (Central Top)

| ID | Requirement |
|---|---|
| SO-01 | Display timeline events as a 5-per-row thumbnail grid ordered by `time` |
| SO-02 | Each thumbnail shows: time code, actor IDs, mood indicator if speech present |
| SO-03 | Clicking a thumbnail selects it and opens it in the Properties Panel |
| SO-04 | Add new event at any position (inserts with correct `time` value) |
| SO-05 | Delete event with confirmation |
| SO-06 | Duplicate event (clones frame, assigns new key and time) |
| SO-07 | Vertical scroll; synchronized scroll position with Temporal Sequencer |

### 5.3 Temporal Sequencer (Central Bottom)

| ID | Requirement |
|---|---|
| TS-01 | Horizontal timeline showing all events as blocks at their `time` position |
| TS-02 | Audio tracks rendered as colored lanes below the event blocks |
| TS-03 | Drag events horizontally to change their `time` value |
| TS-04 | Zoom in/out on the timeline (frame-level to scene-level) |
| TS-05 | Playhead indicator (scrubable) |
| TS-06 | Scroll synchronized with Synoptic View |

### 5.4 Properties Panel (Right Panel)

| ID | Requirement |
|---|---|
| PP-01 | Contextual display: changes based on selected element type (event, asset, config) |
| PP-02 | **Event selected**: edit actors (id, outfit, action, position, speech), camera, lighting, FX, ControlNet, audio tracks, audio-reactive |
| PP-03 | **Character selected**: edit all character fields inline |
| PP-04 | **Audio asset selected**: preview audio, edit volume/loop/fade_in |
| PP-05 | All edits update the model reactively and persist in-session |
| PP-06 | Speech editor: text, mood (enum select), style, lip_sync toggle, volume/pitch |
| PP-07 | Camera editor: zoom, pan [x,y], tilt |
| PP-08 | Lighting editor: type (enum select), intensity slider |
| PP-09 | FX editor: bloom slider, motion_blur slider |
| PP-10 | ControlNet editor: type input, strength slider |

### 5.5 System Footer

| ID | Requirement |
|---|---|
| SF-01 | Select AI checkpoint (text input or dropdown from config) |
| SF-02 | Select sampler (dropdown: Euler, DPM++, etc.) |
| SF-03 | Set seed (numeric input with random button) |
| SF-04 | Select TTS engine (dropdown or text) |
| SF-05 | Export button: validates model via `modelSchema.safeParse()`, shows errors or downloads `model.json` |
| SF-06 | Import button: loads a `model.json` file, validates, and replaces current model |

### 5.6 Model Inspector (Dev/Debug)

| ID | Requirement |
|---|---|
| MI-01 | Read-only JSON view of the current model state |
| MI-02 | Collapsible, accessible via keyboard shortcut |
| MI-03 | Shows Zod validation errors inline if model is invalid |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Target screen** | Optimized for 4K (3840×2160). Functional at 1920×1080. |
| **Design language** | Flat white, sharp lines, no shadows/gradients, no emojis, no centered layouts |
| **Performance** | Timeline with 100+ events must render without jank. Use virtual scrolling if needed. |
| **Type safety** | All model mutations go through typed interfaces. No `any`. |
| **Validation** | All user input validated via Zod before mutation. Errors shown inline. |
| **Accessibility** | Keyboard navigation for all interactive elements. Explicit labels on all inputs. |
| **State persistence** | In-session state only (no backend). Model serialized to `localStorage` as draft. |
| **Export fidelity** | Exported JSON must pass `modelSchema.safeParse()` with zero errors. |

---

## 7. Data Model Summary

```
Model
├── project: { name, fps, resolution: { w, h } }
├── assets
│   ├── characters: Character[]
│   │   └── { id, name, voice_id?, references[], outfits?: Record<string, Outfit> }
│   ├── environments: Record<string, EnvironmentAsset>
│   └── audio: AudioAsset[]
├── timeline: Record<string, TimelineEvent>
│   └── TimelineEvent: { time: number, frame: TimelineFrame }
│       └── TimelineFrame: { actors?, camera?, lighting?, fx?, controlnet?, audio_tracks?, audio_reactive? }
└── config: { checkpoint?, sampler?, seed?, tts_engine? }
```

Enums:
- `Mood`: `joyful | melancholic | anxious | serene | curious`
- `LightingType`: `dusk | daylight | studio | tungsten | ambient`

---

## 8. Out of Scope (v1)

- Real-time AI rendering / preview
- Multi-user collaboration
- Backend persistence / cloud sync
- Video playback / frame preview
- LoRA training UI
- Animation curves / easing editor

---

## 9. Success Criteria

| Criterion | Measure |
|---|---|
| A user can build a 6-event story from scratch without touching JSON | Manual test with `model-story-example.ts` as reference |
| Exported JSON passes `modelSchema.safeParse()` with 0 errors | Automated test |
| All asset IDs used in timeline resolve to defined assets | Automated test |
| Timeline renders 50+ events without visible lag | Manual performance test |
| Properties Panel updates model reactively on every input change | Manual test |

---

## 10. Reference

- Model types: `src/lib/model/model-types.ts`
- Zod schema: `src/lib/model/model-template.ts`
- Story example: `src/lib/model/model-story-example.ts`
- UI guidelines: `GUIDELINES.md`
- Svelte conventions: `SVELTE.md`
