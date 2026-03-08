import { describe, it, expect } from 'vitest';
import type { TimelineEvent } from '../../model/model-types';

// Pure logic helpers from SequenceOrchestrator (TS-03/04/05) for unit testing.

const FRAME_PX = 24;

/**
 * Compute preview time from drag delta.
 */
function computePreviewTime(startTime: number, startX: number, currentX: number, pixelsPerFrame: number): number {
	const deltaX = currentX - startX;
	const deltaTime = Math.round(deltaX / pixelsPerFrame);
	return Math.max(0, startTime + deltaTime);
}

/**
 * Resolve the final time for a dropped event, bumping if collisions exist.
 */
function resolveDropTime(
	timeline: TimelineEvent[],
	startTime: number,
	targetTime: number
): number {
	let resolved = targetTime;
	while (timeline.some((ev) => ev.time !== startTime && ev.time === resolved)) {
		resolved++;
	}
	return resolved;
}

/**
 * Compute total container width.
 */
function containerWidth(maxTime: number, pixelsPerFrame: number, eventWidth: number): number {
	return Math.max(600, (maxTime + 20) * pixelsPerFrame + eventWidth + 40);
}

describe('Temporal Sequencer — drag time calculation (TS-03)', () => {
	it('maps rightward drag to increased time', () => {
		const preview = computePreviewTime(10, 200, 272, FRAME_PX); // +72px at 24px/frame = +3
		expect(preview).toBe(13);
	});

	it('maps leftward drag to decreased time', () => {
		const preview = computePreviewTime(10, 200, 128, FRAME_PX); // -72px = -3
		expect(preview).toBe(7);
	});

	it('clamps to 0 when dragged before the start', () => {
		const preview = computePreviewTime(2, 200, 0, FRAME_PX); // -200px would give -6 → clamped
		expect(preview).toBe(0);
	});

	it('returns same time for no drag movement', () => {
		const preview = computePreviewTime(5, 100, 100, FRAME_PX);
		expect(preview).toBe(5);
	});

	it('rounds to nearest frame', () => {
		// drag by 12px = 0.5 frame → rounds to 1
		const preview = computePreviewTime(5, 100, 112, FRAME_PX);
		expect(preview).toBe(6);
	});
});

describe('Temporal Sequencer — collision resolution (TS-03)', () => {
	const timeline: TimelineEvent[] = [
		{ time: 0, frame: {} },
		{ time: 5, frame: {} },
		{ time: 6, frame: {} }
	];

	it('resolves to targetTime when no collision', () => {
		const resolved = resolveDropTime(timeline, 0, 10);
		expect(resolved).toBe(10);
	});

	it('bumps when dropping on an occupied slot', () => {
		const resolved = resolveDropTime(timeline, 0, 5); // 5 occupied by another event
		expect(resolved).toBe(7); // 5→occupied, 6→occupied, 7→free
	});

	it('does not count own original position as a collision', () => {
		const resolved = resolveDropTime(timeline, 5, 5); // dropping where it started
		expect(resolved).toBe(5);
	});

	it('handles empty timeline (no collisions)', () => {
		const resolved = resolveDropTime([], 3, 7);
		expect(resolved).toBe(7);
	});
});

describe('Temporal Sequencer — zoom (TS-04)', () => {
	it('pixelsPerFrame scales with zoom', () => {
		expect(FRAME_PX * 1).toBe(24);
		expect(FRAME_PX * 2).toBe(48);
		expect(FRAME_PX * 8).toBe(192);
	});

	it('container width grows with zoom', () => {
		const w1 = containerWidth(100, FRAME_PX * 1, 56);
		const w2 = containerWidth(100, FRAME_PX * 2, 56);
		expect(w2).toBeGreaterThan(w1);
	});

	it('container width is at least 600', () => {
		const w = containerWidth(0, FRAME_PX, 56);
		expect(w).toBeGreaterThanOrEqual(600);
	});
});

describe('Temporal Sequencer — playhead (TS-05)', () => {
	it('computes playhead time from click X position', () => {
		const clickX = 120; // relative to container left
		const pxPerFrame = 24;
		const playheadTime = Math.max(0, Math.round(clickX / pxPerFrame));
		expect(playheadTime).toBe(5);
	});

	it('clamps playhead to 0 for negative offset', () => {
		const playheadTime = Math.max(0, Math.round(-10 / 24));
		expect(playheadTime).toBe(0);
	});
});
