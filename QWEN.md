# Latent-line — Project Context Guide

## Project Overview

**Latent-line** is a SvelteKit 5 + Vite single-page application for orchestrating **AI-driven story and scene production**. It provides an interactive timeline editor for building complex animated narratives with precise control over characters, camera movements, lighting, effects, and audio tracks.

### Core Purpose

- Define character assets with prompts, references, and outfit variations
- Build timeline events with precise timing, camera movements, lighting, and effects
- Configure checkpoint models, samplers, seeds, and TTS engines
- Export narratives for downstream video/animation generation

### Tech Stack

| Category        | Technology                       |
| --------------- | -------------------------------- |
| **Framework**   | SvelteKit 2.55 + Svelte 5.55     |
| **Build**       | Vite 8                           |
| **Language**    | TypeScript 6 (strict mode)       |
| **Validation**  | Zod 4                            |
| **Testing**     | Vitest 4 (unit), Playwright 1.58 |
| **Styling**     | Custom CSS stack (no Tailwind)   |
| **Icons**       | @lucide/svelte                   |
| **Package Mgr** | pnpm                             |

---

## Project Structure

```
latent-line/
├── src/
│   ├── lib/
│   │   ├── model/              # Data layer (types, schemas, builders)
│   │   │   ├── model-types.ts      # TypeScript interfaces
│   │   │   ├── model-template.ts   # Zod schemas + default builders
│   │   │   ├── model-example.ts    # Example story data
│   │   │   ├── model-store.svelte.ts # Reactive store
│   │   │   └── *.test.ts           # Unit tests
│   │   │
│   │   ├── components/
│   │   │   ├── app/            # Application components
│   │   │   │   ├── AssetManager.svelte
│   │   │   │   ├── Timeline.svelte
│   │   │   │   ├── PropertiesPanel.svelte
│   │   │   │   ├── SequenceOrchestrator.svelte
│   │   │   │   ├── ModelInspector.svelte
│   │   │   │   └── SystemFooter.svelte
│   │   │   ├── ui/             # shadcn-svelte primitives (read-only)
│   │   │   └── workspace/      # Layout primitives
│   │   │
│   │   ├── stores/             # Svelte stores
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helper functions
│   │   ├── actions/            # Svelte actions
│   │   ├── hooks/              # Svelte hooks
│   │   └── i18n/               # Internationalization
│   │
│   ├── routes/
│   │   ├── +layout.svelte      # Root layout
│   │   ├── +page.svelte        # Home page
│   │   ├── /present/           # Presentation view
│   │   └── /api/               # API endpoints
│   │
│   └── styles/                 # Global CSS
│       ├── theme.css           # CSS custom properties
│       ├── base.css            # Resets, root font-size
│       ├── workspace.css       # Layout primitives
│       └── utilities.css       # ~200 utility classes
│
├── e2e/                        # Playwright E2E tests
├── bmad/                       # Project metadata (BMAD method)
├── scripts/                    # Build/utility scripts
└── static/                     # Static assets
```

---

## Data Model

### Root Structure

```typescript
interface Model {
	project: Project; // Resolution, FPS, name
	assets: Assets; // Characters, environments, audio
	timeline: TimelineEvent[]; // Scene events (sorted by time)
	config: Config; // Checkpoint, sampler, seed, TTS
}
```

### Timeline Event

```typescript
interface TimelineEvent {
	time: number; // Millisecond offset
	frame: TimelineFrame;
}

interface TimelineFrame {
	actors?: Actor[]; // Positions, speech, actions
	camera?: Camera; // Zoom, pan, tilt
	lighting?: Lighting; // Type, intensity
	fx?: FX; // Bloom, blur
	controlnet?: ControlNet; // AI generation params
	audio_tracks?: AudioTrack[]; // Music, SFX
	audio_reactive?: AudioReactive;
}
```

### Key Enums

- **Mood**: `joyful | melancholic | anxious | serene | curious`
- **LightingType**: `dusk | daylight | studio | tungsten | ambient`

### Validation

All models validated via `modelSchema.safeParse()` (Zod). Use `createModelTemplate()` for safe mutations.

---

## Building and Running

### Setup

```bash
pnpm install
```

### Development

```bash
pnpm run dev          # Start Vite dev server (port 5167)
```

### Type Checking

```bash
pnpm exec tsc --noEmit    # TypeScript check
pnpm run check            # SvelteKit sync + type check
pnpm run check:watch      # Watch mode
```

### Testing

```bash
pnpm run test:unit              # Vitest unit tests (292 tests)
pnpm run test:unit -- --watch   # Watch mode
pnpm run test:e2e               # Playwright E2E tests
pnpm test                       # All tests
```

### Build & Preview

```bash
pnpm run build      # Production build
pnpm run preview    # Preview production build
```

### Code Quality

```bash
pnpm run lint       # ESLint + Prettier check
pnpm run format     # Auto-format with Prettier
pnpm run lint:fix   # Auto-fix issues
```

---

## Development Conventions

### Svelte 5 Patterns

- **Runes**: Use `$state()`, `$derived()`, `$props()`, `$bindable()`
- **Snippets**: Use `{#snippet name()}` instead of slots
- **Children**: Use `{@render children()}` in layout components
- **Script**: Always `<script lang="ts">`

### Import Organization

```typescript
// 1. External libraries
import { z } from 'zod';

// 2. Internal modules
import type { Model } from './model-types';

// 3. Svelte-specific
import { createRawSnippet } from 'svelte';
```

### Naming Conventions

