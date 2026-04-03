# Sprint 37 Plan — Mobile & Responsive Experience

**Version:** v0.12.0  
**Theme:** Responsive  
**Points:** 10  
**Duration:** 1.5 weeks (2026-07-03 → 2026-07-14)  
**Status:** Pending

---

## Overview

Sprint 37 makes Latent-line **fully responsive** for tablets and mobile devices, enabling timeline editing on the go with touch-optimized interactions.

---

## Stories

### S37-01: Responsive Layout (4 points) — P1

**Status:** Pending  
**Priority:** P1

#### Description
Adapt UI for tablets and small screens with responsive layouts.

#### Features
- Collapsible panels (auto-hide on mobile)
- Stacked layout < 768px width
- Touch-friendly targets (min 44x44px)
- Responsive font sizes
- Mobile navigation drawer
- Bottom sheet for properties on mobile

#### Acceptance Criteria
- [ ] Works on iPad (768px+)
- [ ] Works on mobile (375px+)
- [ ] No horizontal scroll
- [ ] All buttons accessible (44px min)
- [ ] ARIA labels correct
- [ ] Unit tests (4+)

#### Technical Design

**CSS Breakpoints:**
```css
/* theme.css */
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
}
```

**Responsive Layout:**
```css
/* workspace.css */
.app-shell {
  display: grid;
  grid-template-columns: 280px 1fr 320px; /* Sidebar | Timeline | Properties */
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr 320px; /* Hide sidebar */
  }
}

@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr; /* Stack */
    grid-template-rows: auto 1fr auto; /* Header | Timeline | Bottom */
  }
  
  .properties-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
  }
}
```

**Mobile Navigation:**
```svelte
<!-- MobileNav.svelte -->
<script lang="ts">
  let isOpen = $state(false);
</script>

<button 
  class="menu-toggle" 
  aria-label="Toggle menu"
  onclick={() => isOpen = !isOpen}
>
  <Icon name="menu" />
</button>

{#if isOpen}
  <div class="mobile-drawer" role="dialog" aria-modal="true">
    <!-- Navigation items -->
  </div>
{/if}
```

#### Implementation Plan

**Day 1-2: Responsive CSS**
- [ ] Update workspace.css breakpoints
- [ ] Stack layout for mobile
- [ ] Collapsible sidebar
- [ ] Responsive typography

**Day 3: Mobile Navigation**
- [ ] Create MobileNav.svelte
- [ ] Drawer component
- [ ] Menu toggle
- [ ] Close on outside click

**Day 4: Properties Panel Mobile**
- [ ] Bottom sheet layout
- [ ] Swipe to dismiss
- [ ] Handle drag

**Day 5: Accessibility & Tests**
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Unit tests (4+)
- [ ] Device testing

---

### S37-02: Touch Gestures (3 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Gesture controls for timeline navigation on touch devices.

#### Features
- Pinch to zoom timeline
- Swipe to scrub through timeline
- Tap to select event
- Long-press for context menu
- Two-finger scroll
- Pull to refresh (reload model)

#### Acceptance Criteria
- [ ] Pinch zoom works (20% - 500%)
- [ ] Swipe scrubs timeline
- [ ] Context menu on long-press (500ms)
- [ ] Tap selects event
- [ ] No gesture conflicts
- [ ] Unit tests (4+)

#### Technical Design

**New Files:**
```
src/lib/utils/touch-gestures.ts       (~180 lines)
src/lib/components/app/GestureHandler.svelte   (~100 lines)
```

**Gesture Detection:**
```typescript
// touch-gestures.ts
interface GestureState {
  pinchZoom: number;
  swipeX: number;
  longPress: boolean;
  tapCount: number;
}

export function usePinchZoom(
  element: HTMLElement,
  onZoom: (zoom: number) => void
): () => void;

export function useSwipe(
  element: HTMLElement,
  onSwipe: (deltaX: number) => void
): () => void;

export function useLongPress(
  element: HTMLElement,
  onLongPress: () => void,
  delay?: number
): () => void;
```

**Pinch Zoom Implementation:**
```typescript
function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const distance = getTouchDistance(e.touches);
    const zoom = distance / initialDistance;
    onZoom(clamp(zoom, 0.2, 5));
  }
}
```

#### Implementation Plan

**Day 1: Touch Utilities**
- [ ] Create touch-gestures.ts
- [ ] usePinchZoom hook
- [ ] useSwipe hook
- [ ] Unit tests (2+)

