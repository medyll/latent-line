/**
 * generation.svelte.ts
 *
 * Reactive store for tracking AI image generation state.
 * Manages per-event generation progress, results, and errors.
 *
 * Used by timeline events to display generate buttons and progress indicators.
 */

import { writable, derived } from 'svelte/store';

export type GenerationStatus = 'idle' | 'queued' | 'generating' | 'done' | 'error';

export interface EventGenerationState {
	event_id: string;
	status: GenerationStatus;
	progress?: number; // 0-100
	error?: string;
	image_base64?: string; // Generated image
	generated_at?: number; // Timestamp
}

// Global generation state store (per-event tracking)
const createGenerationStore = () => {
	const store = writable<Map<string, EventGenerationState>>(new Map());

	return {
		subscribe: store.subscribe,

		/** Update generation state for an event */
		update(event_id: string, partial: Partial<EventGenerationState>) {
			store.update((map) => {
				const current = map.get(event_id) ?? {
					event_id,
					status: 'idle'
				};
				map.set(event_id, { ...current, ...partial });
				return map;
			});
		},

		/** Get state for a specific event */
		get(event_id: string): EventGenerationState | undefined {
			let result: EventGenerationState | undefined;
			store.subscribe((map) => {
				result = map.get(event_id);
			})();
			return result;
		},

		/** Set generation in progress */
		start(event_id: string) {
			this.update(event_id, { status: 'queued', progress: 0, error: undefined });
		},

		/** Set generation complete */
		complete(event_id: string, image_base64: string) {
			this.update(event_id, {
				status: 'done',
				progress: 100,
				image_base64,
				generated_at: Date.now()
			});
		},

		/** Set generation error */
		error(event_id: string, error: string) {
			this.update(event_id, { status: 'error', error, progress: 0 });
		},

		/** Update progress */
		setProgress(event_id: string, progress: number) {
			this.update(event_id, { status: 'generating', progress });
		},

		/** Clear state for an event */
		clear(event_id: string) {
			store.update((map) => {
				map.delete(event_id);
				return map;
			});
		},

		/** Clear all state */
		reset() {
			store.set(new Map());
		}
	};
};

export const generation = createGenerationStore();

/**
 * Derived store: check if any event is currently generating
 */
export const isGenerating = derived(
	{ subscribe: generation.subscribe },
	(state) => {
		for (const entry of state.values()) {
			if (entry.status === 'queued' || entry.status === 'generating') {
				return true;
			}
		}
		return false;
	}
);

/**
 * Derived store: count completed generations
 */
export const generationStats = derived(
	{ subscribe: generation.subscribe },
	(state) => {
		let total = state.size;
		let done = 0;
		let error = 0;
		let generating = 0;

		for (const entry of state.values()) {
			if (entry.status === 'done') done++;
			if (entry.status === 'error') error++;
			if (entry.status === 'queued' || entry.status === 'generating') generating++;
		}

		return { total, done, error, generating };
	}
);
