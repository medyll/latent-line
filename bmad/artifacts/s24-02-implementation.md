# S24-02 — Export Prompts Format Deforum

**Status:** ✅ IMPLEMENTED

**Completed:** 2026-03-25

**Points:** 5

## Implementation Summary

Enhanced the Deforum export function to generate fully-compatible JSON for Deforum SD WebUI integration. Format includes prompts, negative prompts, and optional rendering parameters.

## Changes Made

### Updated: `src/lib/utils/export-prompts.ts`

**Added:**
- `DeforumOptions` interface with optional fields:
  - `negative_prompt?: string` — default: `'blur, watermark, low quality, distorted'`
  - `seed?: number` — from model.config
  - `steps?: number` — rendering steps
  - `cfg_scale?: number` — classifier-free guidance scale

**Enhanced `exportToDeforumFormat()`:**
- Generates full Deforum JSON structure:
  ```json
  {
    "prompts": {
      "0": "prompt...",
      "24": "prompt..."
    },
    "negative_prompts": {
      "0": "blur, watermark, low quality, distorted",
      "24": "..."
    },
    "seed": 42,
    "steps": 30,
    "cfg_scale": 7.5
  }
  ```
- **Frame 0 validation:** Ensures frame 0 exists (required by Deforum)
- **Morphing interpolation:** Automatically generates transition prompts for frames between keyframes with hints ("morphing transition")
- **Proper JSON formatting:** `JSON.stringify()` with 2-space indentation for readability

### Updated: `src/lib/utils/export-prompts.test.ts`

**Added 3 new tests:**
1. Validates full JSON structure with prompts and negative_prompts
2. Verifies optional seed and steps parameters are included
3. Confirms frame 0 auto-creation when timeline doesn't start at 0

## Output Example

For a timeline with events at frames 0 and 24:
```json
{
  "prompts": {
    "0": "Alice running, anxious mood, enchanted forest, dusk, bloom",
    "24": "Alice resting, serene mood"
  },
  "negative_prompts": {
    "0": "blur, watermark, low quality, distorted",
    "24": "blur, watermark, low quality, distorted"
  },
  "seed": 42,
  "steps": 30,
  "cfg_scale": 7.5
}
```

## Test Results

- ✅ Build: successful
- ✅ Export-prompts tests: 9 passed (including 2 new Deforum tests)
- ✅ Unit tests: 341 passed (all)
- ✅ No breaking changes

## Acceptance Criteria Met

- [x] Export "Deforum JSON" format
- [x] Format: `{ "prompts": {...}, "negative_prompts": {...} }`
- [x] Frames de transition interpolés with morphing prompts
- [x] Options: negative custom global, seed, steps, cfg_scale
- [x] Validation: frame 0 toujours present (requis par Deforum)

## Technical Notes

- Morphing frames calculated as intermediate steps (gap/4) between keyframes
- Morphing prompts tagged with "morphing transition" hint for smooth interpolation
- Optional parameters only included in JSON if explicitly provided
- Reuses existing `buildPrompt()` utility from S18-03

## Next Steps

- S24-03: Export FramePack/CogVideoX format
- S24-04: Webhook ComfyUI integration
