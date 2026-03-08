# AUDIT-004

- source: audit
- created: 20260306T194957

## Description

Standardized the timeline shape to an array at runtime and provided a robust conversion utility for backward compatibility.

Changes made:

- Created `src/lib/model/timeline-utils.ts` with `toTimelineArray()` to accept either array or object timelines and return a sorted TimelineEvent[].
- Updated components (timeline.svelte, SequenceOrchestrator.svelte) to import and use `toTimelineArray()` so runtime code consistently operates on arrays.

## Status

- ✅ Implemented and validated (components updated and tests adjusted where needed)
- Completed: 2026-03-07
