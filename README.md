# Latent-line Project Overview

**Latent-line** is a SvelteKit 5 + Vite SPA for orchestrating **AI-driven story/scene production** with interactive timeline editing, asset management, and real-time model inspection.

## 🎯 Purpose

Create and manage complex animated narratives by:
- Defining character assets with prompts, references, and outfit variations
- Building timeline events with precise timing, camera movements, lighting, and effects
- Configuring checkpoint models, samplers, seeds, and TTS engines
- Exporting narratives for downstream video/animation generation

## 🏗️ Architecture

```
src/
├── lib/
│   ├── model/                  # Data layer (pure, testable)
│   │   ├── model-types.ts      # Type definitions (Story, Character, Timeline, etc.)
│   │   ├── model-template.ts   # Zod validation schemas & default builders
│   │   ├── model-example.ts    # Concrete example story
│   │   ├── model-story-example.ts # Full-featured example (Goliath Spring)
│   │   ├── index.ts            # Barrel export for types & functions
│   │   └── model-template.test.ts # Unit tests for validation
│   │
│   └── components/
│       ├── app/                # Application-specific components
│       │   ├── Timeline.svelte  # Timeline event editor
│       │   ├── AssetManager.svelte # Character/environment/audio CRUD
│       │   ├── PropertiesPanel.svelte # Contextual property editor
│       │   ├── TimelineEvent.svelte # Individual event card
│       │   ├── SequenceOrchestrator.svelte # Event sequencing UI
│       │   ├── ModelInspector.svelte # Model validation inspector
│       │   ├── SystemFooter.svelte # Footer controls
│       │   ├── index.ts # Barrel export for app components
│       │   └── [more...].svelte
│       │
│       ├── application/        # Layout components (sidebar, header)
│       └── ui/                 # shadcn-svelte primitives (read-only)
│
├── routes/
│   ├── +page.svelte            # Home / landing
│   ├── /app/+page.svelte       # Main editor
│   ├── /timeline/+page.svelte  # Timeline-focused view
│   ├── /demo/+page.svelte      # Demo page
│   └── /demo-model/+page.svelte # Model demo
│
└── [other files]

e2e/                           # Playwright end-to-end tests (empty)
bmad/                          # Project metadata & docs
└── artifacts/
    └── audit-full-2026-03-03.md # Baseline audit report
```

### Data Flow

```
Model (Zod schema)
  ↓
model-template.ts (validation, builders)
  ↓
Components ($state stores)
  ↓
UI (Svelte 5 reactivity)
```

---

## 📊 Data Model

### Core Types

**Model** – The root narrative document
```typescript
interface Model {
  project: Project           // Resolution, FPS, name
  assets: Assets            // Characters, environments, audio
  timeline: TimelineEvent[] // Array of scene events
  config: Config            // Checkpoint, sampler, seed, TTS engine
}
```

**TimelineEvent** – A single scene moment
```typescript
interface TimelineEvent {
  time: number              // Millisecond offset
  frame: TimelineFrame      // What happens at this time
}
```

**TimelineFrame** – Snapshot of scene state
```typescript
interface TimelineFrame {
  actors?: Actor[]          // Character positions, speech, actions
  camera?: Camera           // Zoom, pan, tilt
  lighting?: Lighting       // Type, intensity
  fx?: FX                   // Bloom, motion blur
  controlnet?: ControlNet   // Control net parameters
  audio_tracks?: AudioTrack[] // Background music, SFX
  audio_reactive?: AudioReactive // Audio-driven param animation
}
```

### Validation

All models are validated against `modelSchema` (Zod) which enforces:
- Character IDs must be unique and reference valid characters in assets
- Audio asset URLs must be absolute URLs or valid local filenames
- **Path traversal prevention** (rejects `..`, null bytes)
- Camera zoom ranges, lighting intensity 0-1, etc.
- Timeline events sorted by time

---

