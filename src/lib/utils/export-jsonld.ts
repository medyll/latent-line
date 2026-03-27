import type { Model } from '$lib/model/model-template';

/**
 * Export timeline model to JSON-LD format (semantic linked data).
 * Enables RDF serialization and knowledge graph integration.
 */
export function exportAsJSONLD(model: Model): object {
	const baseURL = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
	const timelineId = `${baseURL}/timeline/${model.project.name.replace(/\s+/g, '-').toLowerCase()}`;

	// Calculate total duration from timeline events
	const sortedTimeline = [...model.timeline].sort((a, b) => a.time - b.time);
	const lastEvent = sortedTimeline[sortedTimeline.length - 1];
	const totalDuration = lastEvent ? lastEvent.time + (lastEvent.duration ?? 1) : 10000;

	// Main creative work (timeline)
	const jsonld: any = {
		'@context': {
			'@vocab': 'https://schema.org/',
			latent: 'https://latent-line.io/schema/'
		},
		'@type': 'CreativeWork',
		'@id': timelineId,
		name: model.project.name,
		description: '',
		dateCreated: new Date().toISOString(),
		creator: {
			'@type': 'SoftwareApplication',
			name: 'latent-line',
			url: 'https://github.com/medyll/latent-line'
		},
		duration: formatTime(totalDuration),
		hasPart: [] as any[]
	};

	// Asset catalog
	const assetCatalog: any = {
		'@type': 'Catalog',
		'@id': `${timelineId}/assets`,
		name: 'Timeline Assets',
		containsPlace: [] as any[]
	};

	// Characters
	if (model.assets?.characters) {
		model.assets.characters.forEach((char) => {
			const charId = `${timelineId}/character/${char.id}`;
			assetCatalog.containsPlace.push({
				'@type': 'Person',
				'@id': charId,
				name: char.name,
				identifier: char.id,
				'latent:voiceId': char.voice_id || null,
				'latent:outfits': char.outfits
					? Object.entries(char.outfits).map(([key, outfit]) => ({
							'@type': 'Thing',
							name: key,
							description: outfit.prompt
						}))
					: []
			});
		});
	}

	// Environments
	if (model.assets?.environments) {
		Object.entries(model.assets.environments).forEach(([id, env]) => {
			const envId = `${timelineId}/environment/${id}`;
			assetCatalog.containsPlace.push({
				'@type': 'Place',
				'@id': envId,
				name: id,
				description: env.prompt,
				'latent:referenceImage': env.ref || null
			});
		});
	}

	if (assetCatalog.containsPlace.length > 0) {
		jsonld.mentions = assetCatalog;
	}

	// Timeline events as CreativeWork actions
	sortedTimeline.forEach((event, idx) => {
		const eventId = `${timelineId}/event/${idx}`;
		const actorName = event.frame.actors?.[0]?.id || 'unknown';
		const eventPart: any = {
			'@type': 'Action',
			'@id': eventId,
			name: `Event ${idx + 1} at ${event.time}ms`,
			description: event.notes || '',
			startTime: formatTime(event.time),
			result: {
				'@type': 'MediaObject',
				name: `Frame ${event.time}`,
				duration: `PT${((event.duration ?? 200) / 1000).toFixed(1)}S`
			}
		};

		// Actor information
		if (event.frame.actors && event.frame.actors.length > 0) {
			const actor = event.frame.actors[0];
			const character = model.assets.characters.find((c) => c.id === actor.id);
			if (character) {
				eventPart.agent = {
					'@type': 'Person',
					'@id': `${timelineId}/character/${character.id}`,
					name: character.name
				};
			}
		}

		// Prompt for AI generation
		if (event.frame.prompt) {
			eventPart.description = event.frame.prompt;
		}

		jsonld.hasPart.push(eventPart);
	});

	return jsonld;
}

/**
 * Format time in milliseconds to ISO 8601 duration.
 * E.g., 5000ms → "PT5S", 90000ms → "PT1M30S", 60000ms → "PT1M"
 */
function formatTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	let result = 'PT';
	if (hours > 0) result += `${hours}H`;
	if (minutes > 0) result += `${minutes}M`;
	if (secs > 0) result += `${secs}S`;

	// If no hours, minutes or seconds were added, add zero seconds
	if (result === 'PT') result += '0S';

	return result;
}

/**
 * Convert JSON-LD to RDF N-Triples format (for RDF triple stores).
 * Simplified version for common properties.
 */
export function jsonldToNTriples(jsonld: any, baseURI = 'https://example.com/'): string {
	const triples: string[] = [];

	function escape(str: string): string {
		return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
	}

	function processObject(obj: any, subject: string, prefix = ''): void {
		if (!obj || typeof obj !== 'object') return;

		Object.entries(obj).forEach(([key, value]) => {
			const predicate = `${prefix}${key}`;

			if (Array.isArray(value)) {
				value.forEach((item) => {
					if (typeof item === 'object' && item['@id']) {
						triples.push(`<${subject}> <${predicate}> <${item['@id']}> .`);
					} else if (typeof item === 'object') {
						const blankNode = `_:bn${triples.length}`;
						triples.push(`<${subject}> <${predicate}> ${blankNode} .`);
						processObject(item, blankNode, prefix);
					}
				});
			} else if (typeof value === 'object' && value !== null && '@id' in value && value['@id']) {
				triples.push(`<${subject}> <${predicate}> <${value['@id']}> .`);
			} else if (typeof value === 'object' && value !== null) {
				const blankNode = `_:bn${triples.length}`;
				triples.push(`<${subject}> <${predicate}> ${blankNode} .`);
				processObject(value, blankNode, prefix);
			} else if (value !== null && value !== undefined) {
				triples.push(`<${subject}> <${predicate}> ${escape(String(value))} .`);
			}
		});
	}

	const subject = jsonld['@id'] || `${baseURI}timeline`;
	processObject(jsonld, subject, jsonld['@context']?.['@vocab'] || 'https://schema.org/');

	return triples.join('\n');
}
