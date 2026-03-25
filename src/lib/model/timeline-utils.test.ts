import { describe, it, expect } from 'vitest';
import { toTimelineArray } from './timeline-utils';

describe('toTimelineArray', () => {
	it('returns empty array for null/undefined', () => {
		expect(toTimelineArray(null)).toEqual([]);
		expect(toTimelineArray(undefined)).toEqual([]);
	});

	it('returns shallow copy of array input', () => {
		const input = [
			{ time: 2, frame: {} },
			{ time: 1, frame: {} }
		] as any;
		const result = toTimelineArray(input);
		expect(result).toHaveLength(2);
		expect(result).not.toBe(input); // shallow copy
	});

	it('converts record to sorted array by time', () => {
		const input = {
			b: { time: 10, frame: {} },
			a: { time: 5, frame: {} },
			c: { time: 20, frame: {} }
		};
		const result = toTimelineArray(input);
		expect(result.map((e) => e.time)).toEqual([5, 10, 20]);
	});

	it('returns empty array for primitives', () => {
		expect(toTimelineArray(42)).toEqual([]);
		expect(toTimelineArray('string')).toEqual([]);
	});

	it('handles empty object', () => {
		expect(toTimelineArray({})).toEqual([]);
	});

	it('handles empty array', () => {
		expect(toTimelineArray([])).toEqual([]);
	});
});