| Type       | Style        | Examples                              |
| ---------- | ------------ | ------------------------------------- |
| Components | PascalCase   | `TimelineEvent`, `AssetManager`       |
| Functions  | camelCase    | `buildDefaultModel`, `timelineEvents` |
| Constants  | UPPER_SNAKE  | `MOOD_ENUM`, `RESOLUTION_PRESETS`     |
| Files      | kebab-case   | `timeline-event.svelte`               |
| IDs        | Short stable | `char_01`, `bgm_01`, `env_01`         |

### File Organization

- Tests alongside source: `component.svelte` → `component.test.ts`
- Barrel exports in `index.ts` files
- No `any` types — use strict TypeScript

### Error Handling

- Use Zod for runtime validation
- Clear error messages in validation failures
- Graceful degradation with default values

---

## Key Components

| Component                       | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| **AssetManager.svelte**         | CRUD for characters, environments, audio |
| **Timeline.svelte**             | Horizontal timeline with zoom/scrub      |
| **PropertiesPanel.svelte**      | Contextual property editor               |
| **SequenceOrchestrator.svelte** | Timeline + playhead orchestration        |
| **ModelInspector.svelte**       | Live validation overlay                  |
| **SystemFooter.svelte**         | Config, export/import JSON               |

---

## Security Notes

1. **Path Traversal**: `isUrlOrFile()` rejects `..` in asset paths
2. **XSS Prevention**: Escape user text (prompts, speech) when rendered
3. **Environment Variables**: Use `.env.local` (see `.env.example`)
4. **No Hardcoded Secrets**: Config loaded from environment or `config` object

---

## Related Documentation

| File                 | Content                               |
| -------------------- | ------------------------------------- |
| **README.md**        | Full project overview + diagrams      |
| **GUIDELINES.md**    | Model structure, enums, validation    |
| **SVELTE.md**        | Svelte 5 conventions, runes, snippets |
| **AGENTS.md**        | MCP tool usage, commands              |
| **CHANGELOG.md**     | Version history, sprint progress      |
| **bmad/status.yaml** | Project status tracking               |

---

## Quick Reference

### Common Commands

```bash
# Daily development
pnpm run dev
pnpm run check
pnpm run lint

# Before commit
pnpm run format && pnpm run lint && pnpm run test:unit -- --run

# Debug a specific test
pnpm run test:unit -- path/to/test.test.ts
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
VITE_API_URL=https://api.example.com
VITE_MODEL_CHECKPOINT=flux_dev.safetensors
VITE_DEFAULT_SEED=42
VITE_TTS_ENGINE=elevenlabs_v2
```

---

**Version**: 0.4.0  
**Last Updated**: 2026-03-27  
**Status**: Active Development (Sprint 28 in progress)

---

## Project Management (BMAD Method)

This project uses the **BMAD method** for agile development with sprint-based delivery.

### Current Status (Sprint 28)

- **Theme**: Export Ecosystem — REST API Server & UI Integration
- **Progress**: 5.5 / 12 points delivered
- **Active Stories**: S28-01 (API foundation), S28-02 (ExportModal UI)
- **Tests**: 450+ passing

### Sprint History (Recent)

| Sprint | Theme                                         | Points | Status                     |
| ------ | --------------------------------------------- | ------ | -------------------------- |
| S27    | Post-Release Hardening + Export Ecosystem     | 9      | ✅ Complete                |
| S26    | Production Completion — ComfyUI UI            | 12     | ✅ Complete (9 delivered)  |
| S25    | Production — EDL Export, Search, Presentation | 16     | ✅ Complete                |
| S24    | AI Rendering — ComfyUI, Deforum, FramePack    | 31     | ✅ Complete (22 delivered) |
| S23    | Collaboration — Sharing, Comments, Versioning | 18     | ✅ Complete                |

### BMAD Artifacts

Located in `bmad/` directory:

```
bmad/
├── status.yaml              # Current sprint status, phase, next action
├── artifacts/
│   ├── dashboard.md         # Sprint dashboard
│   ├── product-brief.md     # One-line product summary
│   ├── prd.md               # Product requirements document
│   ├── audit-*.md           # Code audit reports
│   ├── release-*.md         # Release notes
│   ├── sprint-*.md          # Sprint plans & summaries
│   └── stories/             # Individual story specifications
└── docs/                    # Additional documentation
```

### BMAD Commands

```bash
bmad next              # Get next recommended action
bmad sprint            # Create new sprint
bmad dev story <ID>    # Start working on a story
bmad continue          # Continue current workflow
```

---

## Feature Roadmap

### Completed Features (v0.1.0 → v0.4.0)

- ✅ Timeline editor with drag & drop
- ✅ Asset management (characters, environments, audio)
- ✅ Properties panel (camera, lighting, FX, ControlNet)
- ✅ Playback engine with playhead synchronization
- ✅ Undo/Redo (Ctrl+Z / Ctrl+Y)
- ✅ localStorage persistence
- ✅ Export/Import JSON with Zod validation
- ✅ ComfyUI/A1111 integration (batch generation)
- ✅ EDL export, global search, presentation mode
- ✅ YAML, JSON-LD, RDF N-Triples export formats
- ✅ Accessibility (WCAG 2.1 AA compliant)
- ✅ Internationalization (FR/EN)

### Planned Features

- 🔄 REST API server for export/import endpoints
- ⏳ ImportModal UI integration
- ⏳ API documentation
- 🔮 Performance optimizations (virtual scrolling)
- 🔮 Real-time collaboration (WebSocket)
- 🔮 ComfyUI workflow integration
