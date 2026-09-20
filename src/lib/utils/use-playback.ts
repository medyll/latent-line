import { clampFrame } from './playback';

/**
 * Step the playhead by `step` frames and clamp within [0, durationFrames].
 */
export function stepFrame(current: number, step: number, durationFrames: number): number {
	const next = Math.round(current) + step;
	return clampFrame(next, durationFrames);
}

/** The frame the playhead jumps to for Home. */
export function jumpHome(): number {
	return 0;
}

/** The frame the playhead jumps to for End. */
export function jumpEnd(durationFrames: number): number {
	return durationFrames;
}
