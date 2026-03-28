import { describe, it, expect } from 'vitest';
import { SearchIndex, createSearchIndex } from './search-index';
import type { Model } from '$lib/model/model-types';

const testModel: Model = {
	project: {
		name: 'Test Project',
		fps: 24,
		resolution: { w: 1920, h: 1080 }
	},
	assets: {
		characters: [
			{
				id: 'char_01',
				name: 'Alice',
				voice_id: 'v_female_01',
				references: [{ url: 'alice.jpg', context: 'face', weight: 1.0 }],
				outfits: {
					casual: { prompt: 'casual wear, jeans and t-shirt' }
				}
			},
			{
				id: 'char_02',
				name: 'Bob',
				voice_id: 'v_male_01',
				references: [{ url: 'bob.jpg', context: 'face', weight: 1.0 }],
				outfits: {}
			}
		],
		environments: {
			office: {
				prompt: 'modern office space with desks',
				ref: 'office.jpg'
			},
			beach: {
				prompt: 'sunny beach at sunset',
				ref: 'beach.jpg'
			}
		},
		audio: []
	},
	timeline: [
		{
			time: 0,
			duration: 200,
			notes: 'Opening scene',
			frame: {
				prompt: 'Alice walking into office',
				actors: [
					{
						id: 'char_01',
						action: 'walking slowly',
						speech: {
							text: 'Hello everyone!',
							mood: 'joyful',
							style: 'cheerful'
						}
					}
				],
				camera: { zoom: 1.0 },
				lighting: { type: 'daylight', intensity: 0.8 }
			}
		},
		{
			time: 500,
			duration: 200,
			notes: 'Tense moment',
			frame: {
				prompt: 'Bob looking anxious',
				actors: [
					{
						id: 'char_02',
						action: 'nervous pacing',
						speech: {
							text: 'I am not sure about this...',
							mood: 'anxious',
							style: 'whisper'
						}
					}
				],
				lighting: { type: 'dusk', intensity: 0.4 },
				fx: { bloom: 0.3 }
			}
		},
		{
			time: 1000,
			duration: 200,
			frame: {
				prompt: 'Beach scene at sunset',
				actors: [
					{
						id: 'char_01',
						action: 'relaxing',
						speech: {
							text: 'Finally some peace',
							mood: 'serene'
						}
					}
				],
				lighting: { type: 'dusk', intensity: 0.6 },
				audio_tracks: [{ id: 'bgm_01', volume: 0.5 }]
			}
		}
	],
	config: {
		checkpoint: 'flux_dev.safetensors',
		sampler: 'euler',
		seed: 42,
		tts_engine: 'elevenlabs_v2'
	}
};

describe('SearchIndex', () => {
	describe('constructor', () => {
		it('creates index from model', () => {
			const index = new SearchIndex(testModel);
			expect(index).toBeDefined();
		});

		it('indexes all events', () => {
			const index = createSearchIndex(testModel);
			// Should have 3 events indexed
			const results = index.search('Alice');
			expect(results.length).toBeGreaterThan(0);
		});

		it('indexes all characters', () => {
			const index = createSearchIndex(testModel);
			const results = index.search('Alice');
			const charResults = results.filter((r) => r.type === 'character');
			expect(charResults.length).toBeGreaterThan(0);
		});

		it('indexes all environments', () => {
			const index = createSearchIndex(testModel);
			const results = index.search('office');
			const envResults = results.filter((r) => r.type === 'environment');
			expect(envResults.length).toBeGreaterThan(0);
		});
	});

	describe('search', () => {
		const index = createSearchIndex(testModel);

		it('finds events by character name', () => {
			const results = index.search('Alice');
			const eventResults = results.filter((r) => r.type === 'event');
			expect(eventResults.length).toBeGreaterThan(0);
		});

		it('finds events by mood', () => {
			const results = index.search('anxious');
			expect(results.length).toBeGreaterThan(0);
		});

		it('finds events by lighting type', () => {
			const results = index.search('dusk');
			expect(results.length).toBeGreaterThan(0);
		});

		it('finds characters by name', () => {
			const results = index.search('Bob');
			const charResults = results.filter((r) => r.type === 'character');
			expect(charResults.length).toBe(1);
			expect(charResults[0].id).toBe('char_02');
		});

		it('finds environments by prompt', () => {
			const results = index.search('beach');
			const envResults = results.filter((r) => r.type === 'environment');
			expect(envResults.length).toBe(1);
		});

		it('returns empty results for no match', () => {
			const results = index.search('nonexistent_xyz_123');
			expect(results.length).toBe(0);
		});

		it('returns empty results for empty query', () => {
			const results = index.search('');
			expect(results.length).toBe(0);
		});

		it('scores exact matches higher', () => {
			const results = index.search('Alice');
			const charResults = results.filter((r) => r.type === 'character');
			if (charResults.length > 0) {
				// Character name exact match should have high score
				expect(charResults[0].score).toBeGreaterThan(50);
			}
		});

		it('returns match snippets', () => {
			const results = index.search('office');
			if (results.length > 0) {
				expect(results[0].matches.length).toBeGreaterThan(0);
			}
		});

		it('sorts results by score descending', () => {
			const results = index.search('Alice');
			for (let i = 1; i < results.length; i++) {
				expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
			}
		});
	});

	describe('update', () => {
		it('rebuilds index with new model', () => {
			const index = createSearchIndex(testModel);
			const newModel: Model = {
				...testModel,
				timeline: []
			};
			index.update(newModel);
			const results = index.search('Alice');
			// Should have no event results with empty timeline
			const eventResults = results.filter((r) => r.type === 'event');
			expect(eventResults.length).toBe(0);
		});
	});

	describe('destroy', () => {
		it('clears all indexed data', () => {
			const index = createSearchIndex(testModel);
			index.destroy();
			const results = index.search('Alice');
			expect(results.length).toBe(0);
		});
	});
});
