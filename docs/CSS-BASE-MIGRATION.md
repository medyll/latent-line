# CSS-Base Migration Guide — Latent-line

**Status:** ✅ Complete  
**Date:** 2026-04-21  
**Version:** 1.0.0

---

## 🎯 Overview

Latent-line now uses **@medyll/css-base v0.6.0** as its complete design system foundation. This provides:

- ✅ **Design tokens** for colors, spacing, typography, shadows, motion
- ✅ **Dark mode** via `light-dark()` and `data-theme` attribute
- ✅ **Utility classes** for rapid development
- ✅ **Component patterns** (cards, buttons, forms, alerts, badges)
- ✅ **Responsive utilities** (mobile-first breakpoints)
- ✅ **Accessibility** built-in (focus states, reduced motion, contrast)

---

## 📦 Installation

Already installed via:
```bash
pnpm add @medyll/css-base
```

**Import location:** `src/routes/+layout.svelte`
```svelte
import '@medyll/css-base';
import '$lib/styles/app.css';
```

---

## 🎨 Design Tokens

### Colors

**Primary brand color:** Purple-violet (creative/video production vibe)
```css
--color-primary: oklch(0.55 0.25 280);
```

**Semantic colors:**
- `--color-success` — Green for success states
- `--color-warning` — Amber for warnings
- `--color-critical` — Red for errors
- `--color-info` — Blue for information
- `--color-surface` — Page background
- `--color-surface-alt` — Sidebar/alternate backgrounds
- `--color-surface-raised` — Cards, elevated surfaces
- `--color-text` — Primary text
- `--color-text-muted` — Secondary/subtle text
- `--color-border` — Borders and dividers

### Typography

**Font sizes:**
- `--text-xs` (11px)
- `--text-sm` (13px)
- `--text-md` (16px) — default
- `--text-lg` (18px)
- `--text-xl` (20px)
- `--text-2xl` (24px)

**Font weights:**
- `--font-normal` (400)
- `--font-medium` (500)
- `--font-semibold` (600)
- `--font-bold` (700)

**Line heights:**
- `--leading-none` (1.0)
- `--leading-tight` (1.25)
- `--leading-normal` (1.5)
- `--leading-relaxed` (1.75)
- `--leading-loose` (2.0)

### Spacing

**4px grid system:**
- `--gap-xs` / `--pad-xs` / `--marg-xs` (4px)
- `--gap-sm` / `--pad-sm` / `--marg-sm` (8px)
- `--gap-md` / `--pad-md` / `--marg-md` (16px)
- `--gap-lg` / `--pad-lg` / `--marg-lg` (24px)
- `--gap-xl` / `--pad-xl` / `--marg-xl` (32px)
- `--gap-2xl` / `--pad-2xl` / `--marg-2xl` (48px)
- `--gap-3xl` / `--pad-3xl` / `--marg-3xl` (64px)

### Border Radius

- `--radius-xs` (2px)
- `--radius-sm` (4px)
- `--radius-md` (6px)
- `--radius-lg` (8px)
- `--radius-xl` (12px)
- `--radius-2xl` (16px)
- `--radius-full` (9999px)

### Shadows

- `--shadow-xs` — Subtle elevation
- `--shadow-sm` — Small elevation
- `--shadow-md` — Medium elevation (cards)
- `--shadow-lg` — Large elevation (modals)
- `--shadow-xl` — Extra large
- `--shadow-2xl` — Maximum elevation

### Motion

- `--duration-fast` (100ms)
- `--duration-normal` (150ms) — default
- `--duration-slow` (300ms)

---

## 🏗 Layout Architecture

### App Shell Structure

```
.app-shell (grid: header + main)
├── .app-header (flex: logo, controls)
└── .app-main (grid: sidebar | timeline | properties)
    ├── .sidebar (assets, navigation)
    ├── .timeline-area (main editing area)
    └── .properties-panel (inspector)
```

### Responsive Breakpoints

- **Mobile:** < 768px (single column)
- **Tablet:** 768px - 1199px (sidebar + timeline)
- **Desktop:** ≥ 1200px (full three-column layout)

---

## 🧩 Component Patterns

### Buttons

```svelte
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-ghost">Ghost</button>
<button class="icon-btn" aria-label="Settings">⚙</button>
```

### Cards

```svelte
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Actions</div>
</div>
```

### Alerts

```svelte
<div class="alert alert-info">Information message</div>
<div class="alert alert-success">Success message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-error">Error message</div>
```

