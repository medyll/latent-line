# Architecture & Data Flow

This document explains how latent-line components communicate and how data flows through the application.

---

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     BROWSER (SPA)                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Routes (SvelteKit pages)                                     │
│  ├── +page.svelte (home)                                      │
│  ├── /app/+page.svelte (main editor)                          │
│  ├── /timeline/+page.svelte (timeline view)                   │
│  └── /demo* (demo pages)                                      │
│                                                                │
│         ↓ (mounts components)                                 │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │           Application Layout (Header/Sidebar)            ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  Sidebar: AssetManager                            │  ││
│  │  │  - Lists characters, environments, audio          │  ││
│  │  │  - Mutable store: assetStore ($state)            │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  Main: Timeline + PropertiesPanel                 │  ││
│  │  │  - Timeline.svelte: renders events, zoom controls │  ││
│  │  │  - PropertiesPanel.svelte: shows camera/fx       │  ││
│  │  │  - Reactive: updates on event selection          │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  Footer: SystemFooter                            │  ││
│  │  │  - Model export, debug controls                  │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
│         ↓ (imports models)                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │           Model Layer (src/lib/model/)                    ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  model-types.ts (type defs)                       │  ││
│  │  │  - Model, Project, Character, TimelineEvent, etc. │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  model-template.ts (Zod validation)               │  ││
│  │  │  - modelSchema (validates structure & content)   │  ││
│  │  │  - buildDefaultModel() (factory)                  │  ││
│  │  │  - createModelTemplate() (deep clone)             │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  model-example.ts, model-story-example.ts         │  ││
│  │  │  - Concrete example narratives                    │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │  index.ts (barrel export)                         │  ││
│  │  │  - Re-exports all types, functions, examples     │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
│         ↓ (Zod validates at runtime)                         │
│                                                                │
│  Validation Result                                            │
│  ├── ✅ Valid: data flows to $state stores                   │
│  └── ❌ Invalid: error logged, user notified                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow (Detailed)

### 1. Initialization

1. **Route mounts** (e.g., `/app/+page.svelte`)
2. **Component imports model** from `src/lib/model/`:
   ```typescript
   import exampleModel from '$lib/model/model-example';
   ```
3. **Zod validates** via `modelSchema.safeParse(exampleModel)`
4. **Create mutable store** (Svelte 5 `$state`):
   ```typescript
   const assetStore = $state(structuredClone(exampleModel.assets));
   ```

   - **Deep clone** prevents mutations to original
   - **$state** makes store reactive

### 2. Timeline Rendering

1. **Timeline.svelte receives array** (`exampleModel.timeline`)
2. **Compute display format**:
   ```typescript
   const timelineEvents = exampleModel.timeline.map((event, idx) => ({
   	id: `event_${idx}`,
   	label: `Event ${idx + 1}`,
   	start: event.time
   	// ... extract actor, speech, camera, fx, audio
   }));
   ```
3. **Render cards** for each event
4. **Support zoom and scrubbing** (slider controls)

### 3. Event Selection & Property Display

1. **User clicks event card**
2. **`selected` state updates** (Svelte reactivity)
3. **PropertiesPanel updates** (reactive dependency):

   ```typescript
   const selected = $state<TimelineEvent | null>(null);

   function getProperties(event: TimelineEvent) {
   	return {
   		camera: event.frame?.camera,
   		lighting: event.frame?.lighting,
   		fx: event.frame?.fx,
   		controlnet: event.frame?.controlnet
   	};
   }
   ```

4. **Display camera zoom, lighting type, FX strength**

### 4. Asset Management

1. **AssetManager.svelte lists characters**:
   ```typescript
   {#each assetStore.characters as char (char.id)}
     <!-- display avatar, ID, name -->
   {/each}
   ```
2. **User edits asset** (e.g., change character prompt)
3. **Mutation updates `assetStore`** automatically
4. **Svelte reactivity re-renders** dependent components

### 5. Model Export / Persistence

1. **User clicks "Export"** in SystemFooter
2. **Serialize model to JSON**:
   ```typescript
   const json = JSON.stringify(assetStore, null, 2);
   ```
3. **Validate before export**:
   ```typescript
   const result = modelSchema.safeParse(assetStore);
   if (!result.success) {
   	console.error('Validation failed:', result.error);
   	return;
   }
   ```
4. **Download or upload** to backend

---

## Component Communication

### Parent → Child (Props)

```typescript
<Timeline timeline={exampleModel.timeline} />

<PropertiesPanel event={selectedEvent} />

<AssetManager assets={assetStore} />
```

### Child → Parent ($state binding or callback)

```typescript
// In parent:
let selected = $state(null);

// In child (e.g., TimelineEvent.svelte):
<script lang="ts">
  interface Props {
    item: TimelineEventDisplay;
    onSelect?: (item: TimelineEventDisplay) => void;
  }
  let { item, onSelect } = $props();

  function handleClick() {
    onSelect?.(item);
  }
</script>

<div on:click={handleClick}>{item.label}</div>
```

