/**
 * search-index.ts
 *
 * Full-text search index for timeline models.
 * Indexes events, characters, and environments for fast searching.
 */

import type { Model, TimelineEvent } from '$lib/model/model-types';

export interface SearchResult {
	type: 'event' | 'character' | 'environment';
	id: string;
	score: number;
	matches: string[];
	data: TimelineEvent | any;
}

export interface IndexedEvent {
	time: number;
	text: string;
	event: TimelineEvent;
}

export class SearchIndex {
	private events: Map<number, IndexedEvent> = new Map();
	private characters: Map<string, any> = new Map();
	private environments: Map<string, any> = new Map();
	private model: Model | null = null;

	constructor(model: Model) {
		this.model = model;
		this.build();
	}

	private build() {
		if (!this.model) return;

		// Index events
		this.model.timeline.forEach((event) => {
			const text = this.extractEventText(event);
			this.events.set(event.time, {
				time: event.time,
				text: text.toLowerCase(),
				event
			});
		});

		// Index characters
		this.model.assets.characters.forEach((char) => {
			const text = [
				char.name,
				char.voice_id ?? '',
				char.outfits ? Object.values(char.outfits).map((o: any) => o.prompt).join(' ') : ''
			].join(' ').toLowerCase();
			
			this.characters.set(char.id, {
				id: char.id,
				text,
				character: char
			});
		});

		// Index environments
		Object.entries(this.model.assets.environments).forEach(([id, env]) => {
			const text = [env.prompt, env.ref ?? ''].join(' ').toLowerCase();
			
			this.environments.set(id, {
				id,
				text,
				environment: env
			});
		});
	}

	private extractEventText(event: TimelineEvent): string {
		const parts: string[] = [];

		// Event notes
		if (event.notes) parts.push(event.notes);

		// Frame prompt
		if (event.frame.prompt) parts.push(event.frame.prompt);

		// Actors
		event.frame.actors?.forEach((actor) => {
			if (actor.action) parts.push(actor.action);
			if (actor.speech?.text) parts.push(actor.speech.text);
			if (actor.speech?.style) parts.push(actor.speech.style);
		});

		// Camera
		if (event.frame.camera) {
			parts.push('camera');
		}

		// Lighting
		if (event.frame.lighting?.type) {
			parts.push(event.frame.lighting.type);
		}

		// FX
		if (event.frame.fx) {
			if (event.frame.fx.bloom) parts.push('bloom');
			if (event.frame.fx.motion_blur) parts.push('motion blur');
		}

		return parts.join(' ');
	}

	search(query: string): SearchResult[] {
		if (!query.trim()) return [];

		const normalizedQuery = query.toLowerCase().trim();
		const results: SearchResult[] = [];

		// Search events
		this.events.forEach((indexed) => {
			const score = this.calculateScore(indexed.text, normalizedQuery);
			if (score > 0) {
				const matches = this.findMatches(indexed.text, normalizedQuery);
				results.push({
					type: 'event',
					id: String(indexed.time),
					score,
					matches,
					data: indexed.event
				});
			}
		});

		// Search characters
		this.characters.forEach((indexed) => {
			const score = this.calculateScore(indexed.text, normalizedQuery);
			if (score > 0) {
				results.push({
					type: 'character',
					id: indexed.id,
					score,
					matches: this.findMatches(indexed.text, normalizedQuery),
					data: indexed.character
				});
			}
		});

		// Search environments
		this.environments.forEach((indexed) => {
			const score = this.calculateScore(indexed.text, normalizedQuery);
			if (score > 0) {
				results.push({
					type: 'environment',
					id: indexed.id,
					score,
					matches: this.findMatches(indexed.text, normalizedQuery),
					data: indexed.environment
				});
			}
		});

		// Sort by score descending
		return results.sort((a, b) => b.score - a.score);
	}

	private calculateScore(text: string, query: string): number {
		if (!text.includes(query)) return 0;

		let score = 0;

		// Exact match bonus
		if (text === query) score += 100;
		
		// Word boundary match
		const wordRegex = new RegExp(`\\b${query}\\b`, 'i');
		if (wordRegex.test(text)) score += 50;

		// Contains match
		if (text.includes(query)) score += 10;

		// Position bonus (earlier is better)
		const index = text.indexOf(query);
		if (index >= 0) {
			score += Math.max(0, 20 - index / 10);
		}

		return score;
	}

	private findMatches(text: string, query: string): string[] {
		const matches: string[] = [];
		const regex = new RegExp(`.{0,30}${query}.{0,30}`, 'gi');
		let match;

		while ((match = regex.exec(text)) !== null) {
			matches.push(match[0].trim());
			if (matches.length >= 3) break;
		}

		return matches;
	}

	update(model: Model) {
		this.model = model;
		this.events.clear();
		this.characters.clear();
		this.environments.clear();
		this.build();
	}

	destroy() {
		this.events.clear();
		this.characters.clear();
		this.environments.clear();
		this.model = null;
	}
}

export function createSearchIndex(model: Model): SearchIndex {
	return new SearchIndex(model);
}