### Badges

```svelte
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
```

### Forms

```svelte
<div class="form-group">
  <label for="name">Name</label>
  <input id="name" type="text" placeholder="Enter name" />
</div>
```

---

## 🎭 Dark Mode

**Automatic via `light-dark()`** — no manual classes needed!

**Manual override:**
```svelte
<script>
  $effect(() => {
    if (prefs.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (prefs.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme'); // auto
    }
  });
</script>
```

---

## 🛠 Utilities

### Layout

```html
<div class="flex flex-col md:flex-row gap-md">
  <div class="w-full md:w-auto">Sidebar</div>
  <div class="grow">Content</div>
</div>
```

### Typography

```html
<h1 class="text-2xl font-bold text-primary">Heading</h1>
<p class="text-sm text-muted">Subtle text</p>
```

### Spacing

```html
<div class="p-md gap-md space-y-md">
  <!-- Content with padding, gap, and vertical spacing -->
</div>
```

### Responsive

```html
<div class="hide-mobile">Desktop only</div>
<div class="hide-desktop">Mobile only</div>
```

---

## 📋 Migration Checklist

### ✅ Completed

- [x] Install @medyll/css-base
- [x] Create `src/lib/styles/app.css` with custom components
- [x] Update `+layout.svelte` to use new classes
- [x] Implement dark mode with `data-theme` attribute
- [x] Create timeline components
- [x] Create asset card components
- [x] Create button styles
- [x] Create form styles
- [x] Create alert/badge components

### 🔄 In Progress

- [ ] Migrate existing components to use css-base tokens
- [ ] Remove old CSS files
- [ ] Update component inline styles to use classes
- [ ] Add attr() utilities for dynamic styling (Chrome 139+)

### 📅 TODO

- [ ] Create Storybook documentation
- [ ] Add visual regression tests
- [ ] Document component variants
- [ ] Create Figma design tokens

---

## 🚀 Best Practices

### ✅ DO

1. **Use tokens first** — `var(--pad-md)` not `1rem`
2. **Use utility classes** — `.flex`, `.gap-md`, `.text-primary`
3. **Wrap custom CSS** — `@layer components { }`
4. **Use semantic colors** — `--color-critical` for errors
5. **Respect dark mode** — test both themes
6. **Use CSS nesting** — `&:hover { }`
7. **Test responsive** — mobile, tablet, desktop

### ❌ DON'T

1. **Hard-code values** — no `16px`, `#fff`, etc.
2. **Use media queries for dark mode** — use `light-dark()`
3. **Override computed tokens** — override seed tokens only
4. **Skip focus states** — accessibility built-in
5. **Use Tailwind classes** — removed in Sprint 9

---

## 🔍 Examples

### Timeline Event Card

```svelte
<div class="timeline-event" style="left: {event.time}px;">
  <div class="font-medium">{event.name}</div>
  <div class="text-xs text-muted">{event.duration}ms</div>
</div>
```

### Asset Grid

```svelte
<div class="asset-grid">
  {#each assets as asset}
    <div class="asset-card">
      <div class="asset-preview">{asset.icon}</div>
      <div class="asset-info">
        <div class="asset-name">{asset.name}</div>
        <div class="asset-meta">{asset.type}</div>
      </div>
    </div>
  {/each}
</div>
```

### Properties Panel Form

```svelte
<div class="properties-panel">
  <h2 class="text-lg font-semibold mb-md">Properties</h2>
  
  <div class="form-group">
    <label for="name">Name</label>
    <input id="name" type="text" bind:value={name} />
  </div>
  
  <div class="form-group">
    <label for="duration">Duration (ms)</label>
    <input id="duration" type="number" bind:value={duration} />
  </div>
  
  <div class="flex gap-sm mt-lg">
    <button class="btn btn-primary">Save</button>
    <button class="btn btn-ghost">Cancel</button>
  </div>
</div>
```

---

## 📚 Resources

- **CSS-Base Docs:** `node_modules/@medyll/css-base/README.md`
- **Design Tokens:** `references/tokens.md` (in css-base skill)
- **Demo Skins:** `dist/demo/SKINNING.md` (in css-base skill)
- **Browser Support:** Chrome/Edge 125+ baseline, 139+ for `@function` and `attr()`

---

**Last updated:** 2026-04-21  
**Maintained by:** Design Team  
**Status:** Production Ready ✅
