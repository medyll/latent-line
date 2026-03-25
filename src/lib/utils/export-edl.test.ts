import { describe, it, expect } from 'vitest';
import {
	frameToTimecode,
	timecodeToFrame,
	validateTimelineForEDL,
	exportToEDL
} from './export-edl';
import type { Model } from '$lib/model/model-types';

function makeTestModel(): Model {
	return {
		project: { name: 'Test Project', fps: 24, resolution: { w: 1920, h: 1080 } },
		assets: {
			characters: [{ id: 'c1', name: 'Alice', references: [] }],
			environments: { forest: { prompt: 'forest' } },
			audio: []
		},
		timeline: [
			{
				time: 0,
				duration: 24, // 1 second at 24fps
				frame: {
					actors: [{ id: 'c1', action: 'walking', speech: { text: 'Hello', mood: 'happy' } }]
				}
			},
			{
				time: 24,
				duration: 48, // 2 seconds
				frame: {
					actors: [{ id: 'c1', action: 'running' }]
				}
			},
			{
				time: 72,
				duration: 24,
				frame: { actors: [{ id: 'c1', action: 'stopping' }] }
			}
		],
		config: {}
	};
}

describe('frameToTimecode', () => {
	it('converts frame 0 to 00:00:00:00', () => {
		expect(frameToTimecode(0, 24)).toBe('00:00:00:00');
	});

	it('converts frame 24 (1 second) to 00:00:01:00', () => {
		expect(frameToTimecode(24, 24)).toBe('00:00:01:00');
	});

	it('converts frame 25 (1 second + 1 frame) to 00:00:01:01', () => {
		expect(frameToTimecode(25, 24)).toBe('00:00:01:01');
	});

	it('converts frame 1440 (60 seconds) to 00:01:00:00', () => {
		expect(frameToTimecode(1440, 24)).toBe('00:01:00:00');
	});

	it('handles 30fps correctly', () => {
		expect(frameToTimecode(30, 30)).toBe('00:00:01:00');
		expect(frameToTimecode(31, 30)).toBe('00:00:01:01');
	});
});

describe('timecodeToFrame', () => {
	it('converts 00:00:00:00 to frame 0', () => {
		expect(timecodeToFrame('00:00:00:00', 24)).toBe(0);
	});

	it('converts 00:00:01:00 to frame 24', () => {
		expect(timecodeToFrame('00:00:01:00', 24)).toBe(24);
	});

	it('converts 00:00:01:05 to frame 29', () => {
		expect(timecodeToFrame('00:00:01:05', 24)).toBe(29);
	});

	it('roundtrip conversion preserves value', () => {
		const fps = 24;
		for (let frame = 0; frame < 1000; frame += 100) {
			const tc = frameToTimecode(frame, fps);
			const roundtrip = timecodeToFrame(tc, fps);
			expect(roundtrip).toBe(frame);
		}
	});
});

describe('validateTimelineForEDL', () => {
	it('validates clean timeline', () => {
		const result = validateTimelineForEDL(makeTestModel());
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('rejects empty timeline', () => {
		const model = makeTestModel();
		model.timeline = [];
		const result = validateTimelineForEDL(model);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('empty');
	});

	it('detects overlapping events', () => {
		const model = makeTestModel();
		model.timeline[1].time = 10; // Overlap with first event (0-24)
		const result = validateTimelineForEDL(model);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('overlaps');
	});

	it('detects gaps > 1 frame', () => {
		const model = makeTestModel();
		model.timeline[1].time = 100; // Gap of 76 frames (24 + 24 + gap = 100)
		const result = validateTimelineForEDL(model);
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain('Gap');
	});
});

describe('exportToEDL', () => {
	it('returns valid EDL format', () => {
		const edl = exportToEDL(makeTestModel());
		expect(typeof edl).toBe('string');
		expect(edl).toContain('TITLE:');
		expect(edl).toContain('FCM:');
	});

	it('includes event entries', () => {
		const edl = exportToEDL(makeTestModel());
		expect(edl).toContain('001'); // First event number
		expect(edl).toContain('002'); // Second event number
		expect(edl).toContain('003'); // Third event number
	});

	it('includes character names as reels', () => {
		const edl = exportToEDL(makeTestModel());
		expect(edl).toContain('ALICE');
	});

	it('includes action comments', () => {
		const edl = exportToEDL(makeTestModel());
		expect(edl).toContain('ACTION:');
		expect(edl).toContain('walking');
	});

	it('includes mood comments', () => {
		const edl = exportToEDL(makeTestModel());
		expect(edl).toContain('MOOD:');
	});

	it('throws on invalid timeline', () => {
		const model = makeTestModel();
		model.timeline = [];
		expect(() => exportToEDL(model)).toThrow();
	});

	it('generates correct timecodes', () => {
		const edl = exportToEDL(makeTestModel());
		// First event: 0-24 frames = 00:00:00:00 to 00:00:01:00
		expect(edl).toContain('00:00:00:00');
		expect(edl).toContain('00:00:01:00');
	});
});
