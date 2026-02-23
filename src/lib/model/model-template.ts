import type { Model } from "./model-types";
import { z } from "zod";

/** Minimal Zod schemas matching `src/lib/types.ts` for runtime validation */
const positionSchema = z.object({ x: z.number(), y: z.number(), scale: z.number().optional() });
const speechSchema = z.object({
  text: z.string(),
  mood: z.string().optional(),
  style: z.string().optional(),
  lip_sync: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  pitch_shift: z.number().optional(),
});
const actorSchema = z.object({
  id: z.string(),
  outfit: z.string().optional(),
  action: z.string().optional(),
  position: positionSchema.optional(),
  speech: speechSchema.optional(),
});
const cameraSchema = z.object({ zoom: z.number().optional(), pan: z.tuple([z.number(), z.number()]).optional(), tilt: z.number().optional() });
const lightingSchema = z.object({ type: z.string().optional(), intensity: z.number().min(0).max(1).optional() });
const fxSchema = z.object({ bloom: z.number().optional(), motion_blur: z.number().optional() });
const controlNetSchema = z.object({ type: z.string().optional(), strength: z.number().optional() });
const audioTrackSchema = z.object({ id: z.string(), volume: z.number().min(0).max(1).optional(), start_ms: z.number().int().nonnegative().optional(), fade_in: z.number().int().nonnegative().optional(), loop: z.boolean().optional() });
const audioReactiveSchema = z.object({ target: z.string(), param: z.string(), strength: z.number() });

const timelineFrameSchema = z.object({
  actors: z.array(actorSchema).optional(),
  camera: cameraSchema.optional(),
  lighting: lightingSchema.optional(),
  fx: fxSchema.optional(),
  controlnet: controlNetSchema.optional(),
  audio_tracks: z.array(audioTrackSchema).optional(),
  audio_reactive: audioReactiveSchema.optional(),
});

// helpers & enums
const moodEnum = z.enum(["joyful", "melancholic", "anxious", "serene", "curious"]);
const lightingTypeEnum = z.enum(["dusk", "daylight", "studio", "tungsten", "ambient"]);

function isUrlOrFile(s: string) {
  if (!s || typeof s !== "string") return false;
  try {
    // allow absolute URLs
    // new URL will throw on relative paths
    new URL(s);
    return true;
  } catch {
    // allow common file extensions for local assets
    return /\.(png|jpe?g|webp|wav|mp3|safetensors|json)$/i.test(s);
  }
}

const projectSchema = z.object({ name: z.string(), fps: z.number().int().min(1).max(240), resolution: z.object({ w: z.number().int().positive(), h: z.number().int().positive() }) });

const referenceSchema = z.object({ url: z.string().refine(isUrlOrFile, { message: "must be absolute URL or local filename with allowed extension" }), context: z.string(), weight: z.number() });
const outfitSchema = z.object({ prompt: z.string(), lora: z.string().optional() });
const characterSchema = z.object({ id: z.string(), name: z.string(), voice_id: z.string().optional(), references: z.array(referenceSchema), outfits: z.record(z.string(), outfitSchema).optional() });
const environmentSchema = z.object({ prompt: z.string(), ref: z.string().optional().refine((v: string | undefined) => !v || isUrlOrFile(v), { message: "ref must be URL or file path" }) });
const audioAssetSchema = z.object({ id: z.string(), url: z.string().refine(isUrlOrFile, { message: "must be URL or file path" }), label: z.string().optional() });

const assetsSchema = z.object({ characters: z.array(characterSchema), environments: z.record(z.string(), environmentSchema), audio: z.array(audioAssetSchema) });

// timeline as an object keyed by event id
const timelineEventSchema = z.object({ time: z.number().int().nonnegative(), frame: timelineFrameSchema });

export const modelSchema = z.object({ project: projectSchema, assets: assetsSchema, timeline: z.record(z.string(), timelineEventSchema), config: z.object({ checkpoint: z.string().optional(), sampler: z.string().optional(), seed: z.number().optional(), tts_engine: z.string().optional() }) });

