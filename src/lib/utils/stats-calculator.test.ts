import { describe, it, expect } from 'vitest';
import {
	calculateStats,
	formatDuration,
	getTopCharacters,
	getMoodBreakdown,
	exportStatsToJson
} from '$lib/utils/stats-calculator';
import type { Model } from '$lib/model/model-types';

const sampleModel: Model = {
	project: { name: 'Test', fps: 24, resolution: { w: 1920, h: 1080 } },
	assets: {
		characters: [
			{ id: 'char_01', name: 'Hero', references: [] },
			{ id: 'char_02', name: 'Villain', references: [] }
		],
		environments: {},
		audio: []
	},
	timeline: [
		{
			time: 0,
			duration: 24,
			frame: {
				actors: [{ id: 'char_01', speech: { text: 'Hello', mood: 'joyful' } }],
				lighting: { type: 'daylight' },
				camera: { zoom: 1.2 }
			}
		},
		{
			time: 1000,
			duration: 48,
			frame: {
				actors: [
					{ id: 'char_01', speech: { text: 'Goodbye', mood: 'melancholic' } },
					{ id: 'char_02' }
				],
				lighting: { type: 'dusk' },
				fx: { bloom: 0.5 }
			}
		},
		{
			time: 2000,
			duration: 24,
			frame: {
				actors: [{ id: 'char_02', speech: { text: 'Wait', mood: 'anxious' } }],
				audio_tracks: [{ id: 'audio_01' }]
			}
		}
	],
	config: {},
	markers: [
		{
			id: 'marker_01',
			time: 500,
			type: 'chapter',
			label: 'Chapter 1',
			createdAt: 0,
			updatedAt: 0
		}
	]
};

describe('calculateStats', () => {
	it('calculates total events', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.totalEvents).toBe(3);
	});

	it('calculates total duration', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.totalDuration).toBe(2024); // 2000 + 24
	});

	it('calculates character screen time', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.characterScreenTime.get('char_01')).toBe(72); // 24 + 48
		expect(stats.characterScreenTime.get('char_02')).toBe(72); // 48 + 24
	});

	it('calculates mood distribution', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.moodDistribution.joyful).toBe(1);
		expect(stats.moodDistribution.melancholic).toBe(1);
		expect(stats.moodDistribution.anxious).toBe(1);
	});

	it('calculates lighting distribution', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.lightingDistribution.daylight).toBe(1);
		expect(stats.lightingDistribution.dusk).toBe(1);
	});

	it('counts audio tracks', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.audioTrackCount).toBe(1);
	});

	it('counts markers', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.markerCount).toBe(1);
	});

	it('calculates average event duration', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.averageEventDuration).toBe(32); // (24 + 48 + 24) / 3
	});

	it('counts camera movements', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.cameraMovementCount).toBe(1);
	});

	it('counts FX usage', () => {
		const stats = calculateStats(sampleModel);
		expect(stats.fxCount).toBe(1);
	});

	it('handles empty timeline', () => {
		const emptyModel: Model = {
			project: { name: 'Empty', fps: 24, resolution: { w: 1920, h: 1080 } },
			assets: { characters: [], environments: {}, audio: [] },
			timeline: [],
			config: {}
		};
		const stats = calculateStats(emptyModel);
		expect(stats.totalEvents).toBe(0);
		expect(stats.totalDuration).toBe(0);
		expect(stats.averageEventDuration).toBe(0);
	});
});

describe('formatDuration', () => {
	it('formats seconds', () => {
		expect(formatDuration(5000)).toBe('5s');
	});

	it('formats minutes', () => {
		expect(formatDuration(65000)).toBe('1m 5s');
	});

	it('formats hours', () => {
		expect(formatDuration(3665000)).toBe('1h 1m');
	});

	it('formats zero', () => {
		expect(formatDuration(0)).toBe('0s');
	});
});

describe('getTopCharacters', () => {
	it('returns top characters by screen time', () => {
		const topChars = getTopCharacters(sampleModel);
		expect(topChars.length).toBe(2);
		expect(topChars[0].id).toBe('char_01');
		expect(topChars[1].id).toBe('char_02');
	});

	it('includes percentage', () => {
		const topChars = getTopCharacters(sampleModel);
		expect(topChars[0].percentage).toBeDefined();
		expect(topChars[0].percentage).toBeGreaterThan(0);
	});

	it('respects limit parameter', () => {
		const topChars = getTopCharacters(sampleModel, 1);
		expect(topChars.length).toBe(1);
	});
});

describe('getMoodBreakdown', () => {
	it('returns mood breakdown with percentages', () => {
		const breakdown = getMoodBreakdown(sampleModel);
		expect(breakdown.length).toBe(3);
		expect(breakdown[0].percentage).toBe(33); // 1/3
	});

	it('sorts by count descending', () => {
		const breakdown = getMoodBreakdown(sampleModel);
		for (let i = 1; i < breakdown.length; i++) {
			expect(breakdown[i - 1].count).toBeGreaterThanOrEqual(breakdown[i].count);
		}
	});
});

describe('exportStatsToJson', () => {
	it('exports stats as valid JSON', () => {
		const json = exportStatsToJson(sampleModel);
		const parsed = JSON.parse(json);
		expect(parsed.totalEvents).toBe(3);
		expect(parsed.totalDuration).toBe(2024);
		expect(parsed.characterScreenTime).toBeDefined();
		expect(parsed.moodDistribution).toBeDefined();
	});

	it('includes formatted duration', () => {
		const json = exportStatsToJson(sampleModel);
		const parsed = JSON.parse(json);
		expect(parsed.totalDurationFormatted).toBeDefined();
	});
});
