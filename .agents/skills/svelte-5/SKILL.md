## ⚠️ Anti-Regression: No $variable Reactivity in Svelte 5

**Do NOT use `$variable` (e.g., `$loading`, `$user`) for reactivity in Svelte 5.**

- Svelte 5 does NOT use the `$`-prefix variable pattern from Svelte 3/4 for reactive values.
- All reactivity must use runes: `$state`, `$derived`, `$props`, etc.
- Example (correct):
  ```ts
  let loading = $state(false); // NOT $loading
  ```
- Example (incorrect):
  ```ts
  if ($loading) { ... } // ❌ INVALID in Svelte 5
  ```

**Always use the variable name directly (e.g., `loading`, `user`) and mutate via runes.**

> This rule must be enforced in all code, documentation, and reviews to prevent Svelte 3/4 regression errors.

# Svelte 5 & SvelteKit Developer Skill

This skill is a complete, detailed guide for developing with Svelte 5 and SvelteKit, strictly based on the full content of SVELTE.md (2026 Edition). It covers all runes, advanced snippet patterns, routing, data loading, typing, performance, and migration, with practical examples and pro tips.

---

## 1. Core Runes & TypeScript Typing

Svelte 5 uses runes for reactivity and TypeScript for robust state management.

| Rune | Purpose | Example |
| --- | --- | --- |
| `$state(v)` | Deep reactive state | `let count = $state<number>(0);` |
| `$state.raw(v)` | Shallow reactivity (perf) | `let logs = $state.raw<string[]>([])` |
| `$derived(exp)` | Computed values | `const double = $derived(count * 2)` |
| `$derived.by(fn)` | Complex/async derived | `const user = $derived.by(() => fetchUser(id))` |
| `$props()` | Component inputs | `let { name }: { name: string } = $props();` |
| `$bindable()` | Two-way binding prop | `let { value = $bindable() } = $props();` |

### Detailed `$state` Examples

```typescript
// Primitives
let theme = $state<'light' | 'dark'>('light');

// Deeply reactive objects
interface User {
  name: string;
  settings: { notifications: boolean };
}
let user = $state<User>({ name: 'Mydde', settings: { notifications: true } });
const toggleNotify = () => { user.settings.notifications = !user.settings.notifications; };

// Arrays
let items = $state<number[]>([1, 2, 3]);
const addItem = () => items.push(items.length + 1);
```

---

## 2. Component Structure & Snippets

Svelte 5 replaces slots with snippets and uses function-like prop declarations.

**Children snippet in a layout/component:**

```svelte
<script lang="ts">
  let { children } = $props();
</script>
<button>{@render children()}</button>
```

**Props, state, and events:**

```svelte
<script lang="ts">
  interface Props {
    title: string;
    children?: import('svelte').Snippet;
    onUpdate?: (val: number) => void;
  }
  let { title, children, onUpdate }: Props = $props();
  let count = $state(0);
  const increment = () => { count++; onUpdate?.(count); };
</script>
<h1>{title}</h1>
<button onclick={increment}>Count: {count}</button>
{@render children?.()}
```

---

## 3. SvelteKit Routing & File Roles

SvelteKit routing is file-system based in `src/routes/`.

- `+layout.svelte`: Shared wrapper (navbar/sidebar). Must render `{@render children()}`.
- `+page.svelte`: Route view for a specific URL.
- `+error.svelte`: Error boundary.
- `+page.server.ts`: Server-only logic (SQL, private APIs).
- `+page.ts`: Universal logic (hydration-ready data fetching).
- `+server.ts`: API endpoint (raw HTTP methods).

**Directory Example:**

```text
src/routes/
├── +layout.svelte
├── +page.svelte
├── dashboard/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── [id]/
│       ├── +page.svelte
│       └── +page.ts
└── (auth)/
    └── login/
        └── +page.svelte
```

---

## 4. Modern Data Patterns

### Server Loaders (with Typing)