/** Build a fully-typed default Model instance (no placeholder strings). */
export function buildDefaultModel(): Model {
  return {
    project: { name: "LatentLine_MVP", fps: 24, resolution: { w: 1024, h: 1024 } },
    assets: {
      characters: [
        {
          id: "char_01",
          name: "Mydde",
          voice_id: "v_male_deep_01",
          references: [{ url: "face.jpg", context: "face", weight: 1.0 }],
          outfits: { casual: { prompt: "leather jacket, jeans", lora: "cloth_v1.safetensors" } },
        },
      ],
      environments: { oasis: { prompt: "bioluminescent desert oasis", ref: "env_01.png" } },
      audio: [{ id: "bgm_01", url: "soundtrack_dark.wav", label: "Main Theme" }],
    },
      timeline: {
        event_01: {
          time: 0,
          frame: {
            actors: [
              {
                id: "char_01",
                outfit: "casual",
                action: "walking slowly",
                position: { x: 0.5, y: 0.5, scale: 1.0 },
                speech: { text: "Enfin de l'eau...", mood: "melancholic", style: "whisper", lip_sync: true, volume: 0.8 },
              },
            ],
            camera: { zoom: 1.0, pan: [0, 0], tilt: 0 },
            lighting: { type: "dusk", intensity: 0.5 },
            fx: { bloom: 0.2, motion_blur: 0.1 },
            controlnet: { type: "depth", strength: 0.8 },
            audio_tracks: [{ id: "bgm_01", volume: 0.6, start_ms: 0, fade_in: 1000 }],
            audio_reactive: { target: "fx.bloom", param: "amplitude", strength: 1.5 },
          },
        },
        event_02: {
          time: 120,
          frame: {
            actors: [{ id: "char_01", speech: { text: "HA HA ! ON EST SAUVÉS !", mood: "joyful", style: "shout", pitch_shift: 0 } }],
            camera: { zoom: 1.0 },
            fx: { bloom: 0.3 },
            audio_tracks: [{ id: "bgm_01", volume: 0.5 }],
          },
        },
      },
    config: { checkpoint: "flux_dev.safetensors", sampler: "euler", seed: 42, tts_engine: "elevenlabs_v2" },
  };
}

export const modelTemplate: Model = buildDefaultModel();

/** Return a deep-cloned template so callers can mutate safely. */
export function createModelTemplate(): Model {
  const parsed = modelSchema.safeParse(modelTemplate);
  if (!parsed.success) {
    throw new Error("modelTemplate failed validation: " + parsed.error.message);
  }
  return JSON.parse(JSON.stringify(parsed.data)) as Model;
}

/**
 * types definitions for modelTemple fields.
 */
const mood = {
  mood: [
    {
      // name: 'joyful'
      name: "joyful",
      description:
        "Bright, energetic and uplifted — a feeling of happiness, warmth and playful optimism.",
    },
    {
      // name: 'melancholic'
      name: "melancholic",
      description:
        "Quietly reflective sadness — wistful, nostalgic feelings with a soft, emotional weight.",
    },
    {
      // name: 'anxious'
      name: "anxious",
      description:
        "Tense, restless and alert — a heightened sensitivity to uncertainty or imminent change.",
    },
    {
      // name: 'serene'
      name: "serene",
      description:
        "Calm, peaceful and clear-headed — gentle stillness with minimal emotional turbulence.",
    },
    {
      // name: 'curious'
      name: "curious",
      description:
        "Inquisitive and engaged — eager to explore, investigate and discover new details.",
    },
  ],
} as const;

// Resolution presets keyed by name for clarity and reuse in `project.resolution` or elsewhere
const resolution = {
  // original example: { w: 1024, h: 1024 }
  square1024: {
    name: "square1024",
    description:
      "Square 1:1 resolution commonly used for model inputs and previews.",
    parameters: {
      w: "integer(1024)",
      h: "integer(1024)",
      aspect_ratio: "1:1",
      units: "px",
    },
  },
  hd720: {
    name: "hd720",
    description: "Standard HD 720p, good for lower-bandwidth preview renders.",
    parameters: {
      w: "integer(1280)",
      h: "integer(720)",
      aspect_ratio: "16:9",
      units: "px",
    },actorSchema
  },
  hd1080: {
    name: "hd1080",
    description: "Full HD 1080p, typical for web video output.",
    parameters: {
      w: "integer(1920)",
      h: "integer(1080)",
      aspect_ratio: "16:9",
      units: "px",
    },
  },
  uhd4k: {
    name: "uhd4k",
    description: "Ultra HD 4K for high-detail exports and final renders.",
    parameters: {
      w: "integer(3840)",
      h: "integer(2160)",
      aspect_ratio: "16:9",
      units: "px",
    },
  },
  custom: {
    name: "custom",
    description: "Custom resolution object — specify width/height explicitly.",
    parameters: {
      w: "integer",
      h: "integer",
      aspect_ratio: "ratio or decimal",
      units: "px",
    },
  },
} as const;

