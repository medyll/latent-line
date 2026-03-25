import { describe, it, expect } from 'vitest';
import {
	buildPrompt,
	exportToPromptsTxt,
	exportToPromptsJson,
	exportToDeforumFormat
} from './export-prompts';
import type { Model } from '$lib/model/model-types';

function makeModel(): Model {
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
					lighting: { type: 'dusk' },
					fx: { bloom: 0.5 }
				}
			},
			{
				time: 24,
				duration: 24,
				frame: {
					actors: [{ id: 'c1', action: 'resting', speech: { text: 'Safe', mood: 'serene' } }]
				}
			}
		],
		config: { seed: 42 }
	};
}

describe('buildPrompt', () => {
	it('composes character + action + mood + env + lighting + fx', () => {
		const model = makeModel();
		const p = buildPrompt(model.timeline[0], model);
		expect(p).toContain('Alice');
		expect(p).toContain('running');
		expect(p).toContain('anxious mood');
		expect(p).toContain('enchanted forest');
		expect(p).toContain('dusk');
		expect(p).toContain('bloom');
	});

	it('falls back to "scene" when no data', () => {
		const model = makeModel();
		const emptyAssets = { ...model.assets, environments: {} };
		const p = buildPrompt({ time: 99, frame: {} }, { ...model, assets: emptyAssets });
		expect(p).toBe('scene');
	});
});

describe('exportToPromptsTxt', () => {
	it('produces frame: prompt lines', () => {
		const txt = exportToPromptsTxt(makeModel());
		expect(txt).toMatch(/^0: /m);
		expect(txt).toMatch(/^24: /m);
	});

	it('sorts by time', () => {
		const model = makeModel();
		model.timeline.reverse();
		const lines = exportToPromptsTxt(model).split('\n');
		expect(lines[0]).toMatch(/^0:/);
	});
});

describe('exportToPromptsJson', () => {
	it('returns array with frame + prompt + negative_prompt', () => {
		const entries = exportToPromptsJson(makeModel());
		expect(entries[0].frame).toBe(0);
		expect(entries[0].prompt).toBeTruthy();
		expect(entries[0].negative_prompt).toContain('blur');
		expect(entries[0].seed).toBe(42);
	});

	it('omits negative_prompt when includeNegative=false', () => {
		const entries = exportToPromptsJson(makeModel(), false);
		expect(entries[0].negative_prompt).toBe('');
	});
});

describe('exportToDeforumFormat', () => {
	it('returns valid JSON-like dict', () => {
		const deforum = exportToDeforumFormat(makeModel());
		expect(deforum).toMatch(/^{/);
		expect(deforum).toContain('"0"');
		expect(deforum).toContain('"24"');
	});
});
