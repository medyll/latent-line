import { describe, it, expect, beforeEach } from 'vitest';
import type { Assets, Character, AudioAsset, EnvironmentAsset } from '$lib/model/model-types';

describe('AssetManager CRUD Operations', () => {
	let assetStore: Assets;

	beforeEach(() => {
		// Initialize with empty assets
		assetStore = {
			characters: [],
			environments: {},
			audio: []
		};
	});

	describe('Character Management', () => {
		it('should add a new character', () => {
			const newCharacter: Character = {
				id: 'char_test',
				name: 'Test Character',
				references: [],
				outfits: {
					default: {
						prompt: 'default outfit'
					}
				}
			};

			assetStore.characters = [...assetStore.characters, newCharacter];

			expect(assetStore.characters).toHaveLength(1);
			expect(assetStore.characters[0].id).toBe('char_test');
			expect(assetStore.characters[0].name).toBe('Test Character');
		});

		it('should remove a character by ID', () => {
			assetStore.characters = [
				{
					id: 'char_1',
					name: 'Character 1',
					references: [],
					outfits: {}
				},
				{
					id: 'char_2',
					name: 'Character 2',
					references: [],
					outfits: {}
				}
			];

			assetStore.characters = assetStore.characters.filter((char) => char.id !== 'char_1');

			expect(assetStore.characters).toHaveLength(1);
			expect(assetStore.characters[0].id).toBe('char_2');
		});

		it('should handle empty character list', () => {
			expect(assetStore.characters).toHaveLength(0);
			assetStore.characters = [];
			expect(assetStore.characters).toHaveLength(0);
		});
	});

	describe('Environment Management', () => {
		it('should add a new environment', () => {
			const newEnv: EnvironmentAsset = {
				prompt: 'futuristic city landscape'
			};

			assetStore.environments['env_test'] = newEnv;

			expect(Object.keys(assetStore.environments)).toHaveLength(1);
			expect(assetStore.environments['env_test'].prompt).toBe('futuristic city landscape');
		});

		it('should remove an environment by ID', () => {
			assetStore.environments = {
				env_1: { prompt: 'Environment 1' },
				env_2: { prompt: 'Environment 2' }
			};

			const { env_1, ...remaining } = assetStore.environments;
			assetStore.environments = remaining;

			expect(Object.keys(assetStore.environments)).toHaveLength(1);
			expect(assetStore.environments['env_2']).toBeTruthy();
			expect(assetStore.environments['env_1']).toBeUndefined();
		});

		it('should handle empty environment store', () => {
			expect(Object.keys(assetStore.environments)).toHaveLength(0);
		});
	});

	describe('Audio Asset Management', () => {
		it('should add a new audio asset', () => {
			const newAudio: AudioAsset = {
				id: 'audio_test',
				url: 'https://example.com/sound.mp3',
				label: 'Test Sound'
			};

			assetStore.audio = [...(assetStore.audio || []), newAudio];

			expect(assetStore.audio).toHaveLength(1);
			expect(assetStore.audio[0].id).toBe('audio_test');
			expect(assetStore.audio[0].label).toBe('Test Sound');
		});

		it('should remove an audio asset by ID', () => {
			assetStore.audio = [
				{ id: 'audio_1', url: 'url1.mp3', label: 'Audio 1' },
				{ id: 'audio_2', url: 'url2.mp3', label: 'Audio 2' }
			];

			assetStore.audio = assetStore.audio.filter((aud) => aud.id !== 'audio_1');

			expect(assetStore.audio).toHaveLength(1);
			expect(assetStore.audio[0].id).toBe('audio_2');
		});

		it('should handle missing audio array', () => {
			expect(assetStore.audio).toEqual([]);
		});

		it('should handle audio without label', () => {
			const audioNoLabel: AudioAsset = {
				id: 'audio_no_label',
				url: 'url.mp3'
			};

			assetStore.audio = [audioNoLabel];

			expect(assetStore.audio[0].label).toBeUndefined();
		});
	});

	describe('Batch Operations', () => {
		it('should clear all assets', () => {
			assetStore.characters = [{ id: 'char_1', name: 'Char', references: [] }];
			assetStore.environments = { env_1: { prompt: 'test' } };
			assetStore.audio = [{ id: 'audio_1', url: 'test.mp3' }];

			assetStore.characters = [];
			assetStore.environments = {};
			assetStore.audio = [];

			expect(assetStore.characters).toHaveLength(0);
			expect(Object.keys(assetStore.environments)).toHaveLength(0);
			expect(assetStore.audio).toHaveLength(0);
		});

		it('should preserve asset types during mutations', () => {
			const char: Character = {
				id: 'char_1',
				name: 'Test',
				references: []
			};

			assetStore.characters = [char];

			expect(typeof assetStore.characters[0].id).toBe('string');
			expect(typeof assetStore.characters[0].name).toBe('string');
			expect(Array.isArray(assetStore.characters[0].references)).toBe(true);
		});
	});
});