// Lighting type definitions: keyed by type name for use in timeline lighting.type
const lighting = {
  // original example used 'dusk'
  dusk: {
    name: "dusk",
    description:
      "Warm, low-angle light with long shadows and reduced contrast — twilight mood.",
    parameters: {
      intensity: "decimal(0.0-1.0)",
      color_temperature: "kelvin(2000-4000) // warm",
      shadow_softness: "decimal(0.0-1.0)",
      directionality: "directional",
      color: "hex_or_text",
    },
  },
  daylight: {
    name: "daylight",
    description:
      "Neutral, high-energy sunlight with strong directional shadows and high contrast.",
    parameters: {
      intensity: "decimal(0.0-1.0)",
      color_temperature: "kelvin(5000-6500) // neutral-cool",
      shadow_softness: "decimal(0.0-1.0)",
      directionality: "directional",
      color: "hex_or_text",
    },
  },
  studio: {
    name: "studio",
    description:
      "Controlled, multi-source lighting with soft key/fill/back lights for polished look.",
    parameters: {
      intensity: "decimal(0.0-1.0)",
      key_fill_ratio: "decimal(0.0-4.0)",
      color_temperature: "kelvin(3000-6000)",
      shadow_softness: "decimal(0.0-1.0)",
      directionality: "multi",
    },
  },
  tungsten: {
    name: "tungsten",
    description:
      "Warm indoor lighting (incandescent) with low color temperature and cozy mood.",
    parameters: {
      intensity: "decimal(0.0-1.0)",
      color_temperature: "kelvin(2500-3200) // warm",
      shadow_softness: "decimal(0.0-1.0)",
      directionality: "omni",
      color: "hex_or_text",
    },
  },
  ambient: {
    name: "ambient",
    description:
      "Soft, non-directional fill light that reduces contrast and flattens shadows.",
    parameters: {
      intensity: "decimal(0.0-1.0)",
      color_temperature: "kelvin(3000-7000)",
      shadow_softness: "decimal(0.7-1.0)",
      directionality: "omni",
      color: "hex_or_text",
    },
  },
} as const;

// Speech style palette: descriptive styles with parameters for synthesis/control
const speechStyle = {
  whisper: {
    // original name: 'whisper'
    name: "whisper",
    description: "Soft, intimate delivery with low volume and close-mic feel.",
    parameters: {
      volume_range: ["decimal(0.0-0.3)"],
      pitch_shift: "decimal(-3.0 to 0.0)",
      pace: "slow",
      prosody: { breathiness: "decimal(0.0-1.0)", sustain: "decimal(0.0-1.0)" },
    },
  },
  shout: {
    // original name: 'shout'
    name: "shout",
    description:
      "Loud, forceful projection with higher energy and clipped cadence.",
    parameters: {
      volume_range: ["decimal(0.8-1.0)"],
      pitch_shift: "decimal(0.0-3.0)",
      pace: "fast",
      prosody: { intensity: "decimal(0.0-1.0)", attack: "decimal(0.0-1.0)" },
    },
  },
  monotone: {
    // original name: 'monotone'
    name: "monotone",
    description:
      "Flat, even delivery with minimal pitch variation — useful for neutral narration.",
    parameters: {
      volume_range: ["decimal(0.4-0.6)"],
      pitch_shift: "decimal(0.0-0.0)",
      pace: "steady",
      prosody: { variation: "decimal(0.0-0.2)" },
    },
  },
  playful: {
    // original name: 'playful'
    name: "playful",
    description:
      "Bouncy, energetic tone with expressive pitch swings and quicker pacing.",
    parameters: {
      volume_range: ["decimal(0.5-0.9)"],
      pitch_shift: "decimal(0.5-2.0)",
      pace: "medium-fast",
      prosody: { swing: "decimal(0.0-1.0)", articulation: "crisp" },
    },
  },
  formal: {
    // original name: 'formal'
    name: "formal",
    description:
      "Polished, measured delivery with clear diction and moderate pacing.",
    parameters: {
      volume_range: ["decimal(0.5-0.8)"],
      pitch_shift: "decimal(0.0-0.5)",
      pace: "medium",
      prosody: { clarity: "decimal(0.7-1.0)", warmth: "decimal(0.0-0.5)" },
    },
  },
} as const;

export const modelTypes = {
  // original: 'LatentLine_MVP'
  mood: mood,
  resolution: resolution,
  lighting: lighting,
  speechStyle: speechStyle,
} as const;
