# CSS-Base Quick Reference — Latent-line

## 🎨 Colors

```css
/* Brand */
--color-primary          /* Purple-violet (our brand) */

/* Semantic */
--color-success          /* Green */
--color-warning          /* Amber */
--color-critical         /* Red (use for errors) */
--color-info             /* Blue */

/* Surfaces */
--color-surface          /* Page background */
--color-surface-alt      /* Sidebar/alternate */
--color-surface-raised   /* Cards, elevated */
--color-surface-hover    /* Hover states */
--color-surface-active   /* Active states */
--color-surface-overlay  /* Modals, overlays */
--color-surface-sunken   /* Inset areas */

/* Text */
--color-text             /* Primary text */
--color-text-muted       /* Secondary text */

/* Borders */
--color-border           /* Default borders */
--color-border-strong    /* Emphasized borders */
```

## 📏 Spacing (4px grid)

```css
--gap-xs / --pad-xs / --marg-xs      /* 4px */
--gap-sm / --pad-sm / --marg-sm      /* 8px */
--gap-md / --pad-md / --marg-md      /* 16px */
--gap-lg / --pad-lg / --marg-lg      /* 24px */
--gap-xl / --pad-xl / --marg-xl      /* 32px */
--gap-2xl / --pad-2xl / --marg-2xl   /* 48px */
--gap-3xl / --pad-3xl / --marg-3xl   /* 64px */
```

## 📝 Typography

```css
/* Sizes */
--text-xs    /* 11px */
--text-sm    /* 13px */
--text-md    /* 16px - default */
--text-lg    /* 18px */
--text-xl    /* 20px */
--text-2xl   /* 24px */

/* Weights */
--font-normal    /* 400 */
--font-medium    /* 500 */
--font-semibold  /* 600 */
--font-bold      /* 700 */

/* Line heights */
--leading-none     /* 1.0 */
--leading-tight    /* 1.25 */
--leading-normal   /* 1.5 */
--leading-relaxed  /* 1.75 */
--leading-loose    /* 2.0 */

/* Families */
--font-sans    /* system-ui, sans-serif */
--font-mono    /* monospace */
--font-serif   /* serif */
```

## 🔲 Borders & Radius

```css
/* Radius */
--radius-xs    /* 2px */
--radius-sm    /* 4px */
--radius-md    /* 6px */
--radius-lg    /* 8px */
--radius-xl    /* 12px */
--radius-2xl   /* 16px */
--radius-full  /* 9999px (pills, circles) */

/* Border width */
--border-width  /* Default border width */
```

## 🌑 Shadows

```css
--shadow-xs    /* Subtle */
--shadow-sm    /* Small */
--shadow-md    /* Medium (cards) */
--shadow-lg    /* Large (modals) */
--shadow-xl    /* Extra large */
--shadow-2xl   /* Maximum */
```

## ⚡ Motion

```css
--duration-fast    /* 100ms */
--duration-normal  /* 150ms - default */
--duration-slow    /* 300ms */

--transition-base  /* Default transition */
```

## 🎯 Common Patterns

### Button
```html
<button class="btn btn-primary">Click me</button>
<button class="icon-btn" aria-label="Settings">⚙</button>
```

### Card
```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Actions</div>
</div>
```

### Badge
```html
<span class="badge badge-primary">New</span>
```

### Alert
```html
<div class="alert alert-success">Success!</div>
```

### Form
```html
<div class="form-group">
  <label for="input">Label</label>
  <input id="input" type="text" />
</div>
```

## 📱 Responsive Utilities

```html
<div class="hide-mobile">Desktop only</div>
<div class="hide-desktop">Mobile only</div>

<div class="flex flex-col md:flex-row">Responsive stack</div>
```

## 🎭 Dark Mode

```js
// Auto (default)
document.documentElement.removeAttribute('data-theme');

// Force dark
document.documentElement.setAttribute('data-theme', 'dark');

// Force light
document.documentElement.setAttribute('data-theme', 'light');
```

## 🔧 Layout Classes

```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-md">...</div>
<div class="flex-col">...</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-md">...</div>

<!-- Spacing -->
<div class="p-md gap-md space-y-md">...</div>

<!-- Sizing -->
<div class="w-full h-full">...</div>
```

---

**Full docs:** `node_modules/@medyll/css-base/README.md`
