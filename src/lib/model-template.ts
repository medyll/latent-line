import type Model from "./types";

export const modelTemplate = {
  project: {
    // original: 'LatentLine_MVP'
    name: "text",
    // original: 24
    fps: "integer(range:1-240)",
    // original: { w: 1024, h: 1024 }
    // changed to a list of resolution objects for flexibility
    resolution: [
      { w: "integer", h: "integer", units: "px" }, // example original: { w: 1024, h: 1024 }
    ],
  },
  assets: {
    characters: [
      {
        // original: 'char_01'
        id: "text",
        // original: 'Mydde'
        name: "text",
        // original: 'v_male_deep_01'
        voice_id: "voice_id",
        references: [
          // original: { url: 'face.jpg', context: 'face_id', weight: 1.0 }
          { url: "image", context: "text", weight: "decimal" },
          // original: { url: 'walking.jpg', context: 'walking', weight: 0.8 }
          { url: "image", context: "text", weight: "decimal" },
        ],
        outfits: {
          // original casual.prompt: 'leather jacket, jeans'
          casual: { prompt: "text", lora: "file" }, // original lora: 'cloth_v1.safetensors'
        },
      },
    ],
    environments: {
      // original oasis: { prompt: 'bioluminescent desert oasis', ref: 'env_01.png' }
      oasis: { prompt: "text", ref: "image" },
    },
    audio: [
      // original: { id: 'bgm_01', url: 'soundtrack_dark.wav', label: 'Main Theme' }
      { id: "text", url: "audio", label: "text" },
      // original: { id: 'sfx_01', url: 'water_ripples.mp3', label: 'Water SFX' }
      { id: "text", url: "audio", label: "text" },
    ],
  },
  timeline: {
    "0": {
      actors: [
        {
          // original: id: 'char_01'
          id: "actor_id",
          // original: outfit: 'casual'
          outfit: "text",
          // original action: 'walking slowly'
          action: "text",
          // original position: { x: 0.5, y: 0.5, scale: 1.0 }
          position: { x: "decimal", y: "decimal", scale: "decimal" },
          speech: {
            // original: "Enfin de l'eau..."
            text: "text",
            // original: 'exhausted'
            mood: "mood",
            // original: 'whisper'
            style: "speech_style",
            // original: true
            lip_sync: "boolean",
            // original: 0.8
            volume: "decimal",
          },
        },
      ],
      // original: camera: { zoom: 1.0, pan: [0, 0], tilt: 0 }
      camera: { zoom: "decimal", pan: ["decimal", "decimal"], tilt: "decimal" },
      // original: lighting: { type: 'dusk', intensity: 0.5 }
      lighting: { type: "lighting", intensity: "decimal" },
      // original: fx: { bloom: 0.2, motion_blur: 0.1 }
      fx: { bloom: "decimal", motion_blur: "decimal" },
      // original: controlnet: { type: 'depth', strength: 0.8 }
      controlnet: { type: "text", strength: "decimal" },
      // original audio_tracks: [{ id: 'bgm_01', volume: 0.6, start_ms: 0, fade_in: 1000 }, ...]
      audio_tracks: [
        {
          id: "text",
          volume: "decimal",
          start_ms: "integer",
          fade_in: "integer",
        },
        { id: "text", volume: "decimal", loop: "boolean" },
      ],
      // original: { target: 'fx.bloom', param: 'amplitude', strength: 1.5 }
      audio_reactive: { target: "text", param: "text", strength: "decimal" },
    },
    "120": {
      actors: [
        {
          id: "text",
          speech: {
            // original: 'HA HA ! ON EST SAUVÉS !'
            text: "text",
            mood: "mood",
            style: "text",
            pitch_shift: "decimal",
          },
        },
      ],
      camera: { zoom: "decimal" },
      fx: { bloom: "decimal" },
      audio_tracks: [
        { id: "text", volume: "decimal" },
        { id: "text", volume: "decimal" },
      ],
    },
  },
  config: {
    // original: 'flux_dev.safetensors'
    checkpoint: "file",
    // original: 'euler'
    sampler: "text",
    // original: 42
    seed: "integer",
    // original: 'elevenlabs_v2'
    tts_engine: "text",
  },
} as unknown as Model;

/** Return a deep-cloned template so callers can mutate safely. */
export function createModelTemplate(): Model {
  return JSON.parse(JSON.stringify(modelTemplate)) as Model;
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
    },
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
