

# Copilot / AI agent instructions for latent-line

## Quick summary
- **Repo type**: SvelteKit (Svelte 5) + Vite SPA, TypeScript. UI: `src/`. Model logic and schemas: `src/lib/`.
- **Key workflows**:  
	- Dev: `pnpm run dev`  
	- Type-check: `pnpm exec tsc --noEmit`  
	- Test: `pnpm test` (Vitest)

## Architecture & intent
- **Data model**: See `src/lib/model-types.ts`, `src/lib/model-template.ts`, and `src/lib/model-example.ts`.
- **UI**: Svelte components under `src/`.
- **Tests**: Unit tests in `src/lib/*.test.ts` (Vitest).

## IMPORTANT: Never modify components in `src/lib/components` — these are shadcn components and must remain untouched. If you need to customize UI, create new components elsewhere or use composition.

## Project-specific conventions
- **Timeline**: Ordered array of `TimelineEvent[]` (see `GUIDELINES.md` for format and rules).
- **Validation**: Use Zod (`modelSchema.safeParse(value)`).
- **IDs**: Short, stable (e.g., `char_01`). Asset references must match IDs in `assets.characters[]`.
- **Model structure**: See `GUIDELINES.md` for canonical fields, enums, and validation details.

## Developer commands
- Dev: `pnpm run dev`
- Type-check: `pnpm exec tsc --noEmit`
- Test: `pnpm test`
- Build: `pnpm run build`
- Preview: `pnpm run preview`

## Integration points & dependencies
- **Zod**: Runtime validation for models.
- **Vitest**: Unit testing.
- **TailwindCSS/PostCSS**: Styling.
- **shadcn-svelte**: Optional UI primitives.
- **MCP**: Svelte MCP server for documentation and code analysis. shadcn-svelte as MCP tool for UI components.


## SvelteKit/Svelte 5 conventions

For detailed Svelte usage, conventions, and migration tips, see SVELTE.md in the project root.


---

## Svelte MCP integration

Always use the Svelte MCP server for Svelte 5 and SvelteKit documentation, code analysis, and code validation.

- Use the MCP tools as follows:
	- **list-sections**: Run first for any Svelte/SvelteKit question to discover relevant documentation sections.
	- **get-documentation**: Fetch full documentation for all relevant sections after analyzing use_cases.
	- **svelte-autofixer**: Analyze and validate Svelte code before sending to the user. Repeat until no issues remain.
	- **playground-link**: Offer a Svelte Playground link after user confirmation (only if code is not written to files).

Refer to AGENTS.md for detailed MCP tool usage and workflow.


## Svelte 5 snippet and slot conventions

In Svelte 4, content was passed to components using slots. In Svelte 5, slots are deprecated and replaced by snippets, which are more powerful and flexible.

- Layout components should use `{@render children()}` instead of `<slot />`.
- Snippets can be passed as props or defined inside component tags.
- Programmatic snippets can be created with `createRawSnippet` API for advanced use cases.

### Svelte 5 snippet example

```svelte
<script>
	import Table from './Table.svelte';
	const fruits = [
		{ name: 'apples', qty: 5, price: 2 },
		{ name: 'bananas', qty: 10, price: 1 },
		{ name: 'cherries', qty: 20, price: 0.5 }
	];
</script>

{#snippet header()}
	<th>fruit</th>
	<th>qty</th>
	<th>price</th>
	<th>total</th>
{/snippet}

{#snippet row(d)}
	<td>{d.name}</td>
	<td>{d.qty}</td>
	<td>{d.price}</td>
	<td>{d.qty * d.price}</td>
{/snippet}

<Table data={fruits} {header} {row} />
```

Merci de me signaler toute section qui manque de clarté ou d’exemples spécifiques pour que je puisse l’améliorer.
