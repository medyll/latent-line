# Changelog

All notable changes to this project will be documented in this file.

---

## [0.2.0] — 2026-03-20

### Sprint 13 — Ergonomie & Playback

- **Undo/Redo** (S13-01): Ctrl+Z / Ctrl+Y — historique snapshots, 50 entrées, isolation structuredClone
- **Keyboard shortcuts** (S13-02): registre centralisé — Ctrl+Z/Y, Ctrl+I inspector, Space play/pause, Escape stop
- **Asset search** (S13-03): filtre temps réel sur characters/environments/audio (name, prompt, label, url)
- **Playback engine** (S13-04): module pur `playback.ts` — tickFrame, clampFrame, seekFromPixel, computeDuration

### Sprint 12 — MVP Viable

- **localStorage persistence** (S12-01): auto-save/restore du modèle au rechargement
- **Export JSON** (S12-02): `serializeModel()` — validation Zod avant téléchargement
- **Import JSON** (S12-03): `deserializeModel()` — round-trip complet export→import
- **Settings panel** (S12-04): validation config (checkpoint, sampler, seed, tts_engine, audioLanes)

### Infrastructure & Quality

- Vitest alias fix: plugin `sveltekit()` dans `vitest.config.ts`
- Audit rapport: 76.92% coverage, 0 vulnérabilités production
- 5 diagrammes Mermaid dans README (architecture, components, timeline, roadmap, validation)
- npm dependencies rebuilt (655 packages, clean install)

### Tests

- **292 unit tests** passing (was 223 at v0.1.0, +69 nouveaux)
- 24 test files
- Couverture: 76.92% statements, 80.2% lines

---

## [0.1.0] — 2026-03-17

### Sprints 1–11

- Core SvelteKit app: routes, components, model layer (Zod)
- AssetManager, PropertiesPanel, SequenceOrchestrator, AudioTimeline, ModelInspector
- Scroll sync, playhead, drag-to-reorder events
- CI/CD: GitHub Actions, Playwright E2E, visual regression
- CSS stack custom (theme/base/workspace/utilities) — Tailwind removed
- 223 unit tests, 28 E2E tests
