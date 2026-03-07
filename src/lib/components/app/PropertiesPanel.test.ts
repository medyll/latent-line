import { describe, it, expect } from 'vitest';
import type { Assets } from '$lib/model/model-types';

// Pure asset lookup logic extracted for unit testing
function lookupAsset(
	assetStore: Assets,
	selectedAssetId: string | null
): { type: string; data: unknown } | null {
	if (!selectedAssetId) return null;
	const colonIdx = selectedAssetId.indexOf(':');
	if (colonIdx === -1) return null;
	const type = selectedAssetId.slice(0, colonIdx);
	const id = selectedAssetId.slice(colonIdx + 1);

	if (type === 'char') {
		const char = assetStore.characters.find((c) => c.id === id);
		return char ? { type, data: char } : null;
	}
	if (type === 'env') {
		const env = assetStore.environments[id];
		return env ? { type, data: { ...env, id } } : null;
	}
	if (type === 'audio') {
		const audio = assetStore.audio?.find((a) => a.id === id);
		return audio ? { type, data: audio } : null;
	}
	return null;
}

const testStore: Assets = {
	characters: [
		{
			id: 'char_01',
			name: 'Alice',
			references: [],
			voice_id: 'v_alice',
			outfits: { default: { prompt: 'dress' } }
		},
		{ id: 'char_02', name: 'Bob', references: [] }
	],
	environments: {
		env_01: { prompt: 'forest clearing' },
		env_02: { prompt: 'city rooftop', ref: 'img/rooftop.png' }
	},
	audio: [
		{ id: 'audio_01', url: 'music.mp3', label: 'Background Music' },
		{ id: 'audio_02', url: 'sfx.mp3' }
	]
};

describe('Asset lookup logic', () => {
	it('returns null for null selectedAssetId', () => {
		expect(lookupAsset(testStore, null)).toBeNull();
	});

	it('returns null for malformed id (no colon)', () => {
		expect(lookupAsset(testStore, 'char_01')).toBeNull();
	});

	it('returns null for unknown id', () => {
		expect(lookupAsset(testStore, 'char:char_99')).toBeNull();
	});

	it('looks up a character by id', () => {
		const result = lookupAsset(testStore, 'char:char_01');
		expect(result?.type).toBe('char');
		expect((result?.data as { name: string }).name).toBe('Alice');
		expect((result?.data as { voice_id: string }).voice_id).toBe('v_alice');
	});

	it('looks up a character without optional fields', () => {
		const result = lookupAsset(testStore, 'char:char_02');
		expect(result?.type).toBe('char');
		expect((result?.data as { name: string }).name).toBe('Bob');
	});

	it('looks up an environment by id', () => {
		const result = lookupAsset(testStore, 'env:env_01');
		expect(result?.type).toBe('env');
		expect((result?.data as { prompt: string }).prompt).toBe('forest clearing');
	});

	it('environment result includes id field', () => {
		const result = lookupAsset(testStore, 'env:env_02');
		expect((result?.data as { id: string }).id).toBe('env_02');
		expect((result?.data as { ref: string }).ref).toBe('img/rooftop.png');
	});

	it('looks up an audio asset by id', () => {
		const result = lookupAsset(testStore, 'audio:audio_01');
		expect(result?.type).toBe('audio');
		expect((result?.data as { label: string }).label).toBe('Background Music');
	});

	it('audio without label returns data with undefined label', () => {
		const result = lookupAsset(testStore, 'audio:audio_02');
		expect((result?.data as { label?: string }).label).toBeUndefined();
	});
});
