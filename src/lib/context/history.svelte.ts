import {
	createHistoryState,
	historyPush,
	historyUndo,
	historyRedo,
	historyClear,
	canUndo,
	canRedo
} from '$lib/utils/history';
import type { Model } from '$lib/model/model-types';

/**
 * Reactive undo/redo store for the Model.
 * Exposed via context (HISTORY_STORE_KEY).
 */
export function createModelHistory() {
	const state = createHistoryState<Model>();
	let _canUndo = $state(false);
	let _canRedo = $state(false);

	function _sync() {
		_canUndo = canUndo(state);
		_canRedo = canRedo(state);
	}

	return {
		push(snapshot: Model) {
			historyPush(state, snapshot);
			_sync();
		},

		undo(current: Model): Model | null {
			const prev = historyUndo(state, current);
			_sync();
			return prev;
		},

		redo(current: Model): Model | null {
			const next = historyRedo(state, current);
			_sync();
			return next;
		},

		clear() {
			historyClear(state);
			_sync();
		},

		get canUndo() {
			return _canUndo;
		},
		get canRedo() {
			return _canRedo;
		}
	};
}

export type ModelHistory = ReturnType<typeof createModelHistory>;
