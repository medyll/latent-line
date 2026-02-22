
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

```

---

## 6. Pro Tips (2026)

* **`$state.snapshot()`**: Get a static JS object from a reactive `$state` proxy. Critical when passing data to non-Svelte libs.
* **Events**: No more `createEventDispatcher`. Pass functions as props (e.g., `onclick`, `onupdate`).
* **Performance**: Use `$state.raw` for large lists that you replace entirely rather than mutating elements, as it skips deep proxying.

---