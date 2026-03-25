import { describe, it, expect } from 'vitest';
import { exportToCSV } from './export-csv';
import { buildDefaultModel } from '$lib/model/model-template';
import type { Model } from '$lib/model/model-types';

function emptyModel(): Model {
	return {
		project: { name: 'Test', fps: 24, resolution: { w: 1920, h: 1080 } },
		assets: { characters: [], environments: {}, audio: [] },
		timeline: [],
		config: {}
	};
}

describe('exportToCSV', () => {
	it('starts with UTF-8 BOM', () => {
		const csv = exportToCSV(emptyModel());
		expect(csv.startsWith('\uFEFF')).toBe(true);
	});

	it('includes headers', () => {
		const csv = exportToCSV(emptyModel());
		expect(csv).toContain('frame_start');
		expect(csv).toContain('character');
		expect(csv).toContain('mood');
	});

	it('produces one row per event', () => {
		const model = emptyModel();
		model.timeline = [
			{ time: 0, duration: 24, frame: {} },
			{ time: 24, duration: 24, frame: {} }
		];
		const rows = exportToCSV(model).split('\r\n');
		// BOM is prepended to header row → [BOM+header, row1, row2] = 3
		expect(rows.length).toBe(3);
	});

	it('escapes double-quotes per RFC 4180', () => {
		const model = emptyModel();
		model.assets.characters = [{ id: 'c1', name: "O'Brien", references: [] }];
		model.timeline = [
			{
				time: 0,
				duration: 24,
				frame: { actors: [{ id: 'c1', speech: { text: 'He said "hello"', mood: 'joyful' } }] }
			}
		];
		const csv = exportToCSV(model);
		expect(csv).toContain('""hello""');
	});

	it('sorts events by time', () => {
		const model = emptyModel();
		model.timeline = [
			{ time: 48, duration: 24, frame: {} },
			{ time: 0, duration: 24, frame: {} }
		];
		const rows = exportToCSV(model).split('\r\n');
		// row 1 (index 1 after header): frame_start should be 0
		expect(rows[1]).toContain(',0,');
	});

	it('works with the default model', () => {
		const csv = exportToCSV(buildDefaultModel());
		expect(csv).toContain('frame_start');
		expect(csv.split('\r\n').length).toBeGreaterThan(2);
	});
});
