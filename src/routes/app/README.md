## Snippet Usage & Design Rules

### Svelte 5 Snippet Conventions

- Use `{#snippet ...}` blocks for content injection.
- Layout components must use `{@render children()}` instead of slots.
- Pass snippets as props or define inline.
- Example:

```svelte
{#snippet header()}
	<th>Asset</th>
	<th>ID</th>
{/snippet}

{#snippet row(asset)}
	<td>{asset.name}</td>
	<td>{asset.id}</td>
{/snippet}

<Table data={assets} {header} {row} />
```

### Design Rules (Taste-Skill)

- Compose UI using shadcn-svelte primitives, never modify them directly.
- Use theme variables for color, spacing, and radius.
- Enforce deterministic typography (Geist, Satoshi, Cabinet Grotesk).
- Ban Inter font, AI purple/blue, and generic cards.
- Implement full interaction cycles: loading, empty, error, tactile feedback.
- Apply micro-animations and spring physics for premium feel.
- Use `@lucide/svelte` for icons, standardized strokeWidth.
- Animate only via transform/opacity, minimize DOM cost, avoid z-index spam.