## 🔧 Key Components

### Timeline.svelte
Renders a horizontal timeline with zoom controls. Converts TimelineEvent array to displayable cards. Supports scrubbing and selection.

### AssetManager.svelte
Lists characters, environments, and audio assets. Shows empty states. **Now uses `structuredClone()` to prevent mutations.**

### PropertiesPanel.svelte
**Fully typed** with `TimelineEvent` input. Displays camera, lighting, FX, and ControlNet properties for the selected event.

### SequenceOrchestrator.svelte
Orchestrates timeline event sequences. Works with array timeline without `.Object.values()` overhead.

---

## 🧪 Testing

- **Unit tests**: `src/lib/model/model-template.test.ts` (Zod validation)
  - Run: `pnpm run test:unit`
  - Current: 4 passing tests
  - **TODO**: Expand to 70%+ coverage on models, stores, components

- **E2E tests**: `e2e/` (Playwright)
  - Currently empty; should test: load model, edit timeline, export
  - Run: `pnpm run test:e2e`

---

## 🚀 Development

### Setup
```bash
pnpm install
```

### Dev Server
```bash
pnpm run dev
# Navigate to http://localhost:5173
```

### Type Check
```bash
pnpm exec tsc --noEmit
```

### Build
```bash
pnpm run build
pnpm run preview
```

### Lint & Format
```bash
pnpm run lint         # ESLint + Prettier check
pnpm run format       # Auto-format with Prettier
```

---

## 📦 Dependencies

### Key Runtime
- **Svelte 5.53** – Reactive UI framework (runes: `$state`, `$props`)
- **SvelteKit 2.53** – Full-stack framework
- **Zod 4.3** – Runtime type validation
- **TailwindCSS 4.2** – Utility-first styling
- **shadcn-svelte 1.1** – Headless UI component library

### Dev Tools
- **TypeScript 5.9** – Static type checking
- **Vitest 4** – Unit testing
- **Playwright 1.58** – E2E testing
- **ESLint + Prettier** – Code quality & formatting

### Removed
- ~~lucide-react~~ → use `@lucide/svelte` instead
- ~~@radix-ui/react-slot~~ (React, not needed in Svelte)

---

## 🔐 Security Notes

1. **Path Traversal**: `isUrlOrFile()` now rejects `..` in asset paths
2. **XSS Prevention**: All user text (prompts, speech) must be escaped when rendered
3. **Environment Variables**: Use `.env.local` for secrets (see `.env.example`)
4. **No Hardcoded Secrets**: All config loaded from environment or `config` object

---

## 🎓 Contributing

### Style
- Use **Svelte 5 runes** (`$state`, `$props`, `$effect`)
- Prefer snippets over slots
- Add **TypeScript types** to all functions
- Write **JSDoc comments** for exported functions

### Adding a Feature
1. Define types in `src/lib/model/model-types.ts`
2. Add Zod validation in `model-template.ts`
3. Create component in `src/lib/components/app/`
4. Add tests in `src/lib/model/*.test.ts`
5. Update barrel exports (`index.ts` files)

### Code Review Checklist
- [ ] Types are strict (no `any`)
- [ ] Svelte components are immutable (`$state` cloned where needed)
- [ ] Tests added or updated
- [ ] README/docs updated if API changes
- [ ] No console logs or debug code
- [ ] Lint and format pass

---

## 📝 Related Documents

- **GUIDELINES.md** – Canonical model structure, enums, validation rules
- **SVELTE.md** – Svelte 5 conventions, runes, snippets
- **AGENTS.md** – MCP tool usage for documentation
- **bmad/status.yaml** – Project status & sprint tracking
- **bmad/artifacts/audit-full-2026-03-03.md** – Baseline audit (26 findings)

---

**Last Updated**: 2026-03-03  
**Version**: 0.0.1  
**Status**: In Development (Phase 2 complete, Phase 3 in progress)
