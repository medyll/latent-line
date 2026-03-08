# Product Requirements Document (PRD) — v1

Project: latent-line
Version: 0.1 (PRD)

Overview
A compact Svelte 5 application to author, validate, and preview ordered timeline models used by the product. Focus on correctness of model validation, a minimal but usable UI, and reliable tests so downstream feature work is safe.

Users
- Content creators who assemble timelines
- Developers validating timeline models for integration

MVP Features
- Model validation library (Zod) and example templates
- Timeline editor UI (create/edit events, reorder by time)
- Live preview of timeline playback (basic)
- Unit tests for model validation and utilities
- One E2E test to verify app boots and renders a sample timeline

User Stories (high level)
- As a creator, I can add timeline events with time and frame changes.
- As a developer, I can validate a timeline JSON against the model schema.
- As a tester, I can run unit and E2E suites that validate core behavior.

Non-functional Requirements
- Type-safe (TypeScript strict)
- Accessible (keyboard navigation for editor lists)
- Fast local test runs (<60s for unit suite)

Acceptance Criteria
- modelSchema.safeParse(exampleModel) returns success for provided examples
- `pnpm run test:unit` exits 0 locally
- Playwright E2E verifies app loads and displays a sample timeline

Milestones / Next Steps
1. Finalize PRD and create sprint (bmad sprint)
2. Add CI to run lint/typecheck/unit/e2e (story: add-ci)
3. Implement model validation tests and example models

Stakeholders
- Product: Mydde (owner)
- Engineering: repo maintainers

Success Metrics
- All unit tests pass in CI
- PRD acceptance criteria covered by tests

Notes
- Keep shadcn-svelte primitives unmodified; compose UI in src/lib/components/app/

Next action: bmad sprint