**Day 2: Gesture Handler**
- [ ] Create GestureHandler.svelte
- [ ] Pinch zoom integration
- [ ] Swipe to scrub

**Day 3: Long Press & Tests**
- [ ] useLongPress hook
- [ ] Context menu trigger
- [ ] Unit tests (2+)
- [ ] Device testing

---

### S37-03: Mobile Timeline View (3 points) — P2

**Status:** Pending  
**Priority:** P2

#### Description
Simplified timeline view optimized for mobile screens.

#### Features
- Compact event cards (50% height)
- Vertical timeline option
- Simplified properties panel
- Quick actions (play, duplicate, delete)
- Collapsible event details
- Touch-optimized scrubber

#### Acceptance Criteria
- [ ] Mobile-optimized view
- [ ] All CRUD operations work
- [ ] Compact mode toggle
- [ ] Vertical timeline option
- [ ] Unit tests (4+)

#### Technical Design

**New Files:**
```
src/lib/components/app/MobileTimeline.svelte   (~200 lines)
src/lib/components/app/CompactEventCard.svelte   (~120 lines)
src/lib/components/app/VerticalTimeline.svelte   (~150 lines)
```

**Compact Card:**
```svelte
<!-- CompactEventCard.svelte -->
<script lang="ts">
  let { event, isExpanded }: { event: TimelineEvent, isExpanded: boolean } = $props();
</script>

<div class="compact-card" class:expanded={isExpanded}>
  <div class="card-header">
    <span class="time">{formatTime(event.time)}</span>
    <span class="title">{event.frame.actors?.[0]?.prompt ?? 'Event'}</span>
  </div>
  
  {#if isExpanded}
    <div class="card-details">
      <!-- Full details -->
    </div>
  {/if}
  
  <div class="quick-actions">
    <button onclick={onPlay} aria-label="Play"><Icon name="play" /></button>
    <button onclick={onDuplicate} aria-label="Duplicate"><Icon name="copy" /></button>
    <button onclick={onDelete} aria-label="Delete"><Icon name="trash" /></button>
  </div>
</div>
```

#### Implementation Plan

**Day 1: Mobile Timeline**
- [ ] Create MobileTimeline.svelte
- [ ] Compact card rendering
- [ ] Touch-optimized interactions

**Day 2: Vertical Timeline**
- [ ] Create VerticalTimeline.svelte
- [ ] Vertical layout
- [ ] Scroll sync

**Day 3: Quick Actions & Tests**
- [ ] Quick action buttons
- [ ] Expand/collapse
- [ ] Unit tests (4+)
- [ ] Device testing

---

## Technical Debt

- [ ] Add PWA manifest
- [ ] Offline support
- [ ] Install prompt

---

## Testing Plan

### Unit Tests (12 total)
- touch-gestures.test.ts (4 tests)
- responsive-utils.test.ts (4 tests)
- mobile-timeline.test.ts (4 tests)

### E2E Tests (3 total)
- mobile-layout.spec.ts
- touch-gestures.spec.ts
- mobile-crud.spec.ts

### Device Testing

**Tested Devices:**
- [ ] iPad Pro (1024x1366)
- [ ] iPad Mini (768x1024)
- [ ] iPhone 14 Pro (393x852)
- [ ] iPhone SE (375x667)
- [ ] Android (Samsung S23: 360x780)
- [ ] Android Tablet (800x1280)

---

## Definition of Done

- [ ] All stories complete
- [ ] 12+ unit tests passing
- [ ] 3 E2E tests passing
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Prettier format passes
- [ ] Device testing complete
- [ ] Accessibility audit passes
- [ ] CHANGELOG.md updated

---

## Release Notes Draft

### v0.12.0 — Mobile & Responsive

**New Features:**
- 📱 **Responsive Layout** — Works on iPad, tablets, and phones
- 👆 **Touch Gestures** — Pinch zoom, swipe scrub, long-press menus
- 📄 **Mobile Timeline** — Compact cards, vertical view option
- 🎯 **Touch-Friendly** — 44px minimum touch targets

**Improvements:**
- Bottom sheet for properties on mobile
- Mobile navigation drawer
- Quick action buttons
- Collapsible event details

**Responsive Breakpoints:**
| Device | Width | Layout |
|--------|-------|--------|
| Desktop | > 1024px | 3-column (sidebar, timeline, properties) |
| Tablet | 768-1024px | 2-column (timeline, properties) |
| Mobile | < 768px | Stacked with bottom sheet |

---

**Created:** 2026-04-02  
**Sprint Start:** 2026-07-03  
**Sprint End:** 2026-07-14
