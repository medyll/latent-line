import { describe, it, expect } from 'vitest';
import { modelSchema, buildDefaultModel } from './model-template';

describe('Config schema (S12-04)', () => {
	it('accepts a fully-populated config', () => {
		const model = buildDefaultModel();
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(true);
	});

	it('accepts an empty config (all fields optional)', () => {
		const model = buildDefaultModel();
		model.config = {};
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(true);
	});

	it('accepts config with only checkpoint set', () => {
		const model = buildDefaultModel();
		model.config = { checkpoint: 'flux_dev.safetensors' };
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(true);
	});

	it('rejects seed as a string', () => {
		const model = buildDefaultModel();
		(model.config as any).seed = 'not-a-number';
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(false);
	});

	it('accepts seed as a valid integer', () => {
		const model = buildDefaultModel();
		model.config.seed = 999999;
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(true);
	});

	it('accepts audioLanes when valid', () => {
		const model = buildDefaultModel();
		model.config.audioLanes = [
			{ id: 'lane-1', name: 'Music', muted: false, soloed: false },
			{ id: 'lane-2', name: 'SFX', muted: true, soloed: false }
		];
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(true);
	});

	it('rejects audioLanes missing required fields', () => {
		const model = buildDefaultModel();
		(model.config as any).audioLanes = [{ id: 'lane-1' }]; // missing name, muted, soloed
		const result = modelSchema.safeParse(model);
		expect(result.success).toBe(false);
	});

	it('buildDefaultModel provides sensible defaults', () => {
		const model = buildDefaultModel();
		expect(model.config.checkpoint).toBeTruthy();
		expect(model.config.sampler).toBeTruthy();
		expect(typeof model.config.seed).toBe('number');
		expect(model.config.tts_engine).toBeTruthy();
		expect(Array.isArray(model.config.audioLanes)).toBe(true);
	});
});
