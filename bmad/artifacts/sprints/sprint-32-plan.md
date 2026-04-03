# Sprint 32 Plan — Tooltip System & UX Micro-interactions

**Version:** v0.8.5  
**Theme:** UX Polish  
**Points:** 9  
**Duration:** 1.5 weeks (2026-04-16 → 2026-04-27)  
**Status:** Pending

---

## Overview

Sprint 32 focuses on **UX polish** with a consistent tooltip system, loading states, and micro-animations. This sprint improves the overall feel and responsiveness of the application.

---

## Stories

### S32-01: Tooltip System (4 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Implement a consistent, accessible tooltip system across the entire application.

#### Features
- TooltipPrimitive wrapper component (bits-ui based)
- Tooltips on all icon buttons
- Keyboard shortcut hints in tooltips
- Delay on show (300ms)
- Escape to dismiss
- Touch support (long-press)
- Side preference (top, right, bottom, left)

#### Acceptance Criteria
- [ ] Tooltip component (accessible, ARIA-compliant)
- [ ] All toolbar buttons have tooltips
- [ ] Shortcut hints shown (e.g., "Save (Ctrl+S)")
- [ ] 300ms delay before show
- [ ] Escape dismisses tooltip
- [ ] Touch long-press support
- [ ] Unit tests (5+)
- [ ] A11y tests (axe-core)

#### Technical Design

**New Files:**
```
src/lib/components/app/Tooltip.svelte        (~80 lines)
src/lib/components/app/TooltipProvider.svelte   (~60 lines)
src/lib/utils/tooltip-registry.ts            (~50 lines)
```

**Usage Pattern:**
```svelte
<script lang="ts">
  import { Tooltip } from '$lib/components/app/Tooltip.svelte';
</script>

<Tooltip content="Save timeline (Ctrl+S)" side="bottom">
  <button aria-label="Save">
    <Icon name="save" />
  </button>
</Tooltip>
```

**Shortcut Integration:**
```typescript
// src/lib/utils/tooltip-registry.ts
export function getShortcutHint(action: string): string {
  // Returns "Save (Ctrl+S)" format
}
```

#### Implementation Plan

**Day 1: Tooltip Component**
- [ ] Create Tooltip.svelte
- [ ] Props: content, side, delay, disabled
- [ ] Positioning logic (auto-flip)
- [ ] Show/hide animations

**Day 2: Accessibility**
- [ ] ARIA attributes (role="tooltip")
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader testing

**Day 3: Integration**
- [ ] Add tooltips to Timeline toolbar
- [ ] Add tooltips to AssetManager
- [ ] Add tooltips to PropertiesPanel
- [ ] Shortcut hints integration

**Day 4: Touch & Tests**
- [ ] Long-press for touch devices
- [ ] Unit tests (5+)
- [ ] A11y tests

---

### S32-02: Loading States & Skeletons (3 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Visual feedback during async operations with skeleton loaders and progress indicators.

#### Features
- Skeleton loaders for AssetManager cards
- Spinner for timeline scrubbing (heavy models)
- Progress bar for import/export operations
- Optimistic UI updates for instant feedback
- Loading overlay for modal dialogs

#### Acceptance Criteria
- [ ] Skeleton components (card, line, circle)
- [ ] Loading state on import/export
- [ ] Progress indication with percentage
- [ ] No layout shift during load
- [ ] Unit tests (4+)

#### Technical Design

**New Files:**
```
src/lib/components/app/Skeleton.svelte       (~40 lines)
src/lib/components/app/LoadingOverlay.svelte   (~60 lines)
src/lib/components/app/ProgressBar.svelte    (~50 lines)
```

**Skeleton Variants:**
```svelte
<!-- Card skeleton for asset cards -->
<Skeleton variant="card" />

<!-- Line skeleton for text -->
<Skeleton variant="line" width="60%" />

<!-- Circle skeleton for avatars -->
<Skeleton variant="circle" size="40px" />
```

#### Implementation Plan

**Day 1: Skeleton Components**
- [ ] Create Skeleton.svelte
- [ ] Variants: card, line, circle
- [ ] Animation (shimmer effect)
- [ ] Unit tests

**Day 2: Loading States**
- [ ] Import/export progress bar
- [ ] LoadingOverlay component
- [ ] Optimistic UI pattern

**Day 3: Integration**
- [ ] AssetManager skeleton loading
- [ ] Timeline scrubbing indicator
- [ ] Modal loading states

---

### S32-03: Micro-animations & Transitions (2 points) — P3

**Status:** Pending  
**Priority:** P3

#### Description
Smooth transitions and animations for better UX feel.

#### Features
- Fade transitions on panel open/close
- Slide animations on event add/remove
- Scale on hover for cards
- Smooth playhead movement (60fps)
- Respects `prefers-reduced-motion`

#### Acceptance Criteria
- [ ] CSS transitions on interactions
- [ ] Svelte transitions for lists
- [ ] 60fps animations (DevTools profiling)
- [ ] `prefers-reduced-motion` support
- [ ] Unit tests (2+)

#### Technical Design

**CSS Transitions:**
```css
/* workspace.css */
.panel {
  transition: opacity 200ms ease, transform 200ms ease;
}

.card {
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.card:hover {
  transform: scale(1.02);
}
```

**Svelte Transitions:**
```svelte
<script lang="ts">
  import { fade, slide, scale } from 'svelte/transition';
</script>

{#if panelOpen}
  <div transition:fade={{ duration: 200 }}>
    <!-- panel content -->
  </div>
{/if}

{#each events as event (event.id)}
  <div transition:slide={{ duration: 150 }}>
    <!-- event card -->
  </div>
{/each}
```

#### Implementation Plan

**Day 1: Panel Transitions**
- [ ] Fade on PropertiesPanel
- [ ] Slide on SearchPanel
- [ ] Smooth playhead animation

**Day 2: List Animations**
- [ ] Slide on event add/remove
- [ ] Scale on card hover
- [ ] prefers-reduced-motion media query

**Day 3: Testing**
- [ ] Performance profiling (60fps)
- [ ] Cross-browser testing
- [ ] Unit tests

---

## Technical Debt

- [ ] Audit all icon buttons for tooltip coverage
- [ ] Remove any console.log statements
- [ ] Update CSS organization

---

## Testing Plan

### Unit Tests (11 total)
- tooltip-registry.test.ts (3 tests)
- loading-utils.test.ts (4 tests)
- animation-config.test.ts (4 tests)

### E2E Tests (3 total)
- tooltips-display.spec.ts
- loading-states-import.spec.ts
- animations-playback.spec.ts

### Accessibility Tests
- axe-core run on all pages
- Screen reader testing (NVDA, VoiceOver)

---

## Definition of Done

- [ ] All stories complete
- [ ] 11+ unit tests passing
- [ ] 3 E2E tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Manual QA pass
- [ ] A11y audit passes
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.8.5 — UX Polish

**New Features:**
- 💬 **Tooltip System** — Consistent tooltips everywhere with shortcut hints
- ⏳ **Loading States** — Skeleton loaders and progress bars for async ops
- ✨ **Micro-animations** — Smooth transitions for panels, cards, and lists

**Improvements:**
- Better visual feedback during operations
- Accessibility improved with ARIA tooltips
- 60fps animations with reduced-motion support

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-04-16  
**Sprint End:** 2026-04-27
