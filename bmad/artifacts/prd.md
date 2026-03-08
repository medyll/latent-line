# Product Requirements Document (PRD) — Minimal

Project: latent-line
Objective: Provide a small Svelte 5 app for timeline orchestration with validated model templates and predictable testing.

Key features (MVP):
- Timeline model validation with Zod
- UI to author timeline events and preview
- Unit tests covering model validation and core utilities
- E2E test ensuring basic app load and timeline render

Acceptance criteria:
- modelSchema.safeParse passes for example models
- Unit tests run and pass locally with `pnpm run test:unit`
- Basic E2E Playwright test passes in CI

Notes:
- Use existing model templates in src/lib for examples and tests.

Next action: bmad dev story prd-create
