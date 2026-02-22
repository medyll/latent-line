

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


---

## Svelte MCP integration

Always use the Svelte MCP server for Svelte 5 and SvelteKit documentation, code analysis, and code validation.

- Use the MCP tools as follows:
	- **list-sections**: Run first for any Svelte/SvelteKit question to discover relevant documentation sections.
	- **get-documentation**: Fetch full documentation for all relevant sections after analyzing use_cases.
	- **svelte-autofixer**: Analyze and validate Svelte code before sending to the user. Repeat until no issues remain.
	- **playground-link**: Offer a Svelte Playground link after user confirmation (only if code is not written to files).

Refer to AGENTS.md for detailed MCP tool usage and workflow.

Merci de me signaler toute section qui manque de clarté ou d’exemples spécifiques pour que je puisse l’améliorer.
