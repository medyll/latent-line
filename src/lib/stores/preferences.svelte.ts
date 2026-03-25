import { onMount } from 'svelte';

const PREFS_KEY = 'latent-line:prefs';

export interface Preferences {
	theme: 'light' | 'dark';
	defaultZoom: number;
	sidebarWidth: number;
	language: string;
}

const DEFAULTS: Preferences = {
	theme: 'light',
	defaultZoom: 1,
	sidebarWidth: 20,
	language: 'en'
};

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
			document.documentElement.style.colorScheme = prefs.theme;
		} catch {
			// ignore
		}
	});

	$effect(() => {
		// deep-track all prefs
		const snapshot = JSON.stringify(prefs);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(PREFS_KEY, snapshot);
		}
		document.documentElement.style.colorScheme = prefs.theme;
	});

	function reset() {
		Object.assign(prefs, DEFAULTS);
	}

	return { prefs, reset };
}

export const PREFS_CONTEXT_KEY = 'preferences';
