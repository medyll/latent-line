# Sprint 10 — Playback & Export

**Date**: 2026-03-17
**Points**: 10
**Status**: active

## Goal

Deliver the last MVP feature (timeline playback preview) and round-trip JSON import/export, making the tool fully self-contained for content creators.

## Stories

| ID     | Title                                             | Pts | Status  |
|--------|---------------------------------------------------|-----|---------|
| S10-01 | Playback engine — play/pause/scrub + animated playhead | 5   | planned |
| S10-02 | Export timeline JSON to file download              | 3   | planned |
| S10-03 | Import timeline JSON from file                     | 2   | planned |

## Definition of Done (no tests)

- Playhead moves in real-time when playing, scrubs on click/drag in TemporalSequencer
- Play/pause/stop controls in SystemFooter or dedicated PlaybackBar
- Export: clicking "Export" downloads `timeline.json` with the current Model
- Import: file picker accepts `.json`, parses + validates with Zod, replaces current model
- No regressions in existing unit tests (218 passing)