```typescript
// src/routes/profile/+page.server.ts
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

### Server Actions

```typescript
// src/routes/settings/+page.server.ts
export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    // ...logic
    return { success: true };
  }
};
```

---

## 5. Advanced Svelte 5 Snippets & Logic

### Generative List with Internal Logic

```svelte
<script lang="ts" generics="T extends { id: string; status: string }">
  import { Snippet } from 'svelte';
  interface Props {
    items: T[];
    row: Snippet<[item: T, controls: { remove: () => void }]>;
  }
  let { items, row }: Props = $props();
  let list = $state(items);
</script>
<ul>
  {#each list as item (item.id)}
    {@render row(item, { remove: () => list = list.filter(i => i.id !== item.id) })}
  {/each}
</ul>
```

### Higher-Order Snippets (Snippet Composition)

```svelte
{#snippet icon(name: string)}
  <i class="icon-{name}"></i>
{/snippet}

{#snippet button(label: string, iconSnippet: Snippet<[string]>) }
  <button>
    {@render iconSnippet('check')}
    {label}
  </button>
{/snippet}

{@render button("Submit", icon)}
```

### Snippets for Layout "Slots" with Typing

```svelte
<script lang="ts">
  import { Snippet } from 'svelte';
  interface DashboardProps {
    sidebar: Snippet;
    content: Snippet<[user: string]>;
    footer?: Snippet;
  }
  let { sidebar, content, footer }: DashboardProps = $props();
  let currentUser = $state("Mydde");
</script>
<div class="layout">
  <aside>{@render sidebar()}</aside>
  <main>{@render content(currentUser)}</main>
  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</div>
```

### Recursive Snippets (Tree Pattern)

```svelte
<script lang="ts">
  interface FileNode {
    name: string;
    children?: FileNode[];
  }
  let files = $state<FileNode[]>([
    { name: 'src', children: [{ name: 'app.svelte' }, { name: 'lib' }] }
  ]);
</script>
{#snippet tree(nodes: FileNode[])}
  <ul>
    {#each nodes as node}
      <li>
        {node.name}
        {#if node.children}
          {@render tree(node.children)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}
{@render tree(files)}
```

---

## 6. Performance & Constraints

- **No `this` context**: Snippets are pure template blocks.
- **Lexical scoping**: Snippets can access variables in their definition scope, but explicit arguments are preferred.
- **Typing**: Always use `import type { Snippet } from 'svelte'` for snippet props. For multiple args, use tuples: `Snippet<[string, number]>`.
- **Use `$state.raw`** for large lists you replace entirely (skips deep proxying).

---


## 7. Pro Tips (2026)

- `$state.snapshot()`: Get a static JS object from a reactive `$state` proxy (for non-Svelte libs).
- **Events**: No more `createEventDispatcher`. Pass functions as props (e.g., `onclick`, `onupdate`).
- **Do NOT use `on:click` or any `on:event` directive**: All `on:event` directives are deprecated in Svelte 5. Use event attributes like `onclick`, `onchange`, etc., directly on elements or pass them as props.
- **Prefer runes** for all local reactivity.

---

## 8. Migration Svelte 4 → 5

- Replace all `<slot />` with snippets and `{@render}`.
- Migrate all reactivity to runes.
- Adapt layouts and pages to the new structure.

---

## 9. Testing

- Use Vitest for unit tests.
- Test Svelte components with snippet mocks if needed.

---

## 10. MCP Integration

- Use the Svelte MCP server for documentation, code analysis, and Svelte 5 code validation.
- Always validate Svelte code with the MCP autofixer before delivery.

---

## 11. Useful Commands

- Start dev server: `pnpm run dev`
- Type-check: `pnpm exec tsc --noEmit`
- Test: `pnpm test`

---

## 12. Internal References

- See SVELTE.md for detailed project conventions.
- See AGENTS.md for MCP integration.

---

**Use this skill for all Svelte 5 development, refactoring, or code review in this project.**
