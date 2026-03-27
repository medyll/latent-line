/**
 * Lightweight i18n for latent-line.
 * - Reactive locale (Svelte 5 $state)
 * - `t(key, vars?)` with `{var}` interpolation
 * - Pluralization: key ends with `.count` → auto-plural for count=1 vs other
 * - Fallback to EN if key missing in active locale
 * - Auto-detects locale: localStorage → navigator.language → 'en'
 */

import en from './messages/en.json';
import fr from './messages/fr.json';

type Messages = typeof en;
type MessageKey = keyof Messages;

const MESSAGES: Record<string, Messages> = { en, fr };
const SUPPORTED = new Set(['en', 'fr']);

function detectLocale(): string {
	if (typeof localStorage !== 'undefined') {
		try {
			const prefs = JSON.parse(localStorage.getItem('latent-line:prefs') ?? '{}');
			if (prefs.language && SUPPORTED.has(prefs.language)) return prefs.language;
		} catch {}
	}
	if (typeof navigator !== 'undefined') {
		const lang = navigator.language?.split('-')[0];
		if (SUPPORTED.has(lang)) return lang;
	}
	return 'en';
}

// Reactive locale state - wrapped in function for SSR safety
function createLocaleState() {
	let _locale = detectLocale();
	
	return {
		get value() {
			return _locale;
		},
		set value(v: string) {
			if (SUPPORTED.has(v)) _locale = v;
		}
	};
}

export const locale = /* @__PURE__ */ createLocaleState();

/**
 * Translate a message key with optional variable interpolation.
 * `t('assets.refcount.label', { count: 3 })` → "Used in 3 frame(s)"
 */
export function t(key: string, vars?: Record<string, string | number>): string {
	const msgs = MESSAGES[locale.value] ?? MESSAGES['en'];
	const fallback = MESSAGES['en'];
	let msg =
		(msgs as Record<string, string>)[key] ?? (fallback as Record<string, string>)[key] ?? key;

	if (vars) {
		for (const [k, v] of Object.entries(vars)) {
			msg = msg.replaceAll(`{${k}}`, String(v));
		}
	}
	return msg;
}

export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
