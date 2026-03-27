import { modelSchema } from '$lib/model/model-template';

const DEFAULT_KEY = 'latent-line:model';

/**
 * Creates a debounced save function.
 * - Calling it starts/resets a timer of `delay` ms.
 * - `flush()` executes immediately (used for beforeunload).
 * - `onStatusChange` callback for reactive updates (Svelte 5 compatible).
 */
export function createDebouncedSave(
	saveFn: (model: unknown) => boolean,
	delay = 500,
	onStatusChange?: (status: 'saved' | 'unsaved' | 'saving') => void
) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let _model: unknown = null;
	let _status: 'saved' | 'unsaved' | 'saving' = 'saved';

	function setStatus(newStatus: 'saved' | 'unsaved' | 'saving') {
		_status = newStatus;
		onStatusChange?.(newStatus);
	}

	function flush() {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		if (_model !== null) {
			setStatus('saving');
			saveFn(_model);
			setStatus('saved');
		}
	}

	function schedule(model: unknown) {
		_model = model;
		setStatus('unsaved');
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			setStatus('saving');
			saveFn(_model);
			setStatus('saved');
		}, delay);
	}

	return { schedule, flush };
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
