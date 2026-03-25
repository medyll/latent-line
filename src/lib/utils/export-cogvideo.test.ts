import { describe, it, expect } from 'vitest';
import { exportToCogVideoX } from './export-cogvideo';
import type { Model } from '$lib/model/model-types';

function makeTestModel(): Model {
	return {
		project: { name: 'Test', fps: 24, resolution: { w: 1920, h: 1080 } },
		assets: {
			characters: [{ id: 'c1', name: 'Alice', references: [] }],
			environments: { forest: { prompt: 'enchanted forest' } },
			audio: []
		},
		timeline: [
			{
				time: 0,
				duration: 24,
				frame: {
					actors: [{ id: 'c1', action: 'running', speech: { text: 'Go!' } }],
					camera: { zoom: 1.5, tilt: 10 },
					lighting: { type: 'daylight', intensity: 1.0 }
				}
			},
			{
				time: 24,
				duration: 24,
				frame: {
					actors: [{ id: 'c1', action: 'resting' }],
					camera: { zoom: 1.0 },
					lighting: { type: 'dusk' }
				}
			}
		],
		config: {}
	};
}

describe('exportToCogVideoX', () => {
	it('returns plain text script format', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(typeof script).toBe('string');
		expect(script.length).toBeGreaterThan(0);
	});

	it('includes metadata section with version, fps, resolution', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('[METADATA]');
		expect(script).toContain('version = 1.0');
		expect(script).toContain('fps = 24');
		expect(script).toContain('width = 1920');
		expect(script).toContain('height = 1080');
	});

	it('includes keyframe declarations', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('[KEYFRAMES]');
		expect(script).toContain('[KEYFRAME_0]');
		expect(script).toContain('[KEYFRAME_1]');
		expect(script).toContain('frame = 0');
		expect(script).toContain('frame = 24');
	});

	it('includes prompt and camera info in keyframes', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('prompt = "');
		expect(script).toContain('camera = "');
		expect(script).toContain('duration = 24');
	});

	it('includes lighting and effects metadata', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('lighting = "');
		expect(script).toContain('intensity = ');
	});

	it('includes interpolation section for gaps between keyframes', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('[INTERPOLATION]');
		expect(script).toContain('interpolate(');
	});

	it('sorts frames by time', () => {
		const model = makeTestModel();
		model.timeline.reverse();
		const script = exportToCogVideoX(model);
		const keyframe0Index = script.indexOf('[KEYFRAME_0]');
		const keyframe1Index = script.indexOf('[KEYFRAME_1]');
		expect(keyframe0Index).toBeLessThan(keyframe1Index);
	});

	it('describes camera motion correctly', () => {
		const script = exportToCogVideoX(makeTestModel());
		expect(script).toContain('zoom 1.50x');
		expect(script).toContain('tilt 10°');
	});
});
