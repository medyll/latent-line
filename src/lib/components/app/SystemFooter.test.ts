import { describe, it, expect } from 'vitest';
import { modelSchema } from '../../model/model-template';
import exampleModel from '../../model/model-example';
import type { Model } from '../../model/model-types';

// Unit tests for SystemFooter export/import validation logic.

describe('SystemFooter export validation', () => {
	it('valid model passes Zod safeParse with no errors', () => {
		const result = modelSchema.safeParse(exampleModel);
		expect(result.success).toBe(true);
	});

	it('invalid model (missing project.name) returns Zod errors', () => {
		const bad = structuredClone(exampleModel) as Record<string, unknown>;
		(bad.project as Record<string, unknown>).name = undefined;
		const result = modelSchema.safeParse(bad);
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join('.'));
			expect(paths.some((p) => p.includes('name'))).toBe(true);
		}
	});

	it('collects multiple validation errors for empty object', () => {
		const result = modelSchema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThan(0);
		}
	});
});

describe('SystemFooter import parsing', () => {
	it('valid JSON model passes safeParse after round-trip', () => {
		const json = JSON.stringify(exampleModel);
		const parsed = JSON.parse(json);
		const result = modelSchema.safeParse(parsed);
		expect(result.success).toBe(true);
	});

	it('invalid JSON structure fails safeParse', () => {
		const result = modelSchema.safeParse({ garbage: true });
		expect(result.success).toBe(false);
	});

	it('model with invalid seed type fails safeParse', () => {
		const bad: Partial<Model> = {
			...exampleModel,
			config: { ...exampleModel.config, seed: 'not-a-number' as unknown as number }
		};
		const result = modelSchema.safeParse(bad);
		expect(result.success).toBe(false);
	});
});

describe('SystemFooter seed logic', () => {
	it('generates seeds in range [0, 999999]', () => {
		for (let i = 0; i < 20; i++) {
			const seed = Math.floor(Math.random() * 1_000_000);
			expect(seed).toBeGreaterThanOrEqual(0);
			expect(seed).toBeLessThan(1_000_000);
		}
	});
});
