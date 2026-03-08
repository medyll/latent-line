# Sprint 6 — Sync, Character Editing, Audio Tracks

- sprint_number: 6
- created: 20260308T
- status: ready
- velocity_target: 18 points
- planned_stories:
  - ST-022: Scroll sync (5 pts)
  - ST-023: Character asset inline editing (5 pts)
  - ST-024: Audio timeline lanes (8 pts)

## Sprint Goal

Enhance multi-pane synchronization and enable character/audio asset management in the UI.

## Story Breakdown

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| ST-022 | Scroll sync: Synoptic View ↔ Temporal Sequencer | 5 | ready |
| ST-023 | PropertiesPanel: character asset inline editing | 5 | ready |
| ST-024 | Audio timeline lanes / multi-track view | 8 | ready |

## Critical Path

1. **ST-022** (scroll sync): Context + debounced scroll listeners
2. **ST-023** (character editing): Build on ST-019 PropertiesPanel scaffold
3. **ST-024** (audio tracks): Depends on ST-022 scroll sync; extends temporal sequencer drag logic

## Notes

- ST-022 and ST-023 are independent; ST-024 depends on ST-022
- Estimated 3-4 days (if 5 pts ≈ 1 day)
- All new components require unit tests + E2E for audio lanes

## Dependencies

- Requires completion of: ST-019, ST-021
- Blocked by: None (all blockers resolved in Sprint 5)
