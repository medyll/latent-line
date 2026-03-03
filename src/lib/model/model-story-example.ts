import type { Model, Mood, LightingType } from '$lib/model/model-types'

const exampleStoryModel: Model = {
  project: {
    name: 'The_Goliath_Spring',
    fps: 24,
    resolution: { w: 1920, h: 1080 }
  },
  assets: {
    characters: [
      {
        id: 'mammoth_01',
        name: 'Goliath',
        references: [{ url: 'mammoth_high_res.jpg', context: 'fur_and_tusks', weight: 1.0 }],
        outfits: {
          ruins: { prompt: 'mammoth with rusted rebar tangled in tusks, skin covered in white alkaline dust', lora: 'wasteland_beast_v2.safetensors' }
        }
      },
      {
        id: 'jax',
        name: 'Jax',
        voice_id: 'v_rough_male',
        references: [{ url: 'jax_face.jpg', context: 'scars', weight: 1.0 }]
      },
      {
        id: 'mara',
        name: 'Mara',
        voice_id: 'v_alto_female',
        references: [{ url: 'mara_outfit.jpg', context: 'scavenger_gear', weight: 1.0 }]
      },
      {
        id: 'lauren',
        name: 'Lauren',
        voice_id: 'v_soft_tech',
        references: [{ url: 'lauren_face.jpg', context: 'glasses_and_hazmat', weight: 1.0 }]
      }
    ],
    environments: {
      dead_city: { prompt: 'overgrown financial district, fallen skyscrapers, thick grey fog', ref: 'city_ruins.png' }
    },
    audio: [
      { id: 'low_rumble', url: 'sub_bass_drone.wav', label: 'Ground Vibration' },
      { id: 'geiger_counter', url: 'clicks.mp3', label: 'Scanner SFX' },
      { id: 'heavy_thuds', url: 'mammoth_steps.wav', label: 'Mammoth Walk' },
      { id: 'water_explosion', url: 'geyser_burst.wav', label: 'Water Release' }
    ]
  },
  timeline: [
    {
      time: 0,
      frame: {
        actors: [
          {
            id: 'mammoth_01',
            outfit: 'ruins',
            action: 'walking heavily through the fog, each step crushing rusted car husks underfoot',
            position: { x: 0.2, y: 0.5, scale: 2.0 }
          }
        ],
        camera: { zoom: 0.9, pan: [-5, 0], tilt: 5 },
        lighting: { type: 'ambient' as LightingType, intensity: 0.2 },
        audio_tracks: [{ id: 'heavy_thuds', volume: 0.6, loop: true }]
      }
    },
    {
      time: 120,
      frame: {
        actors: [
          {
            id: 'lauren',
            action: 'holding a handheld scanner, watching a flickering screen with intense focus',
            position: { x: 0.6, y: 0.7, scale: 0.8 },
            speech: { text: "The thermal signature is peaking. There is a massive reservoir directly beneath us.", mood: 'serene' as Mood }
          },
          {
            id: 'jax',
            action: 'leaning on a piece of debris, looking down at the cracked concrete',
            position: { x: 0.4, y: 0.7, scale: 0.85 }
          }
        ],
        camera: { zoom: 1.5 },
        lighting: { type: 'dusk' as LightingType, intensity: 0.4 },
        audio_tracks: [{ id: 'geiger_counter', volume: 0.3, loop: true }]
      }
    },
    {
      time: 240,
      frame: {
        actors: [
          {
            id: 'mammoth_01',
            action: 'stopping abruptly, sniffing a deep fissure in the ground with its trunk',
            position: { x: 0.3, y: 0.5, scale: 2.2 }
          },
          {
            id: 'mara',
            action: 'unbuckling a heavy sledgehammer from her back, preparing to strike',
            position: { x: 0.7, y: 0.7, scale: 0.8 },
            speech: { text: "If Goliath smells it, it's real. Stand back!", mood: 'anxious' as Mood, style: 'shout' }
          }
        ],
        camera: { zoom: 1.2, tilt: -10 },
        audio_tracks: [{ id: 'low_rumble', volume: 0.5, fade_in: 500 }]
      }
    },
    {
      time: 360,
      frame: {
        actors: [
          {
            id: 'mara',
            action: 'swinging the sledgehammer in a wide arc, smashing the concrete with rhythmic force',
            position: { x: 0.5, y: 0.7, scale: 1.0 }
          },
          {
            id: 'lauren',
            action: 'kneeling to stabilize her equipment as the ground begins to shake violently',
            position: { x: 0.8, y: 0.8, scale: 0.7 }
          }
        ],
        camera: { zoom: 1.8 },
        fx: { motion_blur: 0.8 },
        audio_tracks: [{ id: 'low_rumble', volume: 0.8 }]
      }
    },
    {
      time: 480,
      frame: {
        actors: [
          {
            id: 'jax',
            action: 'plunging a metal rod into the hole created by Mara, prying a massive slab upward',
            position: { x: 0.4, y: 0.7, scale: 0.9 },
            speech: { text: "It's coming up! Lauren, get the sensors ready!", mood: 'joyful' as Mood, style: 'shout' }
          }
        ],
        camera: { zoom: 2.2 },
        lighting: { type: 'studio' as LightingType, intensity: 0.6 },
        audio_tracks: [{ id: 'low_rumble', volume: 1.0 }]
      }
    },
    {
      time: 600,
      frame: {
        actors: [
          {
            id: 'mammoth_01',
            action: 'rearing up majestically, trunk shooting skyward, letting out a deafening roar',
            position: { x: 0.2, y: 0.3, scale: 2.8 }
          },
          {
            id: 'lauren',
            action: 'wiping water droplets from her face, laughing as a jet of water sprays the ruins',
            position: { x: 0.7, y: 0.8, scale: 0.8 },
            speech: { text: "It's pure... no radiation. We found the source!", mood: 'joyful' as Mood }
          }
        ],
        camera: { zoom: 0.6, pan: [0, -30] },
        lighting: { type: 'daylight' as LightingType, intensity: 1.0 },
        fx: { bloom: 0.9, motion_blur: 0.3 },
        audio_tracks: [{ id: 'water_explosion', volume: 1.0 }],
        audio_reactive: { target: 'fx.bloom', param: 'intensity', strength: 3.0 }
      }
    }
  ],
  config: {
    checkpoint: 'latent_world_v1.safetensors',
    sampler: 'dpmpp_sde',
    seed: 888111,
    tts_engine: 'elevenlabs_v2'
  }
}

export default exampleStoryModel