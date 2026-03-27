/**
 * export-framepack.ts
 *
 * FramePack export format: JSONL (JSON Lines) with one frame object per line.
 * FramePack is an emerging AI video generation tool that expects:
 * - frame number
 * - prompt string
 * - character reference
 * - camera parameters (zoom, pan, tilt)
 * - lighting and effects metadata
 *
 * Format version: 1.0
 */

import type { Model, TimelineEvent } from '$lib/model/model-types';
import { buildPrompt } from './export-prompts';

const FORMAT_VERSION = '1.0';

export interface FramePackFrame {
	frame: number;
	prompt: string;
	character_id?: string;
	character_name?: string;
	camera?: {
		zoom?: number;
		pan?: [number, number];
		tilt?: number;
	};
	lighting?: {
		type?: string;
		intensity?: number;
	};
	effects?: {
		bloom?: number;
		motion_blur?: number;
	};
	metadata?: {
		duration: number;
		version: string;
	};
}

/** Get character name from event actor. */
function getCharacterInfo(event: TimelineEvent, model: Model): { id?: string; name?: string } {
	const actor = event.frame.actors?.[0];
	if (!actor) return {};

	const character = model.assets.characters.find((c) => c.id === actor.id);
	return {
		id: actor.id,
		name: character?.name
	};
}

/** Export timeline as FramePack JSONL (one frame per line). */
export function exportToFramePack(model: Model): string {
	return [...model.timeline]
		.sort((a, b) => a.time - b.time)
		.map((ev) => {
			const { id, name } = getCharacterInfo(ev, model);

			const frameObj: FramePackFrame = {
				frame: ev.time,
				prompt: buildPrompt(ev, model),
				...(id && { character_id: id }),
				...(name && { character_name: name }),
				...(ev.frame.camera && {
					camera: {
						zoom: ev.frame.camera.zoom,
						pan: ev.frame.camera.pan,
						tilt: ev.frame.camera.tilt
					}
				}),
				...(ev.frame.lighting && {
					lighting: {
						type: ev.frame.lighting.type,
						intensity: ev.frame.lighting.intensity
					}
				}),
				...(ev.frame.fx && {
					effects: {
						bloom: ev.frame.fx.bloom,
						motion_blur: ev.frame.fx.motion_blur
					}
				}),
				metadata: {
					duration: ev.duration ?? 1,
					version: FORMAT_VERSION
				}
			};

			return JSON.stringify(frameObj);
		})
		.join('\n');
}
