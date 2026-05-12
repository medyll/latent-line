import { onMount } from 'svelte';

const PREFS_KEY = 'latent-line:prefs';
const THEME_KEY = 'latent-line-theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ComfyUIConfig {
	enabled: boolean;
	backend: 'comfyui' | 'a1111';
	url: string;
	api_key?: string;
}

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

export const PREFS_CONTEXT_KEY = 'preferences';
