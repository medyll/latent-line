import { onMount } from 'svelte';

const PREFS_KEY = 'latent-line:prefs';
const THEME_KEY = 'latent-line-theme';

/** Theme setting. `system` follows the OS `prefers-color-scheme`. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** The image backend to generate against, and how to reach it. */
export interface ComfyUIConfig {
	enabled: boolean;
	backend: 'comfyui' | 'a1111';
	url: string;
	api_key?: string;
}

/** User preferences, persisted in local storage. */
export interface Preferences {
	theme: ThemeMode;
	defaultZoom: number;
	sidebarWidth: number;
	language: string;
	comfyui?: ComfyUIConfig;
}

const DEFAULTS: Preferences = {
	theme: 'system',
	defaultZoom: 1,
	sidebarWidth: 20,
	language: 'en'
};

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
	if (theme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return theme;
}

function applyThemeToDom(theme: 'light' | 'dark') {
	document.documentElement.setAttribute('data-theme', theme);
	document.documentElement.style.colorScheme = theme;

	// Keep meta tag in sync
	const meta = document.querySelector('meta[name="color-scheme"]');
	if (meta) {
		meta.setAttribute('content', theme);
	}
}

/** Preferences store: loads from local storage, writes back on change, and applies
 *  the resolved theme to the document. */
export function createPreferencesStore() {
	const prefs = $state<Preferences>({ ...DEFAULTS });

	onMount(() => {
		try {
			const raw = localStorage.getItem(PREFS_KEY);
			// migrate legacy theme key
			const legacyTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
			if (raw) {
				Object.assign(prefs, { ...DEFAULTS, ...JSON.parse(raw) });
			} else if (legacyTheme === 'light' || legacyTheme === 'dark') {
				prefs.theme = legacyTheme;
			}
			applyThemeToDom(resolveTheme(prefs.theme));
		} catch {
			// ignore
		}
	});

	$effect(() => {
		// deep-track all prefs
		const snapshot = JSON.stringify(prefs);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(PREFS_KEY, snapshot);
			localStorage.setItem(THEME_KEY, prefs.theme);
		}
		applyThemeToDom(resolveTheme(prefs.theme));
	});

	function reset() {
		Object.assign(prefs, DEFAULTS);
	}

	return { prefs, reset };
}

/** Context key under which the preferences store is provided. */
export const PREFS_CONTEXT_KEY = 'preferences';
