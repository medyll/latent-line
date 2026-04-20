# AGENTS.md — Latent-line

## Project Summary

SvelteKit 5 + Vite SPA for AI-driven story/scene production with timeline editing, asset management, and real-time collaboration.

**Stack:** Svelte 5.55 (runes), SvelteKit 2.55, TypeScript 6, Zod 4, Vitest 4, Playwright 1.58  
**Package manager:** pnpm (required)  
**Dev server port:** 5167 (custom, not default 5173)  
**Collaboration server:** `server/` subdirectory, WebSocket on port 8080

---

## Commands & Order

```bash
pnpm install                          # Install dependencies
pnpm run dev                          # Dev server (http://localhost:5167)
pnpm run lint                         # ESLint + Prettier check
pnpm run format                       # Auto-format
pnpm exec tsc --noEmit                # Type check (or: pnpm run check)
pnpm run test:unit -- --run           # Unit tests (684 tests, must pass)
pnpm run test:e2e                     # E2E tests (Playwright, auto-starts dev server)
pnpm run build && pnpm run preview    # Build + preview
```

**CI order (strict):** lint → i18n check → typecheck → unit tests → coverage → e2e

**Single test file:**
```bash
pnpm run test:unit -- src/lib/model/model-template.test.ts
```

**Coverage report:** `pnpm run test:unit:coverage`

---

## Architecture Boundaries

```
src/lib/
  model/          # Data layer (types, Zod schemas, validation) — pure, testable
  components/app/ # Application components (Timeline, AssetManager, PropertiesPanel)
  components/ui/  # shadcn-svelte primitives — READ ONLY, do not modify
  stores/         # Svelte 5 $state stores
  services/       # Business logic (ComfyUI, export, persistence)
  utils/          # Helpers (import-parser, export handlers)

server/           # Separate WebSocket server for real-time collaboration
  src/index.ts    # WebSocket entry (port 8080)
  src/room-manager.ts
  src/protocol.ts

e2e/              # Playwright E2E tests (16 scenarios)
```

**Key entrypoints:**
- `src/routes/+page.svelte` — Landing page
- `src/routes/app/+page.svelte` — Main editor
- `src/lib/model/model-types.ts` — TypeScript interfaces
- `src/lib/model/model-template.ts` — Zod validation schemas

---

## Critical Conventions

### Svelte 5 Rules
- Use runes exclusively: `$state()`, `$props()`, `$effect()`, `$derived()`
- **NEVER** use `$:` reactive declarations (Svelte 4 anti-pattern)
- Prefer snippets over slots: `{@render children()}`
- Clone state on mutation: `structuredClone()` to prevent shared references

### Data Model
- Timeline events MUST be sorted by ascending `time` (milliseconds)
- Asset IDs must be unique and reference valid entries in `assets.characters[]`
- Path traversal prevention: `isUrlOrFile()` rejects `..` in paths
- Always validate with `modelSchema.safeParse(value)` before persisting

### Styling
- Custom CSS stack (NO Tailwind, removed Sprint 9):
  - `src/styles/theme.css` — CSS vars, `light-dark()` tokens
  - `src/styles/base.css` — root `font-size: 11px`, resets
  - `src/styles/workspace.css` — layout primitives
  - `src/styles/utilities.css` — ~200 utility classes
- Use `color-scheme` property for dark mode (not `.dark` class)

### Testing
- Unit tests: `src/**/*.test.ts` (Vitest, 2 tiers: client browser + server node)
- E2E tests: `e2e/*.spec.ts` (Playwright, auto-starts dev server on 5167)
- Visual regression: `e2e/visual-capture.spec.ts`
  - Update baselines: `--update-snapshots`
  - Snapshots isolated by OS: `{platform}` in path

---

## Quirks & Gotchas

### Dev Server Port
Vite config uses **5167**, not default 5173. Playwright config matches this.

### Workspace Root
Monorepo with `server/` subdirectory. Main app is root; server is separate WebSocket process.

### SvelteKit Sync
Run `svelte-kit sync` before typecheck if `.svelte-kit/` types are stale:
```bash
pnpm run check  # Includes sync
```

### i18n Check
Custom script validates EN/FR key parity:
```bash
pnpm run check:i18n
```

### Browser Tests
Vitest config splits tests into 2 projects:
- `client`: Browser tests (`.svelte.test.ts`) with Playwright + Chromium
- `server`: Node environment tests (everything else)

### Playwright Dev Server
E2E tests auto-start dev server via `webServer` config. Do NOT run `pnpm dev` separately in CI.

### Snapshot Paths
Snapshots are OS-isolated to prevent Linux/Windows conflicts:
```
e2e/__snapshots__/{test}/{arg}-{platform}{ext}
```

---

## Environment & Config

**.env.local** for secrets (see `.env.example`). No hardcoded secrets.

**Key config files:**
- `vite.config.ts` — Test projects, browser config
- `playwright.config.ts` — baseURL: 5167, timeout: 120s, retries: 2
- `tsconfig.json` — Strict mode, bundler resolution
- `bmad/status.yaml` — Sprint tracking, project status

---

## Existing Instruction Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview, architecture diagrams, commands |
| `GUIDELINES.md` | Data model spec, validation rules, timeline format |
| `.github/copilot-instructions.md` | Build/test commands, conventions |
| `bmad/status.yaml` | Sprint progress, roadmap, test counts |
| `docs/USER_GUIDE.md` | End-user documentation |
| `docs/MODEL_SCHEMA.md` | Data model reference |

---

## Common Mistakes to Avoid

1. **Wrong port:** Dev server runs on 5167, not 5173
2. **Svelte 4 syntax:** No `$:` reactive declarations, use `$derived()`
3. **Mutating state directly:** Always clone with `structuredClone()`
4. **Modifying shadcn components:** `src/lib/components/ui/` is read-only
5. **Unsorted timeline:** Events must be ascending by `time`
6. **Skipping svelte-kit sync:** Run before typecheck if types are stale
7. **Tailwind classes:** Removed in Sprint 9, use `utilities.css` instead
8. **Wrong test command:** `test:unit` for Vitest, `test:e2e` for Playwright

---

## Quick Verification Checklist

Before committing:
- [ ] `pnpm run lint` passes
- [ ] `pnpm run check:i18n` passes
- [ ] `pnpm run check` (typecheck) passes
- [ ] `pnpm run test:unit -- --run` passes (684 tests)
- [ ] `pnpm run test:e2e` passes (16 scenarios)

---

_Last updated: 2026-04-20_
