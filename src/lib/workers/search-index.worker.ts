/**
 * Search Index Worker
 * 
 * Handles heavy search indexing operations in a background thread.
 * Keeps main thread responsive during large model indexing.
 */

interface SearchIndex {
	characterNames: Set<string>;
	environmentNames: Set<string>;
	eventLabels: Map<string, string[]>;
	tags: Map<string, string[]>;
}

interface SearchQuery {
	query: string;
	model: any;
	filters?: {
		characters?: string[];
		environments?: string[];
		tags?: string[];
	};
}

interface SearchResult {
	characters: any[];
	environments: any[];
	events: any[];
	total: number;
	queryTime: number;
}

// Build search index from model
function buildIndex(model: any): SearchIndex {
	const index: SearchIndex = {
		characterNames: new Set<string>(),
		environmentNames: new Set<string>(),
		eventLabels: new Map<string, string[]>(),
		tags: new Map<string, string[]>()
	};

	// Index characters
	if (model.assets?.characters) {
		model.assets.characters.forEach((char: any) => {
			index.characterNames.add(char.name.toLowerCase());
			if (char.tags) {
				char.tags.forEach((tag: string) => {
					const tagLower = tag.toLowerCase();
					if (!index.tags.has(tagLower)) {
						index.tags.set(tagLower, []);
					}
					index.tags.get(tagLower)!.push(`character:${char.id}`);
				});
			}
		});
	}

	// Index environments
	if (model.assets?.environments) {
		model.assets.environments.forEach((env: any) => {
			index.environmentNames.add(env.name.toLowerCase());
			if (env.tags) {
				env.tags.forEach((tag: string) => {
					const tagLower = tag.toLowerCase();
					if (!index.tags.has(tagLower)) {
						index.tags.set(tagLower, []);
					}
					index.tags.get(tagLower)!.push(`environment:${env.id}`);
				});
			}
		});
	}

	// Index timeline events
	if (model.timeline) {
		model.timeline.forEach((event: any) => {
			const words: string[] = [];
			
			if (event.label) {
				words.push(event.label.toLowerCase());
			}
			if (event.speechText) {
				words.push(...event.speechText.toLowerCase().split(/\s+/));
			}
			if (event.notes) {
				words.push(...event.notes.toLowerCase().split(/\s+/));
			}
			if (event.tags) {
				event.tags.forEach((tag: string) => {
					const tagLower = tag.toLowerCase();
					if (!index.tags.has(tagLower)) {
						index.tags.set(tagLower, []);
					}
					index.tags.get(tagLower)!.push(`event:${event.id}`);
				});
			}

			index.eventLabels.set(event.id, words);
		});
	}

	return index;
}

// Perform search on indexed data
function search(index: SearchIndex, query: SearchQuery): SearchResult {
	const startTime = performance.now();
	const queryLower = query.query.toLowerCase();
	const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);

	const results: SearchResult = {
		characters: [],
		environments: [],
		events: [],
		total: 0,
		queryTime: 0
	};

	// Search characters
	if (query.model.assets?.characters) {
		results.characters = query.model.assets.characters.filter((char: any) => {
			const nameMatch = char.name.toLowerCase().includes(queryLower);
			const tagMatch = char.tags?.some((tag: string) => 
				tag.toLowerCase().includes(queryLower)
			);
			return nameMatch || tagMatch;
		});
	}

	// Search environments
	if (query.model.assets?.environments) {
		results.environments = query.model.assets.environments.filter((env: any) => {
			const nameMatch = env.name.toLowerCase().includes(queryLower);
			const tagMatch = env.tags?.some((tag: string) => 
				tag.toLowerCase().includes(queryLower)
			);
			return nameMatch || tagMatch;
		});
	}

	// Search events
	if (query.model.timeline) {
		results.events = query.model.timeline.filter((event: any) => {
			const words = index.eventLabels.get(event.id) || [];
			
			// Check if any query word matches
			const matches = queryWords.some((qWord) => {
				return words.some((word) => word.includes(qWord));
			});

			// Also check speech text and notes
			const speechMatch = event.speechText?.toLowerCase().includes(queryLower);
			const notesMatch = event.notes?.toLowerCase().includes(queryLower);
			const labelMatch = event.label?.toLowerCase().includes(queryLower);

			return matches || speechMatch || notesMatch || labelMatch;
		});
	}

	results.total = results.characters.length + results.environments.length + results.events.length;
	results.queryTime = Math.round(performance.now() - startTime);

	return results;
}

// Handle messages from main thread
self.onmessage = function(e: MessageEvent) {
	const { type, data, taskId } = e.data;

	try {
		if (type === 'index') {
			// Build search index
			const index = buildIndex(data.model);
			self.postMessage({
				type: 'result',
				taskId,
				data: { index, modelSize: data.model.timeline?.length || 0 }
			});
		} else if (type === 'search') {
			// Perform search
			const index = data.index || buildIndex(data.model);
			const results = search(index, data.query);
			self.postMessage({
				type: 'result',
				taskId,
				data: results
			});
		} else if (type === 'reindex') {
			// Rebuild index with progress
			const totalSteps = 3;
			let currentStep = 0;

			self.postMessage({
				type: 'progress',
				taskId,
				progress: 0
			});

			const index = buildIndex(data.model);
			currentStep++;
			self.postMessage({
				type: 'progress',
				taskId,
				progress: Math.round((currentStep / totalSteps) * 100)
			});

			self.postMessage({
				type: 'result',
				taskId,
				data: { index }
			});
		} else {
			throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		self.postMessage({
			type: 'error',
			taskId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};

export {};
