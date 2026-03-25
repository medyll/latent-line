# Technical Specification — Initial

Overview:

- Frontend: Svelte 5 + TypeScript + Vite
- Styling: Tailwind CSS v4 + shadcn-svelte components
- Testing: Vitest (unit) + Playwright (e2e)

Integration points:

- Model validation via Zod in src/lib
- Assets managed by AssetManager in src/lib

Implementation notes:

- Keep shadcn-svelte components unmodified; compose new UI in src/lib/components/app/
- Add CI running `pnpm install && pnpm run test:unit && pnpm run test:e2e` (matrix for node versions)

Next action: create initial sprint and stories, then implement CI and PRD tasks.
