import { describe, it, expect } from 'vitest';
import { applyFilters, getFilterPresets, saveFilterPreset, loadFilterPresets, deleteFilterPreset } from './search-filters';
import type { TimelineEvent } from '$lib/model/model-types';

const testEvents: TimelineEvent[] = [
	{
		time: 0,
		duration: 200,
		frame: {
			prompt: 'Opening scene',
			actors: [
				{
					id: 'char_01',
					action: 'walking',
					speech: { text: 'Hello', mood: 'joyful' }
				}
			],
			camera: { zoom: 1.0 },
			lighting: { type: 'daylight', intensity: 0.8 }
		}
	},
	{
		time: 500,
		duration: 200,
		frame: {
			prompt: 'Tense moment',
			actors: [
				{
					id: 'char_02',
					action: 'pacing',
					speech: { text: 'Hmm...', mood: 'anxious' }
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
			prompt: 'Peaceful scene',
			actors: [
				{
					id: 'char_01',
					action: 'relaxing',
					speech: { text: 'Ah...', mood: 'serene' }
				}
			],
			lighting: { type: 'dusk', intensity: 0.6 },
			audio_tracks: [{ id: 'bgm_01', volume: 0.5 }]
		}
	}
];

describe('search-filters', () => {
	describe('applyFilters', () => {
		it('returns all events with no filters', () => {
			const filtered = applyFilters(testEvents, {});
			expect(filtered.length).toBe(3);
		});

		it('filters by time range', () => {
			const filtered = applyFilters(testEvents, {
				timeStart: 400,
				timeEnd: 800
			});
			expect(filtered.length).toBe(1);
			expect(filtered[0].time).toBe(500);
		});

		it('filters by mood', () => {
			const filtered = applyFilters(testEvents, { mood: 'anxious' });
			expect(filtered.length).toBe(1);
			expect(filtered[0].frame.actors?.[0].speech?.mood).toBe('anxious');
		});

		it('filters by lighting type', () => {
			const filtered = applyFilters(testEvents, { lighting: 'dusk' });
			expect(filtered.length).toBe(2);
		});

		it('filters by character ID', () => {
			const filtered = applyFilters(testEvents, { characterId: 'char_01' });
			expect(filtered.length).toBe(2);
		});

		it('filters by hasCharacter', () => {
			const filtered = applyFilters(testEvents, { hasCharacter: true });
			expect(filtered.length).toBe(3);
		});

		it('filters by hasCamera', () => {
			const filtered = applyFilters(testEvents, { hasCamera: true });
			expect(filtered.length).toBe(1);
		});

		it('filters by hasLighting', () => {
			const filtered = applyFilters(testEvents, { hasLighting: true });
			expect(filtered.length).toBe(3);
		});

		it('filters by hasFX', () => {
			const filtered = applyFilters(testEvents, { hasFX: true });
			expect(filtered.length).toBe(1);
		});

		it('filters by hasAudio', () => {
			const filtered = applyFilters(testEvents, { hasAudio: true });
			expect(filtered.length).toBe(1);
		});

		it('filters by hasPrompt', () => {
			const filtered = applyFilters(testEvents, { hasPrompt: true });
			expect(filtered.length).toBe(3);
		});

		it('combines multiple filters with AND logic', () => {
			const filtered = applyFilters(testEvents, {
				lighting: 'dusk',
				mood: 'anxious'
			});
			expect(filtered.length).toBe(1);
			expect(filtered[0].time).toBe(500);
		});

		it('returns empty array when no events match', () => {
			const filtered = applyFilters(testEvents, {
				characterId: 'nonexistent'
			});
			expect(filtered.length).toBe(0);
		});
	});

	describe('getFilterPresets', () => {
		it('returns default presets', () => {
			const presets = getFilterPresets();
			expect(presets.all).toEqual({});
			expect(presets.withPrompts).toEqual({ hasPrompt: true });
			expect(presets.joyful).toEqual({ mood: 'joyful' });
			expect(presets.dusk).toEqual({ lighting: 'dusk' });
		});

		it('includes all mood presets', () => {
			const presets = getFilterPresets();
			expect(presets.joyful).toBeDefined();
			expect(presets.melancholic).toBeDefined();
			expect(presets.anxious).toBeDefined();
			expect(presets.serene).toBeDefined();
			expect(presets.curious).toBeDefined();
		});

		it('includes all lighting presets', () => {
			const presets = getFilterPresets();
			expect(presets.dusk).toBeDefined();
			expect(presets.daylight).toBeDefined();
			expect(presets.studio).toBeDefined();
			expect(presets.tungsten).toBeDefined();
			expect(presets.ambient).toBeDefined();
		});
	});

	describe('saveFilterPreset', () => {
		it('handles localStorage errors gracefully', () => {
			// localStorage may not be available in test environment
			expect(() => saveFilterPreset('test_preset', { hasCamera: true })).not.toThrow();
		});
	});

	describe('loadFilterPresets', () => {
		it('returns defaults when localStorage unavailable', () => {
			const presets = loadFilterPresets();
			expect(presets.all).toBeDefined();
			expect(presets.joyful).toBeDefined();
		});
	});

	describe('deleteFilterPreset', () => {
		it('handles localStorage errors gracefully', () => {
			expect(() => deleteFilterPreset('nonexistent')).not.toThrow();
		});
	});
});
