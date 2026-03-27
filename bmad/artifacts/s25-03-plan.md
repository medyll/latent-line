# S25-03 — Presentation Mode Implementation Plan

**Story:** S25-03 (5 pts)
**Theme:** Production — export EDL, recherche globale, mode présentation
**Status:** Planning
**Date Started:** 2026-03-25

---

## Requirements

### Core Features

1. **Fullscreen Review Mode** — Dedicated `/present` route
2. **Keyboard Navigation** — Arrow keys (←/→), P to toggle playback
3. **Auto-playback** — Per-event duration with smooth transitions
4. **URL-Shareable** — Can share presentation link via URL
5. **Keyboard-Only Support** — No mouse required for navigation

### Acceptance Criteria

- [x] Route `/present` displays timeline as fullscreen slideshow
- [x] Events display sequentially (one at a time)
- [x] Keyboard controls: ← (prev), → (next), P (play/pause), ESC (exit)
- [x] Each event displays for its duration (or default 3s)
- [x] Fullscreen API integration (F to toggle fullscreen)
- [x] State persists via URL params: `/present?projectId=...&eventIndex=0`
- [x] Mobile-friendly: touch/swipe support optional, keyboard required
- [x] Tests cover navigation, playback, duration logic

---

## Implementation Plan

### Phase 1: Route & Component Setup (1.5 pts)

**New Files:**

- `src/routes/present/+page.svelte` — Main presentation component
- `src/routes/present/+page.server.ts` — Load project from params
- `src/lib/components/PresentationView.svelte` — Presentation logic (reusable)
- `src/lib/utils/presentation.ts` — Keyboard handling, playback state

**Changes:**

- Update `+page.svelte` to add "Presentation Mode" button in SystemFooter
- Link navigates to `/present?model=<base64-encoded-model>`

### Phase 2: Playback Logic (1.5 pts)

**Core State (`presentation.ts`):**

```typescript
export interface PresentationState {
  currentIndex: number;
  isPlaying: boolean;
  progress: number; // 0-1 for current event
  duration: number; // ms for current event
}

export function usePresentationPlayback(model: Model) {
  let state = $state({...});
  let timer: number | null = null;

  function playNext() { /* next event */ }
  function playPrev() { /* prev event */ }
  function togglePlayback() { /* pause/resume */ }
}
```

**Behavior:**

- Display one event at a time (full viewport)
- Event duration = `event.duration * 1000` (ms) or default 3000ms
- Auto-advance to next event when duration expires
- Pause on last event
- Keyboard interrupt resets timer

### Phase 3: UI & Styling (1 pt)

**PresentationView.svelte:**

```svelte
<div class="presentation-container">
	<!-- Current event display -->
	<div class="event-content">
		<h1>{currentEvent.action}</h1>
		<p>{currentEvent.character}</p>
		<p class="mood">{currentEvent.mood}</p>
	</div>

	<!-- Progress bar -->
	<div class="progress-bar">
		<div class="progress" style="width: {progress * 100}%"></div>
	</div>

	<!-- Controls (subtle) -->
	<div class="controls">
		<span>← → to navigate | P to play | F for fullscreen | ESC to exit</span>
	</div>
</div>

<style>
	.presentation-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, var(--color-surface-0), var(--color-surface-1));
		color: var(--color-foreground);
		font-family: var(--font-family-serif);
	}

	.event-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 60px 40px;
		text-align: center;
	}

	h1 {
		font-size: 4rem;
		margin: 0 0 20px;
	}

	.progress-bar {
		height: 3px;
		background: var(--color-surface-2);
	}

	.progress {
		height: 100%;
		background: var(--color-accent);
		transition: width 100ms linear;
	}

	.controls {
		padding: 12px 20px;
		font-size: 12px;
		color: var(--color-foreground-secondary);
		background: var(--color-surface-0);
		border-top: 1px solid var(--color-surface-1);
	}
</style>
```

### Phase 4: Keyboard & Fullscreen (1 pt)

**Keyboard Handling:**

- ← → — move between events
- P — toggle play/pause
- F — request fullscreen
- ESC — exit to main view
- Spacebar — play/pause (alternative)

**Fullscreen API:**

```typescript
async function toggleFullscreen() {
	if (!document.fullscreenElement) {
		await container.requestFullscreen();
	} else {
		await document.exitFullscreen();
	}
}
```

### Phase 5: Tests & Polish (0.5 pts)

**Test File: `src/routes/present/+page.test.ts`**

- Navigation logic (prev/next/boundaries)
- Playback timing (duration, auto-advance)
- Keyboard input handling
- URL param parsing
- Fullscreen state

---

## Technical Stack

| Component  | Technology                                  |
| ---------- | ------------------------------------------- |
| Routing    | SvelteKit `src/routes/present/+page.svelte` |
| Playback   | Svelte 5 runes (`$state`, `$effect`)        |
| Keyboard   | `keydown` event listener                    |
| Fullscreen | Fullscreen API (`requestFullscreen()`)      |
| Styling    | CSS custom properties + utilities           |
| Testing    | Vitest + Svelte Testing Library             |

---

## Code Patterns (From Existing Codebase)

**Event Display:** Mirror `SequenceOrchestrator` event card styling
**State Management:** Follow `generation.svelte.ts` reactive pattern
**Keyboard Handling:** Use existing `timeline-selection.test.ts` patterns
**URL Params:** Follow SvelteKit `page.url.searchParams` pattern

---

## File Structure (After Implementation)

```
src/
├── routes/
│   └── present/
│       ├── +page.svelte         [NEW]
│       ├── +page.server.ts      [NEW]
│       └── +page.test.ts        [NEW]
├── lib/
│   ├── components/
│   │   └── PresentationView.svelte   [NEW]
│   └── utils/
│       └── presentation.ts           [NEW]
└── ... (existing)
```

---

## Acceptance Sign-Off

| Criterion                             | Status | Notes |
| ------------------------------------- | ------ | ----- |
| `/present` route displays fullscreen  | ⏳     | WIP   |
| Keyboard navigation (←/→/P/F/ESC)     | ⏳     | WIP   |
| Auto-playback with per-event duration | ⏳     | WIP   |
| URL-shareable via params              | ⏳     | WIP   |
| Fullscreen API integration            | ⏳     | WIP   |
| Tests (navigation, playback, timing)  | ⏳     | WIP   |
| All unit tests passing (339+)         | ⏳     | TBD   |

---

## Time Estimate

| Phase                          | Est. Time  | Status |
| ------------------------------ | ---------- | ------ |
| Phase 1: Routes + Component    | 20 min     | ⏳     |
| Phase 2: Playback Logic        | 25 min     | ⏳     |
| Phase 3: UI & Styling          | 15 min     | ⏳     |
| Phase 4: Keyboard & Fullscreen | 20 min     | ⏳     |
| Phase 5: Tests & Polish        | 15 min     | ⏳     |
| **Total**                      | **95 min** | ⏳     |

---

**Next:** Start Phase 1 implementation.
