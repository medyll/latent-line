import { describe, it, expect } from 'vitest';

// Pure filter logic extracted for testing (mirrors AssetManager $derived)
function filterCharacters(chars: { id: string; name: string; prompt?: string }[], q: string) {
	const lq = q.trim().toLowerCase();
	if (!lq) return chars;
	return chars.filter(
		(c) => c.name.toLowerCase().includes(lq) || (c.prompt ?? '').toLowerCase().includes(lq)
	);
}

function filterEnvironments(envs: Record<string, { prompt?: string }>, q: string) {
	const lq = q.trim().toLowerCase();
	if (!lq) return envs;
	return Object.fromEntries(
		Object.entries(envs).filter(([, e]) => (e.prompt ?? '').toLowerCase().includes(lq))
	);
}

function filterAudio(audio: { id: string; label?: string; url?: string }[], q: string) {
	const lq = q.trim().toLowerCase();
	if (!lq) return audio;
	return audio.filter(
		(a) => (a.label ?? '').toLowerCase().includes(lq) || (a.url ?? '').toLowerCase().includes(lq)
	);
}

describe('AssetManager search filter (S13-03)', () => {
	const chars = [
		{ id: '1', name: 'Alice', prompt: 'warrior' },
		{ id: '2', name: 'Bob', prompt: 'wizard' },
		{ id: '3', name: 'Charlie', prompt: 'archer' }
	];

	it('empty query returns all characters', () => {
		expect(filterCharacters(chars, '')).toHaveLength(3);
	});

	it('filters characters by name (case-insensitive)', () => {
		expect(filterCharacters(chars, 'alice')).toHaveLength(1);
		expect(filterCharacters(chars, 'ALICE')).toHaveLength(1);
	});

	it('filters characters by prompt', () => {
		expect(filterCharacters(chars, 'wiz')).toHaveLength(1);
		expect(filterCharacters(chars, 'wiz')[0].name).toBe('Bob');
	});

	it('returns empty array when no match', () => {
		expect(filterCharacters(chars, 'zzz')).toHaveLength(0);
	});

	it('whitespace-only query returns all', () => {
		expect(filterCharacters(chars, '   ')).toHaveLength(3);
	});

	const envs = {
		e1: { prompt: 'forest at dawn' },
		e2: { prompt: 'city at night' },
		e3: { prompt: 'desert storm' }
	};

	it('filters environments by prompt', () => {
		const result = filterEnvironments(envs, 'city');
		expect(Object.keys(result)).toHaveLength(1);
		expect(result.e2).toBeDefined();
	});

	it('empty query returns all environments', () => {
		expect(Object.keys(filterEnvironments(envs, ''))).toHaveLength(3);
	});

	const audio = [
		{ id: 'a1', label: 'Background Music', url: 'music.mp3' },
		{ id: 'a2', label: 'SFX Explosion', url: 'boom.wav' }
	];

	it('filters audio by label', () => {
		expect(filterAudio(audio, 'sfx')).toHaveLength(1);
	});

	it('filters audio by url', () => {
		expect(filterAudio(audio, 'music')).toHaveLength(1);
	});

	it('empty query returns all audio', () => {
		expect(filterAudio(audio, '')).toHaveLength(2);
	});
});
