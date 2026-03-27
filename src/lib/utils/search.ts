/**
 * search.ts
 *
 * Global search across timeline events and assets.
 * Searches: event actions, speech, mood, character names, environments, notes.
 * Returns grouped results for UI display.
 */

import type { Model, TimelineEvent } from '$lib/model/model-types';

export interface SearchResult {
	type: 'event' | 'character' | 'environment' | 'audio';
	id: string;
	title: string;
	context: string; // preview/snippet
	matched_field: string; // which field matched
}

/**
 * Search model for a query string
 * Returns results grouped by type
 */
export function searchModel(model: Model, query: string): Map<string, SearchResult[]> {
	const q = query.toLowerCase();
	const results = new Map<string, SearchResult[]>();

	results.set('events', searchEvents(model, q));
	results.set('characters', searchCharacters(model, q));
	results.set('environments', searchEnvironments(model, q));
	results.set('audio', searchAudio(model, q));

	// Remove empty categories
	for (const [key, value] of results.entries()) {
		if (value.length === 0) {
			results.delete(key);
		}
	}

	return results;
}

/**
 * Search timeline events by action, speech, mood, character, notes
 */
function searchEvents(model: Model, query: string): SearchResult[] {
	const results: SearchResult[] = [];

	model.timeline.forEach((event, idx) => {
		const eventNum = idx + 1;
		let matched = false;
		let matched_field = '';
		let context = '';

		const actor = event.frame.actors?.[0];

		// Search action
		if (actor?.action && actor.action.toLowerCase().includes(query)) {
			matched = true;
			matched_field = 'action';
			context = actor.action;
		}

		// Search speech text
		if (!matched && actor?.speech?.text && actor.speech.text.toLowerCase().includes(query)) {
			matched = true;
			matched_field = 'speech';
			context = actor.speech.text.substring(0, 50);
		}

		// Search mood
		if (!matched && actor?.speech?.mood && actor.speech.mood.toLowerCase().includes(query)) {
			matched = true;
			matched_field = 'mood';
			context = actor.speech.mood;
		}

		// Search character name
		if (!matched && actor) {
			const character = model.assets.characters.find((c) => c.id === actor.id);
			if (character?.name && character.name.toLowerCase().includes(query)) {
				matched = true;
				matched_field = 'character';
				context = character.name;
			}
		}

		// Search notes
		if (!matched && (event as any).notes && (event as any).notes.toLowerCase().includes(query)) {
			matched = true;
			matched_field = 'notes';
			context = (event as any).notes.substring(0, 50);
		}

		if (matched) {
			const actor = event.frame.actors?.[0];
			const character = actor
				? (model.assets.characters.find((c) => c.id === actor.id)?.name ?? actor.id)
				: 'No Actor';

			results.push({
				type: 'event',
				id: `event_${idx}`,
				title: `Event ${eventNum} (${character})`,
				context,
				matched_field
			});
		}
	});

	return results;
}

/**
 * Search characters by name or references
 */
function searchCharacters(model: Model, query: string): SearchResult[] {
	return model.assets.characters
		.filter(
			(char) =>
				char.name.toLowerCase().includes(query) ||
				char.voice_id?.toLowerCase().includes(query) ||
				char.references?.some((ref) => ref.context.toLowerCase().includes(query))
		)
		.map((char) => ({
			type: 'character',
			id: char.id,
			title: char.name,
			context: char.voice_id ? `Voice: ${char.voice_id}` : 'No voice assigned',
			matched_field: 'character'
		}));
}

/**
 * Search environments by prompt
 */
function searchEnvironments(model: Model, query: string): SearchResult[] {
	return Object.entries(model.assets.environments)
		.filter(
			([key, env]) => env.prompt.toLowerCase().includes(query) || key.toLowerCase().includes(query)
		)
		.map(([key, env]) => ({
			type: 'environment',
			id: key,
			title: key,
			context: env.prompt.substring(0, 50),
			matched_field: 'prompt'
		}));
}

/**
 * Search audio by label
 */
function searchAudio(model: Model, query: string): SearchResult[] {
	return model.assets.audio
		.filter(
			(audio) =>
				audio.label?.toLowerCase().includes(query) || audio.id.toLowerCase().includes(query)
		)
		.map((audio) => ({
			type: 'audio',
			id: audio.id,
			title: audio.label || audio.id,
			context: audio.url,
			matched_field: 'audio'
		}));
}

/**
 * Highlight matching term in text
 */
export function highlightMatch(
	text: string,
	query: string
): { before: string; match: string; after: string } {
	const idx = text.toLowerCase().indexOf(query.toLowerCase());
	if (idx === -1) {
		return { before: text, match: '', after: '' };
	}

	return {
		before: text.substring(0, idx),
		match: text.substring(idx, idx + query.length),
		after: text.substring(idx + query.length)
	};
}
