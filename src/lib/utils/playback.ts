/**
 * Pure playback engine utilities — framework-agnostic, fully testable.
 * SequenceOrchestrator uses these internally for tick calculation and seeking.
 */

export const DEFAULT_FPS = 24;

export interface PlaybackState {
	currentFrame: number;
	isPlaying: boolean;
	durationFrames: number;
}

/** Advance playhead by elapsed milliseconds. Returns new frame, clamped to duration. */
export function tickFrame(currentFrame: number, elapsedMs: number, fps = DEFAULT_FPS): number {
	return currentFrame + (elapsedMs / 1000) * fps;
}

/** Clamp a frame value within [0, duration]. */
export function clampFrame(frame: number, durationFrames: number): number {
	return Math.max(0, Math.min(frame, durationFrames));
}

/** Seek to a pixel offset, converting to frame number. */
export function seekFromPixel(px: number, pixelsPerFrame: number): number {
	return Math.max(0, Math.round(px / pixelsPerFrame));
}

/** Convert a frame number to a pixel offset. */
export function frameToPixel(frame: number, pixelsPerFrame: number): number {
	return frame * pixelsPerFrame;
}

/** Compute total duration in frames from a sorted timeline (last event time). */
export function computeDuration(timelineTimes: number[], paddingFrames = 48): number {
	if (timelineTimes.length === 0) return paddingFrames;
	return Math.max(...timelineTimes) + paddingFrames;
}

/** Returns true if playback should stop (reached or passed end). */
export function hasReachedEnd(frame: number, durationFrames: number): boolean {
	return frame >= durationFrames;
}
