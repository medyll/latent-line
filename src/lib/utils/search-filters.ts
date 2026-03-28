/**
 * search-filters.ts
 *
 * Filter logic for timeline search.
 * Supports multiple filter criteria with AND logic.
 */

import type { TimelineEvent, Mood, LightingType } from '$lib/model/model-types';

export interface FilterConfig {
	// Time range filter
	timeStart?: number;
	timeEnd?: number;

	// Mood filter
	mood?: Mood;

	// Lighting filter
	lighting?: LightingType;

	// Character filter
	characterId?: string;

	// Asset type filters
	hasCharacter?: boolean;
	hasCamera?: boolean;
	hasLighting?: boolean;
	hasFX?: boolean;
	hasAudio?: boolean;
	hasPrompt?: boolean;
}

export function applyFilters(
	events: TimelineEvent[],
	filters: FilterConfig
): TimelineEvent[] {
	return events.filter((event) => matchesFilters(event, filters));
}

function matchesFilters(
	event: TimelineEvent,
	filters: FilterConfig
): boolean {
	// Time range
	if (filters.timeStart !== undefined && event.time < filters.timeStart) {
		return false;
	}
	if (filters.timeEnd !== undefined && event.time > filters.timeEnd) {
		return false;
	}

	// Mood filter
	if (filters.mood) {
		const hasMood = event.frame.actors?.some(
			(actor) => actor.speech?.mood === filters.mood
		);
		if (!hasMood) return false;
	}

	// Lighting filter
	if (filters.lighting) {
		if (event.frame.lighting?.type !== filters.lighting) {
			return false;
		}
	}

	// Character filter
	if (filters.characterId) {
		const hasCharacter = event.frame.actors?.some(
			(actor) => actor.id === filters.characterId
		);
		if (!hasCharacter) return false;
	}

	// Asset type filters
	if (filters.hasCharacter !== undefined) {
		const hasCharacters = (event.frame.actors?.length ?? 0) > 0;
		if (filters.hasCharacter && !hasCharacters) return false;
		if (!filters.hasCharacter && hasCharacters) return false;
	}

	if (filters.hasCamera !== undefined) {
		const hasCamera = event.frame.camera !== undefined;
		if (filters.hasCamera && !hasCamera) return false;
		if (!filters.hasCamera && hasCamera) return false;
	}

	if (filters.hasLighting !== undefined) {
		const hasLighting = event.frame.lighting !== undefined;
		if (filters.hasLighting && !hasLighting) return false;
		if (!filters.hasLighting && hasLighting) return false;
	}

	if (filters.hasFX !== undefined) {
		const hasFX = event.frame.fx !== undefined;
		if (filters.hasFX && !hasFX) return false;
		if (!filters.hasFX && hasFX) return false;
	}

	if (filters.hasAudio !== undefined) {
		const hasAudio = (event.frame.audio_tracks?.length ?? 0) > 0;
		if (filters.hasAudio && !hasAudio) return false;
		if (!filters.hasAudio && hasAudio) return false;
	}

	if (filters.hasPrompt !== undefined) {
		const hasPrompt = !!event.frame.prompt;
		if (filters.hasPrompt && !hasPrompt) return false;
		if (!filters.hasPrompt && hasPrompt) return false;
	}

	return true;
}

export function getFilterPresets(): Record<string, FilterConfig> {
	return {
		all: {},
		withPrompts: { hasPrompt: true },
		withCharacters: { hasCharacter: true },
		withCamera: { hasCamera: true },
		withLighting: { hasLighting: true },
		withFX: { hasFX: true },
		withAudio: { hasAudio: true },
		joyful: { mood: 'joyful' },
		melancholic: { mood: 'melancholic' },
		anxious: { mood: 'anxious' },
		serene: { mood: 'serene' },
		curious: { mood: 'curious' },
		dusk: { lighting: 'dusk' },
		daylight: { lighting: 'daylight' },
		studio: { lighting: 'studio' },
		tungsten: { lighting: 'tungsten' },
		ambient: { lighting: 'ambient' }
	};
}

export function saveFilterPreset(name: string, filter: FilterConfig): void {
	try {
		const presets = JSON.parse(
			localStorage.getItem('latent-line:filter-presets') ?? '{}'
		);
		presets[name] = filter;
		localStorage.setItem('latent-line:filter-presets', JSON.stringify(presets));
	} catch {
		// Ignore storage errors
	}
}

export function loadFilterPresets(): Record<string, FilterConfig> {
	try {
		const stored = JSON.parse(
			localStorage.getItem('latent-line:filter-presets') ?? '{}'
		);
		return { ...getFilterPresets(), ...stored };
	} catch {
		return getFilterPresets();
	}
}

export function deleteFilterPreset(name: string): void {
	try {
		const presets = JSON.parse(
			localStorage.getItem('latent-line:filter-presets') ?? '{}'
		);
		delete presets[name];
		localStorage.setItem('latent-line:filter-presets', JSON.stringify(presets));
	} catch {
		// Ignore storage errors
	}
}
