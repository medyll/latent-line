import { modelSchema } from '$lib/model/model-template';

const DEFAULT_KEY = 'latent-line:model';

/**
 * Creates a debounced save function.
 * - Calling it starts/resets a timer of `delay` ms.
 * - `flush()` executes immediately (used for beforeunload).
 * - `status` is a reactive Svelte 5 $state: 'saved' | 'unsaved' | 'saving'.
 */
export function createDebouncedSave(saveFn: (model: unknown) => boolean, delay = 500) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let _model: unknown = null;
	const status = $state({ value: 'saved' as 'saved' | 'unsaved' | 'saving' });

	function flush() {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		if (_model !== null) {
			status.value = 'saving';
			saveFn(_model);
			status.value = 'saved';
		}
	}

	function schedule(model: unknown) {
		_model = model;
		status.value = 'unsaved';
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			status.value = 'saving';
			saveFn(_model);
			status.value = 'saved';
		}, delay);
	}

	return { schedule, flush, status };
}

export function loadModelFromLocalStorage(key = DEFAULT_KEY) {
	try {
		if (typeof localStorage === 'undefined') return null;
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const validated = modelSchema.safeParse(parsed);
		return validated.success ? (validated.data as any) : null;
	} catch {
		return null;
	}
}

export function saveModelToLocalStorage(model: unknown, key = DEFAULT_KEY) {
	// Clone model to plain JSON object before validating to avoid proxy/non-enumerable issues
	const candidate = JSON.parse(JSON.stringify(model));
	try {
		const validated = modelSchema.safeParse(candidate);
		if (!validated.success) return false;
		localStorage.setItem(key, JSON.stringify(validated.data));
		return true;
	} catch (err) {
		// surface unexpected errors during E2E runs for easier debugging

		console.error('[persistence] save failed', err);
		return false;
	}
}
