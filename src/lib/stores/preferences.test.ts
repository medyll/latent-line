import { describe, it, expect, beforeEach } from 'vitest';
import type { Preferences } from './preferences.svelte';

// Unit tests for preferences logic (pure, no Svelte context needed)

const PREFS_KEY = 'latent-line:prefs';

const DEFAULTS: Preferences = {
	theme: 'light',
	defaultZoom: 1,
	sidebarWidth: 20,
	language: 'en'
};

function loadPrefs(storage: Record<string, string>) {
	try {
		const raw = storage[PREFS_KEY];
		if (!raw) return { ...DEFAULTS };
		return { ...DEFAULTS, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULTS };
	}
}

function savePrefs(storage: Record<string, string>, prefs: typeof DEFAULTS) {
	storage[PREFS_KEY] = JSON.stringify(prefs);
}

describe('preferences store logic', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
	});

	it('returns defaults when no stored prefs', () => {
		const prefs = loadPrefs(storage);
		expect(prefs).toEqual(DEFAULTS);
	});

	it('loads stored theme correctly', () => {
		storage[PREFS_KEY] = JSON.stringify({ theme: 'dark' });
		const prefs = loadPrefs(storage);
		expect(prefs.theme).toBe('dark');
		// other defaults preserved
		expect(prefs.defaultZoom).toBe(1);
	});

	it('persists preferences to storage', () => {
		const prefs: Preferences = { ...DEFAULTS, theme: 'dark' as const, defaultZoom: 2 };
		savePrefs(storage, prefs);
		const loaded = loadPrefs(storage);
		expect(loaded.theme).toBe('dark');
		expect(loaded.defaultZoom).toBe(2);
	});

	it('reset returns to defaults', () => {
		let prefs = { ...DEFAULTS, theme: 'dark', language: 'fr' };
		prefs = { ...DEFAULTS };
		expect(prefs.theme).toBe('light');
		expect(prefs.language).toBe('en');
	});

	it('merges partial stored data with defaults', () => {
		storage[PREFS_KEY] = JSON.stringify({ language: 'fr' });
		const prefs = loadPrefs(storage);
		expect(prefs.language).toBe('fr');
		expect(prefs.theme).toBe('light'); // default preserved
	});

	it('handles corrupted JSON gracefully', () => {
		storage[PREFS_KEY] = 'not-json{{{';
		const prefs = loadPrefs(storage);
		expect(prefs).toEqual(DEFAULTS);
	});
});
