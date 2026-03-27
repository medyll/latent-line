# Latent-line Model Schema Reference

**Version:** 0.5.0  
**Last Updated:** 2026-03-27

---

## Table of Contents

1. [Overview](#overview)
2. [Root Model](#root-model)
3. [Project](#project)
4. [Assets](#assets)
5. [Timeline](#timeline)
6. [Config](#config)
7. [Validation Rules](#validation-rules)
8. [Examples](#examples)

---

## Overview

The Latent-line model is a TypeScript interface validated by Zod schemas. All models must conform to this schema for import/export operations.

**TypeScript Definition:** `src/lib/model/model-types.ts`  
**Zod Schema:** `src/lib/model/model-template.ts`

---

## Root Model

```typescript
interface Model {
  project: Project;       // Project metadata
  assets: Assets;         // Character, environment, audio assets
  timeline: TimelineEvent[]; // Array of timeline events
  config: Config;         // Rendering configuration
  markers?: Marker[];     // Optional timeline markers
}
```

---

## Project

Project-level metadata and settings.

```typescript
interface Project {
  name: string;           // Project name
  fps: number;            // Frames per second (1-240)
  resolution: {
    w: number;            // Width in pixels
    h: number;            // Height in pixels
  };
}
```

**Validation:**
- `fps`: Integer, 1–240
- `resolution.w`: Positive integer
- `resolution.h`: Positive integer

**Example:**

```json
{
  "project": {
    "name": "My Animation",
    "fps": 24,
    "resolution": { "w": 1920, "h": 1080 }
  }
}
```

---

## Assets

Collections of reusable assets referenced by timeline events.

```typescript
interface Assets {
  characters: Character[];     // Character definitions
  environments: Record<string, EnvironmentAsset>; // Environment definitions
  audio: AudioAsset[];         // Audio file references
}
```

### Character

```typescript
interface Character {
  id: string;                  // Unique identifier (e.g., "char_01")
  name: string;                // Display name
  voice_id?: string;           // TTS voice identifier
  references: Reference[];     // Reference images
  outfits?: Record<string, Outfit>; // Outfit variations
}

interface Reference {
  url: string;                 // Image URL or local path
  context: string;             // Usage context (e.g., "face", "full body")
  weight: number;              // Importance weight (0–1)
}

interface Outfit {
  prompt: string;              // Outfit description prompt
  lora?: string;               // Optional LoRA model file
}
```

**Validation:**
- `id`: Must be unique across all characters
- `references[].url`: Must be absolute URL or valid filename (.png, .jpg, .webp)
- `references[].weight`: 0.0–1.0

**Example:**

```json
{
  "assets": {
    "characters": [
      {
        "id": "char_01",
        "name": "Alice",
        "voice_id": "v_female_01",
        "references": [
          { "url": "alice_face.jpg", "context": "face", "weight": 1.0 }
        ],
        "outfits": {
          "casual": {
            "prompt": "casual wear, jeans and t-shirt",
            "lora": "outfit_casual.safetensors"
          }
        }
      }
    ],
    "environments": {
      "office": {
        "prompt": "modern office space",
        "ref": "office_ref.jpg"
      }
    },
    "audio": [
      {
        "id": "bgm_01",
        "url": "soundtrack.wav",
        "label": "Main Theme"
      }
    ]
  }
}
```

### Environment Asset

```typescript
interface EnvironmentAsset {
  prompt: string;            // Environment description
  ref?: string;              // Optional reference image
}
```

### Audio Asset

```typescript
interface AudioAsset {
  id: string;                // Unique identifier
  url: string;               // Audio file URL or path
  label?: string;            // Display label
}
```

---

## Timeline

Array of timeline events, sorted by time.

```typescript
interface TimelineEvent {
  time: number;              // Time offset in milliseconds
  duration?: number;         // Duration in frames (optional)
  notes?: string;            // Optional notes
  frame: TimelineFrame;      // Frame content
}
```

### Timeline Frame

```typescript
interface TimelineFrame {
  actors?: Actor[];                    // Characters in this frame
  camera?: Camera;                     // Camera settings
  lighting?: Lighting;                 // Lighting settings
  fx?: FX;                             // Post-processing effects
  controlnet?: ControlNet;             // ControlNet settings
  audio_tracks?: AudioTrack[];         // Audio track references
  audio_reactive?: AudioReactive;      // Audio-reactive settings
  prompt?: string;                     // AI generation prompt
  character?: string;                  // Primary character ID
}
```

### Actor

```typescript
interface Actor {
  id: string;                // Reference to Character.id
  outfit?: string;           // Reference to Character.outfits key
  action?: string;           // Action description
  position?: Position;       // 2D position
  speech?: Speech;           // Speech configuration
}

interface Position {
  x: number;                 // X coordinate (0–1)
  y: number;                 // Y coordinate (0–1)
  scale?: number;            // Scale factor
}

interface Speech {
  text: string;              // Spoken text
  mood?: Mood;               // Emotional mood
  style?: string;            // Speech style
  lip_sync?: boolean;        // Enable lip sync
  volume?: number;           // Volume (0–1)
  pitch_shift?: number;      // Pitch adjustment
}
```

**Mood Values:**
- `joyful` — Happy, energetic
- `melancholic` — Sad, reflective
- `anxious` — Nervous, tense
- `serene` — Calm, peaceful
- `curious` — Inquisitive

### Camera

```typescript
interface Camera {
  zoom?: number;             // Zoom level (default: 1.0)
  pan?: [number, number];    // [x, y] pan offset
  tilt?: number;             // Tilt angle
}
```

### Lighting

```typescript
interface Lighting {
  type?: LightingType;       // Lighting type
  intensity?: number;        // Intensity (0–1)
}

type LightingType = 
  | 'dusk'
  | 'daylight'
  | 'studio'
  | 'tungsten'
  | 'ambient';
```

### FX (Post-processing)

```typescript
interface FX {
  bloom?: number;            // Bloom intensity
  motion_blur?: number;      // Motion blur amount
}
```

### ControlNet

```typescript
interface ControlNet {
  type?: string;             // Control type (depth, canny, pose)
  strength?: number;         // Influence strength (0–1)
}
```

### Audio Track

```typescript
interface AudioTrack {
  id: string;                // Reference to AudioAsset.id
  volume?: number;           // Volume (0–1)
  start_ms?: number;         // Start offset in ms
  fade_in?: number;          // Fade-in duration in ms
  loop?: boolean;            // Enable looping
}
```

### Audio Reactive

```typescript
interface AudioReactive {
  target: string;            // Parameter to modulate (e.g., "fx.bloom")
  param: string;             // Audio parameter (e.g., "amplitude")
  strength: number;          // Modulation strength
}
```

**Example Timeline Event:**

```json
{
  "time": 0,
  "duration": 48,
  "notes": "Opening scene",
  "frame": {
    "prompt": "hero walking into sunset",
    "actors": [
      {
        "id": "char_01",
        "outfit": "casual",
        "action": "walking slowly",
        "position": { "x": 0.5, "y": 0.5, "scale": 1.0 },
        "speech": {
          "text": "Finally, freedom!",
          "mood": "joyful",
          "style": "shout",
          "lip_sync": true,
          "volume": 0.8
        }
      }
    ],
    "camera": {
      "zoom": 1.0,
      "pan": [0, 0],
      "tilt": 0
    },
    "lighting": {
      "type": "dusk",
      "intensity": 0.5
    },
    "fx": {
      "bloom": 0.2,
      "motion_blur": 0.1
    },
    "controlnet": {
      "type": "depth",
      "strength": 0.8
    },
    "audio_tracks": [
      {
        "id": "bgm_01",
        "volume": 0.6,
        "start_ms": 0,
        "fade_in": 1000
      }
    ]
  }
}
```

---

## Config

Rendering and runtime configuration.

```typescript
interface Config {
  checkpoint?: string;       // Model checkpoint file
  sampler?: string;          // Sampler name
  seed?: number;             // Random seed
  tts_engine?: string;       // Text-to-speech engine
  audioLanes?: AudioLaneConfig[]; // Audio lane configuration
}

interface AudioLaneConfig {
  id: string;
  name: string;
  muted: boolean;
  soloed: boolean;
}
```

**Example:**

```json
{
  "config": {
    "checkpoint": "flux_dev.safetensors",
    "sampler": "euler",
    "seed": 42,
    "tts_engine": "elevenlabs_v2"
  }
}
```

---

## Validation Rules

### ID Uniqueness

- All `Character.id` values must be unique
- All `AudioAsset.id` values must be unique
- Timeline events reference these IDs (must exist)

### URL/Path Validation

All URL/path fields must be:
- Absolute HTTP(S) URLs, OR
- Local filenames with allowed extensions:
  - Images: `.png`, `.jpg`, `.jpeg`, `.webp`
  - Audio: `.wav`, `.mp3`
  - Models: `.safetensors`, `.json`

**Path Traversal Prevention:**
- Rejects paths containing `..`
- Rejects null bytes (`\0`)

### Numeric Ranges

| Field | Range | Default |
|-------|-------|---------|
| `fps` | 1–240 | 24 |
| `resolution.w` | > 0 | 1024 |
| `resolution.h` | > 0 | 1024 |
| `position.x` | 0–1 | 0.5 |
| `position.y` | 0–1 | 0.5 |
| `speech.volume` | 0–1 | 1.0 |
| `lighting.intensity` | 0–1 | 0.5 |
| `fx.bloom` | 0–1 | 0 |
| `controlnet.strength` | 0–1 | 0.5 |

### Timeline Ordering

- Events are automatically sorted by `time`
- Multiple events can share the same time
- Negative `time` values are rejected

---

## Examples

### Minimal Valid Model

```json
{
  "project": {
    "name": "Untitled",
    "fps": 24,
    "resolution": { "w": 1024, "h": 1024 }
  },
  "assets": {
    "characters": [],
    "environments": {},
    "audio": []
  },
  "timeline": [],
  "config": {}
}
```

### Full-Featured Model

See `src/lib/model/model-story-example.ts` for a complete example with all fields populated.

### Migration Guide: v0.3 → v0.4

**Breaking Changes:**
- `timeline` is now an array (was `{ events: [], duration: number }`)
- `config` no longer has `id`, `title`, `description` fields
- `TimelineFrame.prompt` added for AI generation

**Migration Steps:**

```javascript
// Old v0.3 format
const oldModel = {
  timeline: { events: [...], duration: 10000 },
  config: { id: 'x', title: 'My Project', ... }
};

// New v0.4 format
const newModel = {
  project: {
    name: oldModel.config.title,
    fps: 24,
    resolution: { w: 1024, h: 1024 }
  },
  timeline: oldModel.timeline.events,
  config: {
    checkpoint: oldModel.config.checkpoint,
    sampler: oldModel.config.sampler,
    seed: oldModel.config.seed
  }
};
```

---

**End of Model Schema Reference**

For usage examples, see:
- [User Guide](./USER_GUIDE.md)
- [API Reference](./API.md)
