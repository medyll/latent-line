
# Svelte 5 & SvelteKit Cheat Sheet (2026 Edition)

## 1. Core Runes & TypeScript Typing

Runes replace legacy reactivity with a signal-based approach. Use TypeScript interfaces for robust state management.

| Rune | Purpose | Example |
| --- | --- | --- |
| **`$state(v)`** | Deep reactive state. | `let count = $state<number>(0);` |
| **`$state.raw(v)`** | Shallow reactivity (performance). | `let logs = $state.raw<string[]>([]);` |
| **`$derived(exp)`** | Computed values. | `const double = $derived(count * 2);` |
| **`$derived.by(fn)`** | Complex logic/Async. | `const user = $derived.by(() => fetchUser(id));` |
| **`$props()`** | Component inputs. | `let { name }: { name: string } = $props();` |
| **`$bindable()`** | Two-way binding prop. | `let { value = $bindable() } = $props();` |

### Detailed `$state` Examples

```typescript
// Simple primitives
let theme = $state<'light' | 'dark'>('light');

// Objects (Deeply reactive)
interface User {
  name: string;
  settings: { notifications: boolean };
}

let user = $state<User>({
  name: 'Mydde',
  settings: { notifications: true }
});

// Updating nested properties just works:
const toggleNotify = () => {
  user.settings.notifications = !user.settings.notifications;
};

// Arrays
let items = $state<number[]>([1, 2, 3]);
const addItem = () => items.push(items.length + 1); // Mutating triggers update

```

---


## 2. Component Structure

Svelte 5 uses a function-like prop declaration and Snippets for templating.

**To access the children snippet in a layout or component, use:**

```svelte
<script lang="ts">
    let { children } = $props();
</script>

<button>{@render children()}</button>
```

```svelte
<script lang="ts">
  interface Props {
    title: string;
    children?: import('svelte').Snippet;
    onUpdate?: (val: number) => void;
  }

  // Destructuring with types and defaults
  let { title, children, onUpdate }: Props = $props();
  
  let count = $state(0);

  const increment = () => {
    count++;
    onUpdate?.(count);
  };
</script>

<h1>{title}</h1>
<button onclick={increment}>Count: {count}</button>

{@render children?.()}

```

---

## 3. SvelteKit Routing & File Roles

SvelteKit routing is file-system based within `src/routes/`.

### UI Components

* **`+layout.svelte`**: **Shared Wrapper**. Persists UI (Nav/Sidebar) across route changes.
* *Must render* `{@render children()}`.


* **`+page.svelte`**: **Route View**. Unique UI for a specific URL.
* **`+error.svelte`**: **Error Boundary**. Rendered when a route fails.

### Logic & Data Loading

* **`+page.server.ts`**: **Server-only** logic (SQL, Private APIs).
* **`+page.ts`**: **Universal** logic (Hydration-ready data fetching).
* **`+server.ts`**: **API Endpoint**. Handles raw HTTP methods (GET, POST).

---

## 4. SvelteKit Directory Example

```text
src/routes/
├── +layout.svelte       <-- Global layout (Navbar)
├── +page.svelte         <-- /
├── dashboard/
│   ├── +layout.svelte   <-- Dashboard-specific layout
│   ├── +page.svelte     <-- /dashboard
│   └── [id]/
│       ├── +page.svelte <-- /dashboard/123 (Dynamic)
│       └── +page.ts     <-- Loader for the ID
└── (auth)/              <-- Group (no URL impact)
    └── login/
        └── +page.svelte <-- /login

```

---

## 5. Modern Data Patterns

### Server Loaders (Typing)

```typescript
// src/routes/profile/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    user: locals.user // Strongly typed data passed to +page.svelte
  };
};

```

### Server Actions

Handled via standard HTML forms or `use:enhance`.

```typescript
// src/routes/settings/+page.server.ts
export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    // Logic...
    return { success: true };
  }
};


---

## 6. Pro Tips (2026)

* **`$state.snapshot()`**: Get a static JS object from a reactive `$state` proxy. Critical when passing data to non-Svelte libs.
* **Events**: No more `createEventDispatcher`. Pass functions as props (e.g., `onclick`, `onupdate`).
* **Performance**: Use `$state.raw` for large lists that you replace entirely rather than mutating elements, as it skips deep proxying.

---

# Advanced Svelte 5 Snippets & Logic

### 1. Generative List with Internal Logic

Snippets are not just for UI; they can accept parameters to handle scoped logic without creating a separate component file.

```svelte
<script lang="ts" generics="T extends { id: string; status: string }">
  import { Snippet } from 'svelte';

  interface Props {
    items: T[];
    // Typed snippet taking an item and a 'control' object
    row: Snippet<[item: T, controls: { remove: () => void }]>;
  }

  let { items, row }: Props = $props();
  let list = $state(items);
</script>

<ul>
  {#each list as item (item.id)}
    {@render row(item, {
      remove: () => list = list.filter(i => i.id !== item.id)
    })}
  {/each}
</ul>

```

### 2. Higher-Order Snippets (Snippet Composition)

You can pass snippets to other snippets. This is the Svelte 5 way to handle complex "Render Props".

```svelte
{#snippet icon(name: string)}
  <i class="icon-{name}"></i>
{/snippet}

{#snippet button(label: string, iconSnippet: Snippet<[string]>)}
  <button>
    {@render iconSnippet('check')}
    {label}
  </button>
{/snippet}

{@render button("Submit", icon)}

```

### 3. Snippets for Layout "Slots" with Typing

Replacing the old named slots. This pattern is essential for complex Dashboards.

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
  
  <main>
    {@render content(currentUser)}
  </main>

  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</div>

```

---

## Recursive Snippets (The "Tree" Pattern)

Since snippets can call themselves, they are perfect for recursive structures like file explorers or nested menus.

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

## 4. Performance & Constraints

* **No `this` context**: Unlike functions, snippets don't have a `this` context. They are pure template blocks.
* **Lexical Scoping**: Snippets can access variables in the scope where they are defined, but they are most powerful when data is passed explicitly via arguments.
* **Typing**: Always use `import type { Snippet } from 'svelte'` to type your props. For multiple arguments, use a tuple: `Snippet<[string, number, boolean]>`.
