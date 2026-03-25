/**
 * Pure (non-Svelte) undo/redo history for any serializable value.
 * Uses structuredClone for snapshot isolation.
 * Max 50 entries to cap memory usage.
 */

export const HISTORY_MAX = 50;

export interface HistoryState<T> {
	past: T[];
	future: T[];
}

export function createHistoryState<T>(): HistoryState<T> {
	return { past: [], future: [] };
}

/** Push a snapshot before a mutation. Clears the redo stack. */
export function historyPush<T>(state: HistoryState<T>, snapshot: T): void {
	state.past.push(structuredClone(snapshot));
	if (state.past.length > HISTORY_MAX) state.past.shift();
	state.future = [];
}

/** Undo: returns the previous snapshot, or null if nothing to undo. */
export function historyUndo<T>(state: HistoryState<T>, current: T): T | null {
	if (state.past.length === 0) return null;
	state.future.unshift(structuredClone(current));
	return state.past.pop()!;
}

/** Redo: returns the next snapshot, or null if nothing to redo. */
export function historyRedo<T>(state: HistoryState<T>, current: T): T | null {
	if (state.future.length === 0) return null;
	state.past.push(structuredClone(current));
	return state.future.shift()!;
}

export const canUndo = <T>(state: HistoryState<T>): boolean => state.past.length > 0;
export const canRedo = <T>(state: HistoryState<T>): boolean => state.future.length > 0;

/** Clear all undo/redo history (e.g. after a new project is created). */
export function historyClear<T>(state: HistoryState<T>): void {
	state.past = [];
	state.future = [];
}
