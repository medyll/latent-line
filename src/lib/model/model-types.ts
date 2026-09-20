/** Project-wide settings: the name, the frame rate every time value is counted in,
 *  and the output resolution. */
export interface Project {
	name: string;
	fps: number;
	resolution: {
		w: number;
		h: number;
	};
}

/** A reference image for a character, with the `context` it illustrates and the
 *  `weight` it carries in generation. */
export interface Reference {
	url: string;
	context: string;
	weight: number;
}

/** One look for a character: the prompt fragment describing it, and an optional LoRA. */
export interface Outfit {
	prompt: string;
	lora?: string;
}

/** A character asset. `outfits` is keyed by outfit name; a frame's actor selects one by that key. */
export interface Character {
	id: string;
	name: string;
	voice_id?: string;
	references: Reference[];
	outfits?: Record<string, Outfit>;
}

/** A location or backdrop: its prompt, and an optional reference image. */
export interface EnvironmentAsset {
	prompt: string;
	ref?: string;
}

/** An audio file available to the timeline, referenced from frames by `id`. */
export interface AudioAsset {
	id: string;
	url: string;
	label?: string;
}

/** Where an actor sits in frame, in normalized coordinates, with an optional scale. */
export interface Position {
	x: number;
	y: number;
	scale?: number;
}

/** A spoken line, with the delivery hints handed to the TTS engine. */
export interface Speech {
	text: string;
	mood?: Mood;
	style?: string;
	lip_sync?: boolean;
	volume?: number;
	pitch_shift?: number;
}

/** A character's appearance in one frame: which outfit, doing what, where, saying what.
 *  `id` references a {@link Character}, `outfit` a key of its `outfits`. */
export interface Actor {
	id: string;
	outfit?: string;
	action?: string;
	position?: Position;
	speech?: Speech;
}

/** Camera framing for one frame. `pan` is an `[x, y]` offset. */
export interface Camera {
	zoom?: number;
	pan?: [number, number];
	tilt?: number;
}

/** Lighting preset and its intensity for one frame. */
export interface Lighting {
	type?: LightingType;
	intensity?: number;
}

/** Post-processing effects applied to one frame. */
export interface FX {
	bloom?: number;
	motion_blur?: number;
}

/** ControlNet conditioning for one frame. */
export interface ControlNet {
	type?: string;
	strength?: number;
}

/** One audio asset playing over a frame. `id` references an {@link AudioAsset}. */
export interface AudioTrack {
	id: string;
	volume?: number;
	start_ms?: number;
	fade_in?: number;
	loop?: boolean;
}

/** Drives a parameter from the audio signal: which `target`, which `param`, how strongly. */
export interface AudioReactive {
	target: string;
	param: string;
	strength: number;
}

/** Everything that makes up one frame: who is in it, how it is shot, lit and scored. */
export interface TimelineFrame {
	actors?: Actor[];
	camera?: Camera;
	lighting?: Lighting;
	fx?: FX;
	controlnet?: ControlNet;
	audio_tracks?: AudioTrack[];
	audio_reactive?: AudioReactive;
	character?: string; // ST-023: Primary character for this event (references Character.id)
	prompt?: string; // S24-04: AI image generation prompt for this frame
}

/** Emotional register, used for both speech delivery and the mood palette. */
export type Mood = 'joyful' | 'melancholic' | 'anxious' | 'serene' | 'curious';

/** The lighting presets a frame can select. */
export type LightingType = 'dusk' | 'daylight' | 'studio' | 'tungsten' | 'ambient';

/** A frame placed on the timeline. `time` and `duration` are both counted in frames. */
export interface TimelineEvent {
	time: number;
	duration?: number; // durée en frames — optionnel, rétrocompatible
	notes?: string; // ST-023-02: freeform notes for this event
	frame: TimelineFrame;
}
/** Everything the timeline can reference. `environments` is keyed by location name. */
export interface Assets {
	characters: Character[];
	environments: Record<string, EnvironmentAsset>;
	audio: AudioAsset[];
}

/** Mute and solo state of one audio lane in the editor. */
export interface AudioLaneConfig {
	id: string;
	name: string;
	muted: boolean;
	soloed: boolean;
}

/** Generation settings: which checkpoint, sampler, seed and TTS engine to use. */
export interface Config {
	checkpoint?: string;
	sampler?: string;
	seed?: number;
	tts_engine?: string;
	audioLanes?: AudioLaneConfig[]; // ST-024: Audio lane mute/solo state
}

// Import marker types from marker-types.ts
import type { TimelineMarker, MarkerType } from './marker-types';
export type { TimelineMarker, MarkerType };

/** The whole document: the project, its assets, its timeline and its settings.
 *  This is what is saved, loaded, validated and exported. */
export interface Model {
	project: Project;
	assets: Assets;
	timeline: TimelineEvent[];
	config: Config;
	markers?: TimelineMarker[]; // S31-01: Timeline markers for navigation
}

// Note: Model is exported as a named interface above. Avoid default export for types.
