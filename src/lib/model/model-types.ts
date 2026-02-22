export interface Project {
  name: string
  fps: number
  resolution: {
    w: number
    h: number
  }
}

export interface Reference {
  url: string
  context: string
  weight: number
}

export interface Outfit {
  prompt: string
  lora?: string
}

export interface Character {
  id: string
  name: string
  voice_id?: string
  references: Reference[]
  outfits?: Record<string, Outfit>
}

export interface EnvironmentAsset {
  prompt: string
  ref?: string
}

export interface AudioAsset {
  id: string
  url: string
  label?: string
}

export interface Position {
  x: number
  y: number
  scale?: number
}

export interface Speech {
  text: string
  mood?: Mood
  style?: string
  lip_sync?: boolean
  volume?: number
  pitch_shift?: number
}

export interface Actor {
  id: string
  outfit?: string
  action?: string
  position?: Position
  speech?: Speech
}

export interface Camera {
  zoom?: number
  pan?: [number, number]
  tilt?: number
}

export interface Lighting {
  type?: LightingType
  intensity?: number
}

export interface FX {
  bloom?: number
  motion_blur?: number
}

export interface ControlNet {
  type?: string
  strength?: number
}

export interface AudioTrack {
  id: string
  volume?: number
  start_ms?: number
  fade_in?: number
  loop?: boolean
}

export interface AudioReactive {
  target: string
  param: string
  strength: number
}

export interface TimelineFrame {
  actors?: Actor[]
  camera?: Camera
  lighting?: Lighting
  fx?: FX
  controlnet?: ControlNet
  audio_tracks?: AudioTrack[]
  audio_reactive?: AudioReactive
}

export type Mood = 'joyful' | 'melancholic' | 'anxious' | 'serene' | 'curious';

export type LightingType = 'dusk' | 'daylight' | 'studio' | 'tungsten' | 'ambient';

export interface TimelineEvent {
  time: number
  frame: TimelineFrame
}
export interface Assets {
  characters: Character[]
  environments: Record<string, EnvironmentAsset>
  audio: AudioAsset[]
}

export interface Config {
  checkpoint?: string
  sampler?: string
  seed?: number
  tts_engine?: string
}

export interface Model {
  project: Project
  assets: Assets
  timeline: Record<string, TimelineEvent>
  config: Config
}

// Note: Model is exported as a named interface above. Avoid default export for types.
