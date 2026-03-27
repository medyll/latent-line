/**
 * export-cogvideo.ts
 *
 * CogVideoX export format: Script-based sequence with frame interpolation.
 * CogVideoX is an emerging AI video generation model that expects:
 * - Keyframe declarations with prompts and parameters
 * - Interpolation settings between keyframes
 * - Camera and motion metadata
 *
 * Output format is a plain-text script with structured commands.
 * Format version: 1.0
 */

import type { Model, TimelineEvent } from '$lib/model/model-types';
import { buildPrompt } from './export-prompts';

const FORMAT_VERSION = '1.0';

export interface CogVideoKeyframe {
	frame: number;
	prompt: string;
	duration: number;
	camera_motion?: string;
}

/** Generate camera motion description from frame data. */
function describeCameraMotion(event: TimelineEvent): string {
	const parts: string[] = [];
	if (event.frame.camera?.zoom && event.frame.camera.zoom !== 1) {
		parts.push(`zoom ${event.frame.camera.zoom.toFixed(2)}x`);
	}
	if (event.frame.camera?.pan) {
		parts.push(`pan (${event.frame.camera.pan.join(', ')})`);
	}
	if (event.frame.camera?.tilt) {
		parts.push(`tilt ${event.frame.camera.tilt}°`);
	}
	return parts.length > 0 ? parts.join(', ') : 'static';
}

/** Export timeline as CogVideoX script with interpolation. */
export function exportToCogVideoX(model: Model): string {
	const sortedEvents = [...model.timeline].sort((a, b) => a.time - b.time);

	const lines: string[] = [
		`# CogVideoX Video Sequence Script`,
		`# Format Version: ${FORMAT_VERSION}`,
		`# Generated from latent-line project: ${model.project.name}`,
		`# FPS: ${model.project.fps}`,
		`# Resolution: ${model.project.resolution.w}x${model.project.resolution.h}`,
		``,
		`[METADATA]`,
		`version = ${FORMAT_VERSION}`,
		`fps = ${model.project.fps}`,
		`width = ${model.project.resolution.w}`,
		`height = ${model.project.resolution.h}`,
		``,
		`[KEYFRAMES]`,
		``
	];

	// Write keyframe declarations
	sortedEvents.forEach((ev, idx) => {
		const prompt = buildPrompt(ev, model);
		const cameraMotion = describeCameraMotion(ev);

		lines.push(`[KEYFRAME_${idx}]`);
		lines.push(`frame = ${ev.time}`);
		lines.push(`prompt = "${prompt}"`);
		lines.push(`duration = ${ev.duration}`);
		lines.push(`camera = "${cameraMotion}"`);

		// Add lighting info if available
		if (ev.frame.lighting?.type) {
			lines.push(`lighting = "${ev.frame.lighting.type}"`);
		}
		if (ev.frame.lighting?.intensity) {
			lines.push(`intensity = ${ev.frame.lighting.intensity}`);
		}

		// Add effects if available
		if (ev.frame.fx?.bloom) {
			lines.push(`bloom = ${ev.frame.fx.bloom}`);
		}
		if (ev.frame.fx?.motion_blur) {
			lines.push(`motion_blur = ${ev.frame.fx.motion_blur}`);
		}

		lines.push(``);
	});

	// Write interpolation rules
	if (sortedEvents.length > 1) {
		lines.push(`[INTERPOLATION]`);
		lines.push(``);

		for (let i = 0; i < sortedEvents.length - 1; i++) {
			const current = sortedEvents[i];
			const next = sortedEvents[i + 1];
			const gap = next.time - current.time;

			if (gap > 1) {
				lines.push(`# Interpolate from frame ${current.time} to ${next.time}`);
				lines.push(
					`interpolate(from=${current.time}, to=${next.time}, method="linear", steps=${gap})`
				);
				lines.push(``);
			}
		}
	}

	return lines.join('\n');
}
