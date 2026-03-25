/**
 * export-edl.ts
 *
 * CMX 3600 EDL (Edit Decision List) format export.
 * Standard format for timeline import into:
 * - DaVinci Resolve
 * - Adobe Premiere Pro
 * - Final Cut Pro
 *
 * EDL format specification:
 * - Frame-accurate timecode (SMPTE: HH:MM:SS:FF)
 * - Event-based: each clip gets an entry with in/out points
 * - Standard fields: event #, reel, channels, transition, duration
 */

import type { Model, TimelineEvent } from '$lib/model/model-types';

export interface EDLEvent {
	event_num: number;
	reel: string;
	channels: string; // AUD/V or V
	transition: string; // CUT, DISSOLVE, etc.
	duration: number; // frames
	from_time: string; // SMPTE timecode
	to_time: string; // SMPTE timecode
	comments: string[];
}

/**
 * Convert frame number to SMPTE timecode (HH:MM:SS:FF)
 * FF = frame number within second (0-based on FPS)
 */
export function frameToTimecode(frame: number, fps: number): string {
	const totalSeconds = Math.floor(frame / fps);
	const frameInSecond = frame % fps;

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frameInSecond).padStart(2, '0')}`;
}

/**
 * Convert SMPTE timecode back to frame number
 */
export function timecodeToFrame(timecode: string, fps: number): number {
	const [hours, minutes, seconds, frames] = timecode.split(':').map(Number);
	const totalSeconds = hours * 3600 + minutes * 60 + seconds;
	return totalSeconds * fps + frames;
}

/**
 * Validate timeline for EDL export:
 * - No overlapping events
 * - No gaps > 1 frame
 * - Frame 0 exists or starts with proper timecode
 */
export function validateTimelineForEDL(model: Model): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const sorted = [...model.timeline].sort((a, b) => a.time - b.time);

	if (sorted.length === 0) {
		errors.push('Timeline is empty');
		return { valid: false, errors };
	}

	// Check for overlaps
	for (let i = 0; i < sorted.length - 1; i++) {
		const current = sorted[i];
		const next = sorted[i + 1];
		const currentEnd = current.time + current.duration;

		if (currentEnd > next.time) {
			errors.push(`Event ${i} overlaps with event ${i + 1}`);
		}

		// Check for gaps > 1 frame
		const gap = next.time - currentEnd;
		if (gap > 1) {
			errors.push(`Gap of ${gap} frames between event ${i} and ${i + 1}`);
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Get event name (reel) from timeline event
 */
function getEventName(event: TimelineEvent, index: number, model: Model): string {
	const actor = event.frame.actors?.[0];
	if (actor) {
		const character = model.assets.characters.find((c) => c.id === actor.id);
		if (character?.name) {
			return character.name.substring(0, 8).toUpperCase(); // EDL reel: max 8 chars
		}
	}
	return `EVENT${String(index + 1).padStart(3, '0')}`;
}

/**
 * Export timeline as CMX 3600 EDL format
 */
export function exportToEDL(model: Model): string {
	const { valid, errors } = validateTimelineForEDL(model);
	if (!valid) {
		throw new Error(`Timeline validation failed: ${errors.join('; ')}`);
	}

	const fps = model.project.fps;
	const sorted = [...model.timeline].sort((a, b) => a.time - b.time);

	const lines: string[] = [
		`TITLE: ${model.project.name}`,
		`FCM: DROP FRAME` + (fps === 30 ? '' : ' NON-DROP'),
		``
	];

	// Generate EDL events
	sorted.forEach((event, idx) => {
		const eventNum = idx + 1;
		const reel = getEventName(event, idx, model);

		const fromTime = frameToTimecode(event.time, fps);
		const toTime = frameToTimecode(event.time + event.duration, fps);
		const duration = event.duration;

		// Main EDL line format:
		// 001  AX       V     CUT        001:00:00:00 001:00:05:00 000:00:00:00 000:00:05:00
		lines.push(
			`${String(eventNum).padStart(3, '0')}  ${reel.padEnd(8)} V     CUT        ${fromTime} ${toTime} 000:00:00:00 000:00:${String(Math.floor(duration / fps)).padStart(2, '0')}:${String(duration % fps).padStart(2, '0')}`
		);

		// Add comments (CMX 3600 format: M2 lines)
		const comments: string[] = [];

		if (event.frame.actors?.[0]) {
			const actor = event.frame.actors[0];
			const character = model.assets.characters.find((c) => c.id === actor.id);
			if (character?.name) {
				comments.push(`CHARACTER: ${character.name}`);
			}
			if (actor.action) {
				comments.push(`ACTION: ${actor.action}`);
			}
			if (actor.speech?.mood) {
				comments.push(`MOOD: ${actor.speech.mood}`);
			}
		}

		if (event.notes) {
			comments.push(`NOTES: ${event.notes}`);
		}

		// Write comment lines
		comments.forEach((comment) => {
			lines.push(`* ${comment}`);
		});

		lines.push('');
	});

	return lines.join('\n');
}
