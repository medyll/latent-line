import { describe, it, expect } from 'vitest';
import {
	buildUsageIndex,
	findUnusedAssets,
	getUsageCount,
	getUsageDetails,
	isAssetUsed,
	getUsageSummary
} from '$lib/utils/asset-usage';
import type { Model } from '$lib/model/model-types';

const sampleModel: Model = {
	project: { name: 'Test', fps: 24, resolution: { w: 1920, h: 1080 } },
	assets: {
		characters: [
			{ id: 'char_01', name: 'Hero', references: [] },
			{ id: 'char_02', name: 'Villain', references: [] },
			{ id: 'char_03', name: 'Unused', references: [] }
		],
		environments: {
			env_01: { prompt: 'Forest', ref: '' },
			env_02: { prompt: 'City', ref: '' }
		},
		audio: [
			{ id: 'audio_01', url: 'https://example.com/music.mp3' },
			{ id: 'audio_02', url: 'https://example.com/sfx.wav' }
		]
	},
	timeline: [
		{
			time: 0,
			frame: {
				actors: [{ id: 'char_01' }],
				audio_tracks: [{ id: 'audio_01' }]
			}
		},
		{
			time: 1000,
			frame: {
				actors: [{ id: 'char_02' }, { id: 'char_01' }],
				audio_tracks: [{ id: 'audio_02' }]
			}
		}
	],
	config: {}
};

describe('buildUsageIndex', () => {
	it('builds usage index for all assets', () => {
		const usage = buildUsageIndex(sampleModel);
		expect(usage.size).toBe(7); // 3 chars + 2 envs + 2 audio
	});

	it('tracks character usage', () => {
		const usage = buildUsageIndex(sampleModel);
		const heroUsage = usage.get('char_01');
		expect(heroUsage).toBeDefined();
		expect(heroUsage!.usedIn.length).toBe(2); // Used in both events
		expect(heroUsage!.usedIn[0].context).toBe('actor');
	});

	it('tracks audio usage', () => {
		const usage = buildUsageIndex(sampleModel);
		const audioUsage = usage.get('audio_01');
		expect(audioUsage).toBeDefined();
		expect(audioUsage!.usedIn.length).toBe(1);
	});

	it('shows unused assets with empty usage', () => {
		const usage = buildUsageIndex(sampleModel);
		const unusedChar = usage.get('char_03');
		expect(unusedChar).toBeDefined();
		expect(unusedChar!.usedIn.length).toBe(0);
	});
});

describe('findUnusedAssets', () => {
	it('finds unused characters', () => {
		const unused = findUnusedAssets(sampleModel);
		expect(unused).toContain('char_03');
	});

	it('finds unused environments', () => {
		const unused = findUnusedAssets(sampleModel);
		expect(unused).toContain('env_01');
		expect(unused).toContain('env_02');
	});

	it('returns empty array when all assets used', () => {
		const model: Model = {
			...sampleModel,
			assets: {
				characters: [{ id: 'char_01', name: 'Hero', references: [] }],
				environments: {},
				audio: []
			},
			timeline: [
				{
					time: 0,
					frame: {
						actors: [{ id: 'char_01' }]
					}
				}
			]
		};
		const unused = findUnusedAssets(model);
		expect(unused).toHaveLength(0);
	});
});

describe('getUsageCount', () => {
	it('returns correct count for used character', () => {
		const count = getUsageCount(sampleModel, 'char_01');
		expect(count).toBe(2);
	});

	it('returns zero for unused character', () => {
		const count = getUsageCount(sampleModel, 'char_03');
		expect(count).toBe(0);
	});

	it('returns zero for non-existent asset', () => {
		const count = getUsageCount(sampleModel, 'nonexistent');
		expect(count).toBe(0);
	});
});

describe('getUsageDetails', () => {
	it('returns usage locations', () => {
		const details = getUsageDetails(sampleModel, 'char_01');
		expect(details).toHaveLength(2);
		expect(details[0].eventTime).toBe(0);
		expect(details[1].eventTime).toBe(1000);
	});

	it('returns empty array for unused asset', () => {
		const details = getUsageDetails(sampleModel, 'char_03');
		expect(details).toHaveLength(0);
	});
});

describe('isAssetUsed', () => {
	it('returns true for used asset', () => {
		expect(isAssetUsed(sampleModel, 'char_01')).toBe(true);
	});

	it('returns false for unused asset', () => {
		expect(isAssetUsed(sampleModel, 'char_03')).toBe(false);
	});
});

describe('getUsageSummary', () => {
	it('returns summary with correct counts', () => {
		const summary = getUsageSummary(sampleModel);
		expect(summary.characters.used).toBe(2); // char_01 and char_02
		expect(summary.characters.total).toBe(3);
		expect(summary.environments.used).toBe(0);
		expect(summary.environments.total).toBe(2);
		expect(summary.audio.used).toBe(2);
		expect(summary.audio.total).toBe(2);
	});

	it('handles empty model', () => {
		const emptyModel: Model = {
			project: { name: 'Empty', fps: 24, resolution: { w: 1920, h: 1080 } },
			assets: {
				characters: [],
				environments: {},
				audio: []
			},
			timeline: [],
			config: {}
		};
		const summary = getUsageSummary(emptyModel);
		expect(summary.characters.used).toBe(0);
		expect(summary.characters.total).toBe(0);
	});
});
