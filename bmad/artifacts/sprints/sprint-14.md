# Sprint 14 — Persistence Polish & E2E Coverage

**Date**: 2026-03-23
**Points**: 10
**Status**: active

## Goal

Stabilize persistence layer (in-progress post-v0.2.0 work), add E2E coverage for Sprint 13 features (undo/redo, keyboard shortcuts, asset search), and ship one UX improvement surfaced during v0.2.0 dogfooding.

## Stories

| ID      | Title                                                       | Pts | Status  |
|---------|-------------------------------------------------------------|-----|---------|
| S14-01  | Persistence hardening — commit in-progress fixes + unit tests | 3   | planned |
| S14-02  | E2E: undo/redo + keyboard shortcuts (Ctrl+Z/Y, Ctrl+I)      | 3   | planned |
| S14-03  | E2E: asset search filter (characters/envs/audio)            | 2   | planned |
| S14-04  | UX: playback progress bar — scrub position display + time label | 2   | planned |

## Definition of Done

- S14-01: `persistence.ts` changes committed, error paths covered by unit tests, no console errors on load/save cycle
- S14-02: E2E spec `e2e/undo-shortcuts.spec.ts` — undo/redo state visible in timeline, Ctrl+I toggles inspector
- S14-03: E2E spec `e2e/asset-search.spec.ts` — filter text narrows visible cards, clear resets list
- S14-04: Playback bar shows current time (e.g. `0:03 / 0:45`) that updates during play and on scrub
- All 307 existing unit tests still pass
- No new E2E flakiness (retry: 0 in CI)
