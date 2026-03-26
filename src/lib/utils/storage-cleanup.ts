/**
 * Storage cleanup and migration utilities.
 * Removes obsolete localStorage keys and validates remaining data.
 */

const ACTIVE_KEYS = ['latent-line:prefs', 'latent-line:model'];
const LEGACY_KEYS = ['theme', 'latent-line:old-prefs', 'latent-line:old-model'];

/**
 * Remove all legacy/obsolete localStorage keys.
 * Run this once on app startup or migration event.
 */
export function cleanupObsoleteKeys() {
	if (typeof localStorage === 'undefined') return;

	LEGACY_KEYS.forEach((key) => {
		try {
			localStorage.removeItem(key);
		} catch {
			// ignore (e.g., in private browsing mode)
		}
	});
}

/**
 * Get size estimate of all active localStorage keys.
 * Useful for monitoring storage usage.
 */
export function getStorageUsage() {
	if (typeof localStorage === 'undefined') return { total: 0, keys: {} };

	const keys: Record<string, number> = {};
	let total = 0;

	ACTIVE_KEYS.forEach((key) => {
		try {
			const value = localStorage.getItem(key);
			if (value) {
				const bytes = new Blob([value]).size;
				keys[key] = bytes;
				total += bytes;
			}
		} catch {
			// ignore
		}
	});

	return { total, keys };
}

/**
 * Add a version marker to localStorage for schema migration tracking.
 * On schema changes, increment this and add migration logic.
 */
const STORAGE_VERSION_KEY = 'latent-line:storage-version';
const CURRENT_STORAGE_VERSION = 1;

export function validateStorageVersion() {
	if (typeof localStorage === 'undefined') return false;

	try {
		const stored = localStorage.getItem(STORAGE_VERSION_KEY);
		const version = stored ? parseInt(stored, 10) : 0;

		if (version < CURRENT_STORAGE_VERSION) {
			// Trigger migration here
			cleanupObsoleteKeys();
			localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
			return true; // Migration occurred
		}

		return false; // Already up-to-date
	} catch {
		return false;
	}
}
