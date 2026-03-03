# Model Schema & Data Structure

This document defines the core data structures used in latent-line narratives.

---

## Root: Model

The `Model` is the top-level document containing a complete narrative specification.

```typescript
interface Model {
  project: Project
  assets: Assets
  timeline: TimelineEvent[]
  config: Config
}
```

### Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project` | `Project` | ✅ | Project metadata: name, FPS, resolution |
| `assets` | `Assets` | ✅ | All characters, environments, and audio |
| `timeline` | `TimelineEvent[]` | ✅ | Array of scene events (sorted by `time`) |
| `config` | `Config` | ✅ | Model generation config: checkpoint, sampler, seed |

---

## Project

Project-level metadata.

```typescript
interface Project {
  name: string
  fps: number           // 1-240, typically 24 or 30
  resolution: {
    w: number           // Width in pixels
    h: number           // Height in pixels
  }
}
```

### Constraints
- `fps`: 1 ≤ fps ≤ 240
- `resolution.w` and `resolution.h`: must be positive integers

### Example
```typescript
{
  name: "The_Goliath_Spring",
  fps: 24,
  resolution: { w: 1920, h: 1080 }
}
```

---

## Assets

All reusable entities in the narrative.

```typescript
interface Assets {
  characters: Character[]
  environments: Record<string, EnvironmentAsset>
  audio: AudioAsset[]
}
```

### Characters

```typescript
interface Character {
  id: string                          // Unique ID (e.g., "char_01", "jax")
  name: string                        // Display name
  voice_id?: string                   // Voice provider ID (e.g., "v_male_deep_01")
  references: Reference[]             // Reference images/materials
  outfits?: Record<string, Outfit>    // Named outfits (e.g., "casual", "formal")
}
```

#### Reference

```typescript
interface Reference {
  url: string                         // Absolute URL or local filename (e.g., "face.jpg")
  context: string                     // Description (e.g., "face_id", "walking")
  weight: number                      // Importance 0-1
}
```

**Constraints on `url`:**
- Must be absolute URL (starts with `http://` or `https://`)
  **OR** local filename with extension `.png`, `.jpg`, `.jpeg`, `.webp`, `.wav`, `.mp3`, `.safetensors`, `.json`
- Path traversal sequences (`..`) are **rejected**
- Null bytes (`\0`) are **rejected**

#### Outfit

```typescript
interface Outfit {
  prompt: string                      // Clothing/appearance description
  lora?: string                       // Optional LoRA weights filename
}
```

### Environments

```typescript
interface EnvironmentAsset {
  prompt: string                      // Scene description (e.g., "desert oasis")
  ref?: string                        // Optional reference image (same URL rules as Reference.url)
}
```

**Stored as object keyed by environment ID:**
```typescript
environments: {
  "oasis": { prompt: "bioluminescent desert oasis", ref: "env_01.png" },
  "ruins": { prompt: "overgrown city", ref: "ruins.png" }
}
```

### Audio

```typescript
interface AudioAsset {
  id: string                          // Unique ID (e.g., "bgm_01", "sfx_water")
  url: string                         // Absolute URL or local filename
  label?: string                      // Human-readable name (e.g., "Main Theme")
}
```

---

## Timeline

A timeline is an array of `TimelineEvent` objects, sorted by `time` in ascending order.

```typescript
type Timeline = TimelineEvent[]
```

### TimelineEvent

```typescript
interface TimelineEvent {
  time: number                        // Millisecond offset from start (≥ 0)
  frame: TimelineFrame                // Scene state at this moment
}
```

### TimelineFrame

Snapshot of all elements and parameters at a specific time.

```typescript
interface TimelineFrame {
  actors?: Actor[]                    // Characters in this frame
  camera?: Camera                     // Camera parameters
  lighting?: Lighting                 // Lighting setup
  fx?: FX                             // Visual effects (bloom, motion blur)
  controlnet?: ControlNet             // ControlNet conditioning
  audio_tracks?: AudioTrack[]         // Active audio tracks
  audio_reactive?: AudioReactive      // Audio-driven animations
}
```

#### Actor

```typescript
interface Actor {
  id: string                          // Reference to Character.id
  outfit?: string                     // Reference to Character.outfits[outfit]
  action?: string                     // Action description (e.g., "walking slowly")
  position?: Position                 // XY coordinates and scale
  speech?: Speech                     // Dialogue or vocalization
}
```

