# Copilot / AI agent instructions for latent-line

This file gives concise, repository-specific guidance to help an AI coding agent be productive immediately.

Quick summary
- Repo type: Svelte 5 + Vite SPA, TypeScript project with a validation layer (Zod). Primary UI: `src/`. Model logic and schemas: `src/lib/`.
- Key workflows: `pnpm run dev` (Vite dev), `pnpm exec tsc --noEmit` (type checks), `pnpm test` / `pnpm exec vitest run` (unit tests).

Architecture & intent
- Data model: `Model` is defined in `src/lib/model-types.ts`. The canonical template and runtime validation live in `src/lib/model-template.ts` (`modelSchema`, `buildDefaultModel()`, `createModelTemplate()`).
- UI: Svelte components under `src/` consume `Model` instances (example: `src/lib/ModelInspector.svelte` and `src/App.svelte`).
- Tests: Vitest unit tests (see `src/lib/*.test.ts`) validate the model factory and schema.

Key files to read first
- `src/lib/model-types.ts` — authoritative TypeScript interfaces.
- `src/lib/model-template.ts` — Zod schema and factory; use this for runtime validation and cloning.
- `src/lib/model-example.ts` — a realistic example model used by the UI and tests.
- `src/App.svelte` and `src/main.ts` — SPA bootstrap (Svelte 5 call-style usage).
- `src/lib/*.test.ts` — unit tests demonstrating expected behavior.

Project-specific conventions
- Timeline: `timeline` is an ordered array of `TimelineEvent[]` (not a keyed object). Each event: `{ time: number, frame: TimelineFrame }`. Maintain ascending `time`.
- Asset references: `Actor.id` should match an entry in `assets.characters[].id`.
- Validation: use `modelSchema.safeParse(value)` for runtime checks. Prefer `createModelTemplate()` to get a deep-cloned, editable template.
- IDs: short stable IDs (e.g., `char_01`, `bgm_01`). Avoid using file paths as IDs.

Developer commands (most useful)
- Start dev: `pnpm run dev`
- Type-check: `pnpm exec tsc --noEmit`
- Run tests: `pnpm test` or `pnpm exec vitest run`
- Build: `pnpm run build` / `pnpm run preview`

Integration points & notable deps
- `zod` — runtime validation; refinements (e.g., URL/file checks) are implemented in `src/lib/model-template.ts`.
- `vitest` — unit tests. See `src/lib/*.test.ts` for test patterns and model assertions.
- `tailwindcss` / `postcss` — styling; tests previously required adjusting `postcss.config.cjs` to avoid plugin errors.
- `shadcn-svelte` — optional UI primitives; installation may be required for UI generator tasks.

Known quirks and recent history
- The repo briefly switched between SvelteKit and Vite. You may see backup files: `index.html.vite-backup` and `index.html.restore-from-backup`. The active SPA entrypoint is `index.html` + `src/main.ts`.
- Svelte 5 API: components are invoked as `App({...})` rather than `new App(...)`. `src/main.ts` currently uses `(App as any)(...)` to work around a typing mismatch — refine types if editing bootstrap.
- Be conservative when editing `svelte.config.ts` — switching modes requires updating templates and adapter usage.

How to modify the model safely (examples)
- To create a mutable model for editing:
  ```ts
  import { createModelTemplate } from 'src/lib/model-template'
  const m = createModelTemplate()
  m.project.name = 'my-copy'
  // validate
  import { modelSchema } from 'src/lib/model-template'
  const parsed = modelSchema.safeParse(m)
  ```
- To add a timeline event, push an object with `time:number` and `frame` (see `model-example.ts`). Keep events ordered.

What to test / automatic checks to run before PR
- `pnpm exec tsc --noEmit` — required CI gate for TypeScript correctness.
- `pnpm test` (Vitest) — unit tests for model validation and logic.
- If changing CSS / Tailwind config, run tests locally because PostCSS plugins previously caused test failures.

If you update this document
- Preserve the quick commands section and the mapping between `model-types.ts` and `model-template.ts` — they are the fastest way for a new agent to become productive.

Questions for maintainers (add to PR description)
- Preferred timeline time units (frames vs ms)? Tests assume integers; clarify preferred unit.
- Should `modelSchema` enforce ID uniqueness across assets? If yes, I can add Zod refinements.

End of instructions.
