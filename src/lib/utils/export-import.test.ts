import { describe, it, expect } from 'vitest';
import { serializeModel, deserializeModel } from './export-import';
import exampleModel from '$lib/model/model-example';

describe('serializeModel (S12-02)', () => {
	it('returns success + valid JSON for a valid model', () => {
		const result = serializeModel(exampleModel);
		expect(result.success).toBe(true);
		if (!result.success) return;
		const parsed = JSON.parse(result.json);
		expect(parsed).toHaveProperty('project');
		expect(parsed).toHaveProperty('assets');
		expect(parsed).toHaveProperty('timeline');
		expect(parsed).toHaveProperty('config');
	});

	it('produces pretty-printed JSON (indented)', () => {
		const result = serializeModel(exampleModel);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.json).toContain('\n');
	});

	it('returns errors for an invalid model', () => {
		const result = serializeModel({ bad: 'data' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('limits error output to 8 issues max', () => {
		const result = serializeModel({});
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.errors.length).toBeLessThanOrEqual(8);
	});
});

describe('deserializeModel (S12-03)', () => {
	it('parses and validates a valid JSON string', () => {
		const json = JSON.stringify(exampleModel);
		const result = deserializeModel(json);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.project).toBeDefined();
		expect(result.data.assets).toBeDefined();
	});

	it('returns error for invalid JSON syntax', () => {
		const result = deserializeModel('not json {{{');
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.errors).toContain('Invalid JSON file.');
	});

	it('returns Zod errors for structurally invalid JSON', () => {
		const result = deserializeModel(JSON.stringify({ bad: 'data' }));
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('round-trip: serialize then deserialize returns equivalent model', () => {
		const exported = serializeModel(exampleModel);
		expect(exported.success).toBe(true);
		if (!exported.success) return;

		const imported = deserializeModel(exported.json);
		expect(imported.success).toBe(true);
		if (!imported.success) return;

		expect(imported.data.project.name).toBe(exampleModel.project.name);
		expect(imported.data.assets.characters).toHaveLength(exampleModel.assets.characters.length);
		expect(imported.data.timeline).toHaveLength(exampleModel.timeline.length);
	});
});
