import { describe, it, expect } from 'vitest';
import {
	tickFrame,
	clampFrame,
	seekFromPixel,
	frameToPixel,
	computeDuration,
	hasReachedEnd,
	DEFAULT_FPS
} from './playback';

describe('playback engine (S13-04)', () => {
	describe('tickFrame', () => {
		it('advances by correct frames for elapsed time at 24fps', () => {
			// 1000ms at 24fps = 24 frames
			expect(tickFrame(0, 1000)).toBe(24);
		});

		it('advances fractionally for sub-frame elapsed time', () => {
			// 500ms at 24fps = 12 frames
			expect(tickFrame(0, 500)).toBe(12);
		});

		it('accumulates from non-zero start', () => {
			expect(tickFrame(10, 1000)).toBe(34);
		});

		it('uses custom fps', () => {
			expect(tickFrame(0, 1000, 30)).toBe(30);
		});
	});

	describe('clampFrame', () => {
		it('clamps above duration', () => {
			expect(clampFrame(200, 100)).toBe(100);
		});

		it('clamps below zero', () => {
			expect(clampFrame(-5, 100)).toBe(0);
		});

		it('passes through value within range', () => {
			expect(clampFrame(50, 100)).toBe(50);
		});
	});

	describe('seekFromPixel', () => {
		it('converts pixel offset to frame at 24px/frame', () => {
			expect(seekFromPixel(48, 24)).toBe(2);
		});

		it('rounds to nearest frame', () => {
			expect(seekFromPixel(25, 24)).toBe(1); // 25/24 ≈ 1.04 → rounds to 1
		});

		it('clamps negative pixel to 0', () => {
			expect(seekFromPixel(-100, 24)).toBe(0);
		});
	});

	describe('frameToPixel', () => {
		it('converts frame to pixel offset', () => {
			expect(frameToPixel(2, 24)).toBe(48);
		});

		it('returns 0 for frame 0', () => {
			expect(frameToPixel(0, 24)).toBe(0);
		});

		it('is inverse of seekFromPixel for whole frames', () => {
			const frame = 5;
			const px = frameToPixel(frame, 24);
			expect(seekFromPixel(px, 24)).toBe(frame);
		});
	});

	describe('computeDuration', () => {
		it('returns padding only for empty timeline', () => {
			expect(computeDuration([])).toBe(48);
		});

		it('uses max time + padding', () => {
			expect(computeDuration([10, 50, 30])).toBe(50 + 48);
		});

		it('accepts custom padding', () => {
			expect(computeDuration([100], 24)).toBe(124);
		});
	});

	describe('hasReachedEnd', () => {
		it('returns true when frame equals duration', () => {
			expect(hasReachedEnd(100, 100)).toBe(true);
		});

		it('returns true when frame exceeds duration', () => {
			expect(hasReachedEnd(101, 100)).toBe(true);
		});

		it('returns false when frame is before end', () => {
			expect(hasReachedEnd(99, 100)).toBe(false);
		});
	});

	it('DEFAULT_FPS is 24', () => {
		expect(DEFAULT_FPS).toBe(24);
	});
});
