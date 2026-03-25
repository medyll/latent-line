import { describe, it, expect } from 'vitest';
import { searchModel, highlightMatch } from './search';
import type { Model } from '$lib/model/model-types';

function makeTestModel(): Model {
	return {
		project: { name: 'Test', fps: 24, resolution: { w: 1920, h: 1080 } },
		assets: {
			characters: [
				{ id: 'c1', name: 'Alice', voice_id: 'alice_001', references: [] },
				{ id: 'c2', name: 'Bob', references: [{ url: 'ref_url', context: 'angry character', weight: 1 }] }
			],
			environments: {
				forest: { prompt: 'enchanted forest with tall trees' },
				castle: { prompt: 'medieval castle at night' }
			},
			audio: [
				{ id: 'a1', url: 'sound_effect.mp3', label: 'door slam' },
				{ id: 'a2', url: 'music.mp3', label: 'dramatic music' }
			]
		},
		timeline: [
			{
				time: 0,
				duration: 24,
				frame: {
					actors: [
						{
							id: 'c1',
							action: 'walking slowly',
							speech: { text: 'Hello Bob', mood: 'curious' }
						}
					]
				}
			},
			{
				time: 24,
				duration: 24,
				frame: {
					actors: [{ id: 'c2', action: 'running fast', speech: { text: 'Watch out!' } }]
				}
			}
		],
		config: {}
	};
}

describe('searchModel', () => {
	it('searches events by action', () => {
		const results = searchModel(makeTestModel(), 'walking');
		expect(results.has('events')).toBe(true);
		expect(results.get('events')![0].matched_field).toBe('action');
	});

	it('searches events by speech', () => {
		const results = searchModel(makeTestModel(), 'hello');
		expect(results.get('events')).toBeDefined();
		expect(results.get('events')![0].matched_field).toBe('speech');
	});

	it('searches events by mood', () => {
		const results = searchModel(makeTestModel(), 'curious');
		expect(results.get('events')).toBeDefined();
		expect(results.get('events')![0].matched_field).toBe('mood');
	});

	it('searches events by character name', () => {
		const results = searchModel(makeTestModel(), 'Alice');
		const eventResults = results.get('events');
		expect(eventResults).toBeDefined();
		expect(eventResults![0].context).toContain('Alice');
	});

	it('searches characters by name', () => {
		const results = searchModel(makeTestModel(), 'alice');
		expect(results.has('characters')).toBe(true);
		expect(results.get('characters')![0].title).toBe('Alice');
	});

	it('searches characters by voice_id', () => {
		const results = searchModel(makeTestModel(), 'alice_001');
		expect(results.get('characters')).toBeDefined();
	});

	it('searches environments by prompt', () => {
		const results = searchModel(makeTestModel(), 'enchanted');
		expect(results.has('environments')).toBe(true);
		expect(results.get('environments')![0].title).toBe('forest');
	});

	it('searches audio by label', () => {
		const results = searchModel(makeTestModel(), 'door slam');
		expect(results.has('audio')).toBe(true);
		expect(results.get('audio')![0].title).toBe('door slam');
	});

	it('is case-insensitive', () => {
		const lower = searchModel(makeTestModel(), 'alice');
		const upper = searchModel(makeTestModel(), 'ALICE');
		expect(lower.size).toBe(upper.size);
	});

	it('removes empty categories', () => {
		const results = searchModel(makeTestModel(), 'xyz_no_match');
		expect(results.size).toBe(0);
	});

	it('returns multiple results', () => {
		const results = searchModel(makeTestModel(), 'fast');
		const eventResults = results.get('events');
		expect(eventResults?.length).toBeGreaterThan(0);
	});
});

describe('highlightMatch', () => {
	it('highlights matching term', () => {
		const result = highlightMatch('hello world', 'world');
		expect(result.before).toBe('hello ');
		expect(result.match).toBe('world');
		expect(result.after).toBe('');
	});

	it('handles no match', () => {
		const result = highlightMatch('hello world', 'xyz');
		expect(result.match).toBe('');
	});

	it('is case-insensitive', () => {
		const result = highlightMatch('Hello World', 'hello');
		expect(result.before).toBe('');
		expect(result.match).toBe('Hello');
	});

	it('highlights first match only', () => {
		const result = highlightMatch('apple apple apple', 'apple');
		expect(result.before).toBe('');
		expect(result.match).toBe('apple');
		expect(result.after).toBe(' apple apple');
	});
});
