import { describe, it, expect } from 'vitest';
import { formatFramesToTime, formatFramesLabel } from './time-format';

describe('time-format utilities', () => {
	it('formats 72 frames at 24fps as 0:03', () => {
		expect(formatFramesToTime(72, 24)).toBe('0:03');
	});

	it('formats multi-minute durations correctly', () => {
		// 1560 frames / 24fps = 65s = 1:05
		expect(formatFramesToTime(1560, 24)).toBe('1:05');
	});

	it('formats current/total labels', () => {
		expect(formatFramesLabel(72, 240, 24)).toBe('0:03 / 0:10');
	});
});
