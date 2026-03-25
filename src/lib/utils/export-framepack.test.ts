import { describe, it, expect } from 'vitest';
import { exportToFramePack } from './export-framepack';
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
					actors: [{ id: 'c1', action: 'running', speech: { text: 'Go!', mood: 'anxious' } }],
					camera: { zoom: 1.5, pan: [0.1, -0.2], tilt: 10 },
					lighting: { type: 'dusk', intensity: 0.8 },
					fx: { bloom: 0.5, motion_blur: 0.2 }
				}
			},
			{
				time: 24,
				duration: 24,
				frame: {
					actors: [{ id: 'c1', action: 'resting', speech: { text: 'Safe', mood: 'serene' } }],
					camera: { zoom: 1.0 }
				}
			}
		],
		config: { seed: 42 }
	};
}

describe('exportToFramePack', () => {
	it('returns JSONL format (one JSON per line)', () => {
		const framepack = exportToFramePack(makeTestModel());
		const lines = framepack.split('\n');
		expect(lines.length).toBe(2); // 2 frames
		expect(() => JSON.parse(lines[0])).not.toThrow();
		expect(() => JSON.parse(lines[1])).not.toThrow();
	});

	it('includes frame, prompt, character info', () => {
		const framepack = exportToFramePack(makeTestModel());
		const frames = framepack.split('\n').map((line) => JSON.parse(line));

		expect(frames[0].frame).toBe(0);
		expect(frames[0].prompt).toBeTruthy();
		expect(frames[0].character_id).toBe('c1');
		expect(frames[0].character_name).toBe('Alice');
	});

	it('includes camera, lighting, and effects data', () => {
		const framepack = exportToFramePack(makeTestModel());
		const frame0 = JSON.parse(framepack.split('\n')[0]);

		expect(frame0.camera).toBeDefined();
		expect(frame0.camera.zoom).toBe(1.5);
		expect(frame0.camera.pan).toEqual([0.1, -0.2]);
		expect(frame0.camera.tilt).toBe(10);

		expect(frame0.lighting).toBeDefined();
		expect(frame0.lighting.type).toBe('dusk');
		expect(frame0.lighting.intensity).toBe(0.8);

		expect(frame0.effects).toBeDefined();
		expect(frame0.effects.bloom).toBe(0.5);
		expect(frame0.effects.motion_blur).toBe(0.2);
	});

	it('includes metadata with version and duration', () => {
		const framepack = exportToFramePack(makeTestModel());
		const frame0 = JSON.parse(framepack.split('\n')[0]);

		expect(frame0.metadata).toBeDefined();
		expect(frame0.metadata.version).toBe('1.0');
		expect(frame0.metadata.duration).toBe(24);
	});

	it('sorts frames by time', () => {
		const model = makeTestModel();
		model.timeline.reverse();
		const framepack = exportToFramePack(model);
		const frames = framepack.split('\n').map((line) => JSON.parse(line));

		expect(frames[0].frame).toBe(0);
		expect(frames[1].frame).toBe(24);
	});
});
