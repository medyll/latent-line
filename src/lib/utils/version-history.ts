/**
 * version-history.ts
 *
 * Manages save version history for crash recovery.
 * Keeps last N versions in localStorage.
 */

import type { Model } from '$lib/model/model-types';

const VERSION_KEY = 'latent-line:version-history';
const MAX_VERSIONS = 10;

export interface VersionEntry {
	timestamp: number;
	date: string;
	model: Model;
	label?: string;
}

/**
 * Add a new version to history
 */
export function addVersion(model: Model, label?: string): void {
	try {
		const history = getHistory();
		
		const entry: VersionEntry = {
			timestamp: Date.now(),
			date: new Date().toISOString(),
			model: JSON.parse(JSON.stringify(model)),
			label
		};
		
		// Add to beginning (newest first)
		history.unshift(entry);
		
		// Limit to MAX_VERSIONS
		if (history.length > MAX_VERSIONS) {
			history.splice(MAX_VERSIONS);
		}
		
		localStorage.setItem(VERSION_KEY, JSON.stringify(history));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Get version history
 */
export function getHistory(): VersionEntry[] {
	try {
		const stored = localStorage.getItem(VERSION_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Ignore storage errors
	}
	return [];
}

/**
 * Get specific version by index
 */
export function getVersion(index: number): VersionEntry | null {
	const history = getHistory();
	return history[index] ?? null;
}

/**
 * Restore version
 */
export function restoreVersion(index: number): Model | null {
	const version = getVersion(index);
	if (version) {
		return version.model;
	}
	return null;
}

/**
 * Delete version from history
 */
export function deleteVersion(index: number): void {
	try {
		const history = getHistory();
		history.splice(index, 1);
		localStorage.setItem(VERSION_KEY, JSON.stringify(history));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Clear all history
 */
export function clearHistory(): void {
	try {
		localStorage.removeItem(VERSION_KEY);
	} catch {
		// Ignore storage errors
	}
}

/**
 * Get time ago string
 */
export function timeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	
	if (seconds < 60) return 'Just now';
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Check if recovery is available
 */
export function hasRecovery(): boolean {
	const history = getHistory();
	return history.length > 0;
}

/**
 * Get latest version for recovery
 */
export function getRecoveryVersion(): VersionEntry | null {
	const history = getHistory();
	return history[0] ?? null;
}
