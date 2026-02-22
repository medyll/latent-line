# Model Definition Guidelines

This document describes the canonical model used across the repository: its purpose, field types, validation rules, timeline format, enums, and recommended best practices for creating and mutating model instances.

## Purpose

- Provide a deterministic, typed representation of a story/scene project.
- Support runtime validation (via `modelSchema` / Zod) and static typing (TypeScript interfaces in `src/lib/model-types.ts`).

## Top-level structure

Model (object) has these top-level keys:

- `project`: Project metadata (name, `fps`, `resolution` with `w` and `h`).
- `assets`: Collections used by the timeline: `characters`, `environments`, `audio`.
- `timeline`: Ordered array of timeline events. Each event is `{ time: number, frame: TimelineFrame }`.
- `config`: Optional rendering / runtime configuration (checkpoint, sampler, seed, tts_engine).

Refer to `src/lib/model-types.ts` for exact TypeScript interfaces.

## Timeline rules

- `timeline` MUST be an array of `TimelineEvent` objects.
- Each `TimelineEvent.time` is a non-negative integer representing frame number or milliseconds depending on your convention (project uses FPS; be consistent).
- Events should be ordered by ascending `time`. Consumers may assume ordering.
- `frame` contains optional fields: `actors`, `camera`, `lighting`, `fx`, `controlnet`, `audio_tracks`, `audio_reactive`.

## Important field details

- `Actor.id` must reference an existing `assets.characters[].id` when used.
- `Reference.url` and all asset `url`/`ref` values should be either absolute HTTP(S) URLs or local filenames/paths. The codebase uses a helper `isUrlOrFile` for Zod refinement — prefer common image/audio extensions (.jpg, .png, .wav, .mp3, .safetensors).
- `AudioTrack` fields: `start_ms` and `fade_in` are integers (milliseconds); `volume` is 0.0–1.0.
- `Speech.mood` uses the `Mood` union: `joyful | melancholic | anxious | serene | curious`.
- `Lighting.type` uses the `LightingType` union: `dusk | daylight | studio | tungsten | ambient`.

## IDs and references

- Use short stable IDs (e.g., `char_01`, `bgm_01`) and avoid filesystem paths in IDs.
- References inside `actors` (e.g., `actor.id`) should refer to existing asset IDs. Validation scripts and tests expect this mapping.

## Validation

- Use the exported `modelSchema` (Zod) in `src/lib/model-template.ts` for runtime validation.
- Prefer `modelSchema.safeParse(value)` to verify incoming data and surface clear errors.
- Use `createModelTemplate()` to obtain a deep-cloned, valid template before mutating.

## Best practices

- Keep timeline events small and composable: only include fields that change at that time.
- When editing programmatically, mutate a deep-cloned model (via `createModelTemplate()`) to avoid surprising shared references.
- Keep `project.resolution` aligned to preset names if possible (see `modelTypes.resolution` presets). Use numeric `w`/`h` only for custom sizes.
- Add unit tests for any code that consumes the model shape (Vitest is available in the repo).

## Example (minimal event)

```ts
{
  time: 0,
  frame: {
    actors: [{ id: 'char_01', speech: { text: 'Hello', mood: 'joyful' } }],
    camera: { zoom: 1.0 }
  }
}
```

## Where to look in the code

- Type definitions: `src/lib/model-types.ts`
- Canonical template & Zod schema: `src/lib/model-template.ts` (`buildDefaultModel`, `modelSchema`, `createModelTemplate`).
- Example instance: `src/lib/model-example.ts`
- Tests: `src/lib/model-template.test.ts`

If you want, I can expand this into a README-style spec with JSON Schema snippets or add stricter validation rules (ID uniqueness, stricter filename/URL patterns).
