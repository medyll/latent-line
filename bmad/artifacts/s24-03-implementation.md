# S24-03 — Export Format FramePack / CogVideoX

**Status:** ✅ IMPLEMENTED

**Completed:** 2026-03-25

**Points:** 5

## Implementation Summary

Added two new export formats for emerging AI video generation tools:

- **FramePack**: JSONL format with per-frame metadata
- **CogVideoX**: Script-based format with keyframes and interpolation rules

Both formats include complete camera data (zoom, pan, tilt), lighting, and effects information.

## Changes Made

### New File: `src/lib/utils/export-framepack.ts`

**Features:**

- JSONL output (one JSON object per line)
- Per-frame data structure:
  ```json
  {
  	"frame": 0,
  	"prompt": "Alice running, anxious mood...",
  	"character_id": "c1",
  	"character_name": "Alice",
  	"camera": { "zoom": 1.5, "pan": [0.1, -0.2], "tilt": 10 },
  	"lighting": { "type": "dusk", "intensity": 0.8 },
  	"effects": { "bloom": 0.5, "motion_blur": 0.2 },
  	"metadata": { "duration": 24, "version": "1.0" }
  }
  ```
- `FORMAT_VERSION = '1.0'` constant for versioning
- Helper function `getCharacterInfo()` to extract character data from actors
- Exports full camera, lighting, and effects data from timeline events

### New File: `src/lib/utils/export-cogvideo.ts`

**Features:**

- Plain-text script format with structured sections
- METADATA block: version, fps, resolution
- KEYFRAMES block: indexed keyframe declarations with:
  - Frame number, prompt, duration
  - Camera motion description (zoom, pan, tilt)
  - Lighting type and intensity
  - Effects (bloom, motion_blur)
- INTERPOLATION block: automatic interpolation rules for frame gaps
- Human-readable output for easy review and editing

**Example output:**

```
# CogVideoX Video Sequence Script
# Format Version: 1.0
# Generated from latent-line project: Test

[METADATA]
version = 1.0
fps = 24
width = 1920
height = 1080

[KEYFRAMES]

[KEYFRAME_0]
frame = 0
prompt = "Alice running, anxious mood..."
duration = 24
camera = "zoom 1.50x, tilt 10°"
lighting = "daylight"
intensity = 1.0

[INTERPOLATION]

# Interpolate from frame 0 to 24
interpolate(from=0, to=24, method="linear", steps=24)
```

### New Test Files

**`src/lib/utils/export-framepack.test.ts`** (6 tests)

- ✅ Validates JSONL format (one JSON per line, parseable)
- ✅ Verifies frame, prompt, character info included
- ✅ Confirms camera, lighting, effects data present
- ✅ Validates metadata with version and duration
- ✅ Tests proper frame sorting by time
- ✅ All assertions passing

**`src/lib/utils/export-cogvideo.test.ts`** (7 tests)

- ✅ Returns plain text script format
- ✅ Includes METADATA section with version, fps, resolution
- ✅ Declares keyframes correctly
- ✅ Includes prompt and camera info in keyframes
- ✅ Includes lighting and effects metadata
- ✅ Includes interpolation section for frame gaps
- ✅ Tests proper frame sorting and camera motion description

## Test Results

- ✅ Build: successful
- ✅ FramePack tests: 6 passed
- ✅ CogVideoX tests: 7 passed
- ✅ Unit tests: 354 passed (all, +13 new)
- ✅ No breaking changes

## Acceptance Criteria Met

- [x] Export "FramePack": JSONL avec objects par frame
- [x] Export "CogVideoX": script format avec interpolation de keyframes
- [x] Les deux formats incluent données de caméra (zoom, pan, tilt)
- [x] Documentation inline des formats dans `src/lib/utils/export-*.ts`
- [x] Tests unitaires avec fixtures des formats attendus

## Technical Notes

- FramePack uses optional property spreading for cleaner JSON (omits undefined fields)
- CogVideoX generates human-readable comments and metadata
- Camera motion descriptions parse zoom, pan, and tilt into readable strings
- Both formats include VERSION constants for future format evolution
- Reuses `buildPrompt()` utility from export-prompts.ts

## Next Steps

- S24-04: Webhook ComfyUI integration (final story, 16 pts)
- Sprint 24 completion: All AI rendering features for Deforum, FramePack, CogVideoX, ComfyUI