#### Position

```typescript
interface Position {
  x: number                           // 0-1 (left-right)
  y: number                           // 0-1 (top-bottom)
  scale?: number                      // 0.1-10 (optional, default 1.0)
}
```

#### Speech

```typescript
interface Speech {
  text: string                        // Dialogue or narration
  mood?: Mood                         // 'joyful' | 'melancholic' | 'anxious' | 'serene' | 'curious'
  style?: string                      // Delivery style (e.g., "whisper", "shout")
  lip_sync?: boolean                  // Enable lip-sync generation
  volume?: number                     // 0-1
  pitch_shift?: number                // Pitch multiplier
}
```

#### Camera

```typescript
interface Camera {
  zoom?: number                       // Zoom level (typically 0.5-3.0)
  pan?: [number, number]              // Pan offset [x, y]
  tilt?: number                       // Tilt angle in degrees
}
```

#### Lighting

```typescript
interface Lighting {
  type?: LightingType                 // 'dusk' | 'daylight' | 'studio' | 'tungsten' | 'ambient'
  intensity?: number                  // 0-1
}
```

#### FX

```typescript
interface FX {
  bloom?: number                      // 0-1 (bloom strength)
  motion_blur?: number                // 0-1 (motion blur strength)
}
```

#### ControlNet

```typescript
interface ControlNet {
  type?: string                       // Model type (e.g., "depth", "pose")
  strength?: number                   // 0-1 (conditioning strength)
}
```

#### AudioTrack

```typescript
interface AudioTrack {
  id: string                          // Reference to AudioAsset.id
  volume?: number                     // 0-1
  start_ms?: number                   // When to start (relative to frame time)
  fade_in?: number                    // Fade-in duration in ms
  loop?: boolean                      // Loop indefinitely
}
```

#### AudioReactive

```typescript
interface AudioReactive {
  target: string                      // Target path (e.g., "fx.bloom", "camera.zoom")
  param: string                       // Parameter type (e.g., "amplitude")
  strength: number                    // Reactivity strength (0-10)
}
```

---

## Config

Generation parameters for the model.

```typescript
interface Config {
  checkpoint?: string                 // Model checkpoint (e.g., "flux_dev.safetensors")
  sampler?: string                    // Sampler algorithm (e.g., "euler", "dpmpp_sde")
  seed?: number                       // Random seed
  tts_engine?: string                 // Text-to-speech engine (e.g., "elevenlabs_v2")
}
```

---

## Enums

### Mood

```typescript
type Mood = 'joyful' | 'melancholic' | 'anxious' | 'serene' | 'curious'
```

### LightingType

```typescript
type LightingType = 'dusk' | 'daylight' | 'studio' | 'tungsten' | 'ambient'
```

---

## Validation Rules (Zod)

All models are validated at runtime using Zod. Key rules:

1. **Character IDs** must be unique within `assets.characters`
2. **URL/File validation**: Absolute URLs or filenames with allowed extensions
3. **Path traversal rejection**: Rejects `..` and `\0` characters
4. **Number ranges**: Enforced for zoom, intensity, volume, pitch_shift
5. **Timeline ordering**: Not explicitly enforced in schema (should be sorted by time)

See `src/lib/model/model-template.ts` for the full Zod schema.

---

## Example: Minimal Model

```typescript
const minimalModel: Model = {
  project: {
    name: "simple_scene",
    fps: 24,
    resolution: { w: 1024, h: 1024 }
  },
  assets: {
    characters: [
      {
        id: "char_01",
        name: "Hero",
        references: [{ url: "hero_face.jpg", context: "face", weight: 1.0 }]
      }
    ],
    environments: {
      default: { prompt: "white void" }
    },
    audio: []
  },
  timeline: [
    {
      time: 0,
      frame: {
        actors: [
          {
            id: "char_01",
            position: { x: 0.5, y: 0.5, scale: 1.0 },
            speech: { text: "Hello, world!", mood: "joyful" }
          }
        ]
      }
    }
  ],
  config: {
    checkpoint: "flux_dev.safetensors",
    seed: 42
  }
};
```

---

**Last Updated**: 2026-03-03
