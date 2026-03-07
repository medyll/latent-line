# Copilot Instructions for Latent-line

## Build, Test, and Lint Commands

- **Install dependencies:** `pnpm install`
- **Development server:** `pnpm run dev` (http://localhost:5173)
- **Type checking:** `pnpm exec tsc --noEmit`
- **Lint:** `pnpm run lint` (ESLint + Prettier)
- **Format:** `pnpm run format`
- **Build:** `pnpm run build`
- **Preview:** `pnpm run preview`
- **Unit tests:** `pnpm run test:unit` (Vitest)
- **Single test file:** `pnpm run test:unit -- path/to/test.test.ts`
- **E2E tests:** `pnpm run test:e2e` (Playwright)

## High-Level Architecture

- **TypeScript + SvelteKit (Svelte 5) + Vite SPA**
- **UI:** Svelte components in `src/` (app-specific in `src/lib/components/app/`, primitives in `src/lib/components/ui/`)
- **Data Model:** Defined in `src/lib/model-types.ts`, validated with Zod in `src/lib/model-template.ts`, example in `src/lib/model-example.ts`
- **Timeline:** Ordered array of `TimelineEvent[]` (see `GUIDELINES.md` for format and rules)
- **Assets:** Characters, environments, audio managed via AssetManager
- **Tests:** Unit tests in `src/lib/model/*.test.ts`, E2E in `e2e/`
- **MCP Integration:** Svelte MCP server for Svelte 5/SvelteKit docs and code analysis; shadcn-svelte for UI primitives

## Key Conventions

- **Never modify components in `src/lib/components`** (shadcn-svelte primitives; use composition for custom UI)
- **Timeline events:** Must be ordered by ascending `time`; only include fields that change at each event
- **IDs:** Use short, stable IDs (e.g., `char_01`); asset references must match IDs in `assets.characters[]`
- **Validation:** Always validate models with `modelSchema.safeParse(value)`; use `createModelTemplate()` for deep cloning
- **Svelte 5:** Use runes (`$state`, `$props`, `$effect`), snippets instead of slots, and `{@render children()}` for layout
- **Styling:** Tailwind CSS v4, strict adherence to spacing, breakpoints, palette; avoid centered layouts, gradients, and generic cards
- **Security:** Asset URLs validated with `isUrlOrFile()` (rejects `..`), no hardcoded secrets, use `.env.local` for environment variables
- **Accessibility:** Keyboard navigation, explicit labels, complete interactive states

## Reference Documents

- `README.md`: Project overview, architecture, and commands
- `GUIDELINES.md`: Canonical model structure, enums, validation rules
- `SVELTE.md`: Svelte 5 conventions, runes, snippets
- `AGENTS.md`: MCP tool usage for documentation and code analysis

---

For SvelteKit/Svelte 5, always use the Svelte MCP server for documentation, code analysis, and validation. See `AGENTS.md` for workflow details.

---

_Last updated: 2026-03-06_