### Shared State (Svelte Stores)

**Future**: Create a centralized model store:

```typescript
// src/lib/stores/modelStore.ts
import { writable } from 'svelte/store';
import type { Model } from '$lib/model/model-types';

export const currentModel = writable<Model | null>(null);
export const selectedEvent = writable<TimelineEvent | null>(null);

// In component:
import { currentModel, selectedEvent } from '$lib/stores/modelStore';

{#each $currentModel.timeline as event (event.time)}
  <TimelineEvent
    {event}
    selected={$selectedEvent === event}
    onSelect={(e) => selectedEvent.set(e)}
  />
{/each}
```

---

## State Immutability & Cloning

### Problem

```typescript
// ❌ BAD: Shared reference to original
const assetStore = $state(exampleModel.assets);
assetStore.characters[0].name = 'Evil'; // Mutates original!
```

### Solution

```typescript
// ✅ GOOD: Deep clone
const assetStore = $state(structuredClone(exampleModel.assets));
assetStore.characters[0].name = 'Safe'; // Mutates copy only
```

**When to clone:**

- When assigning to `$state` from external data
- When passing mutable objects to child components
- Before modifying nested structures

---

## Validation Checkpoints

### 1. On Model Load

```typescript
const result = modelSchema.safeParse(loadedModel);
if (!result.success) {
	console.error('Invalid model:', result.error.flatten());
	// Show error UI, reject import
}
const validModel = result.data;
```

### 2. Before Export

```typescript
const result = modelSchema.safeParse(assetStore);
if (!result.success) {
	toast.error('Model has validation errors. Cannot export.');
	return;
}
// Safe to export
download(JSON.stringify(result.data));
```

### 3. In Zod Refinements

Security checks:

- **Path traversal**: `!urlOrFile.includes('..')`
- **File type**: `/\.(png|jpe?g|wav|mp3|...)$/i.test(s)`

---

## Performance Considerations

### 1. Timeline Rendering

**Current**: Map over array once

```typescript
const timelineEvents = exampleModel.timeline.map(...);
```

**Issue**: Recomputes on every render if not memoized

**Solution**: Use reactive declaration

```typescript
$: timelineEvents = exampleModel.timeline.map(...);
```

### 2. Asset Search

**Current**: Linear scan (O(n))

```typescript
characters.filter((c) => c.name.includes(search));
```

**Issue**: Slow for 100+ characters

**Solution**: Index with Map (O(1))

```typescript
const charIndex = new Map(characters.map((c) => [c.id, c]));
```

### 3. Deep Cloning

**Issue**: `structuredClone()` is expensive for large models

**Solution**: Lazy clone or use Immer:

```typescript
import { produce } from 'immer';
const assetStore = $state(produce(exampleModel.assets, () => {}));
```

---

## Error Handling

### Validation Errors

```typescript
const result = modelSchema.safeParse(data);
if (!result.success) {
	const errors = result.error.flatten().fieldErrors;
	// { timeline: ["Timeline must not be empty"], ... }
	showErrorNotification(errors);
}
```

### Type Errors

TypeScript catches at compile time:

```typescript
const event: TimelineEvent = ...;
event.invalid_field = 123; // ❌ TS2339: Property 'invalid_field' does not exist
```

### Runtime Guards

```typescript
function processActor(actor: any) {
	if (!actor || typeof actor.id !== 'string') {
		throw new Error('Invalid actor: missing id');
	}
	// Safe to use actor.id
}
```

---

## Testing Strategy

### Unit Tests (Zod Validation)

```typescript
import { modelSchema } from '$lib/model/model-template';

test('should reject path traversal', () => {
	const invalid = {
		...validModel,
		assets: {
			...validModel.assets,
			audio: [{ id: 'a1', url: '../../../etc/passwd.wav' }]
		}
	};
	const result = modelSchema.safeParse(invalid);
	expect(result.success).toBe(false);
});
```

### Component Tests (Vitest + Svelte)

```typescript
import { render } from 'vitest-browser-svelte';
import Timeline from '$lib/components/app/Timeline.svelte';

test('renders timeline events', () => {
	const { getByText } = render(Timeline, {
		props: { timeline: exampleModel.timeline }
	});
	expect(getByText(/event 1/i)).toBeVisible();
});
```

### E2E Tests (Playwright)

```typescript
test('user can load, edit, and export model', async ({ page }) => {
	await page.goto('/app');
	await page.click('text=Load Example');
	await page.fill('[placeholder="Event name"]', 'My Event');
	await page.click('button:has-text("Export")');
	// Verify download
});
```

---

## Future Improvements

1. **Model versioning**: Track changes, undo/redo
2. **Collaborative editing**: WebSocket sync
3. **Asset preview**: Thumbnail generation
4. **Timeline scrubbing**: Seek in preview
5. **Checkpoint browser**: Browse available models
6. **Analytics**: Track usage patterns

---

**Last Updated**: 2026-03-03
