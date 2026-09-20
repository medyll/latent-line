/**
 * Pure (non-Svelte) undo/redo history for any serializable value.
 * Uses structuredClone for snapshot isolation.
 * Max 50 entries to cap memory usage.
 */

/** How many snapshots the undo stack keeps. Older ones fall off the bottom. */
export const HISTORY_MAX = 50;

/** Undo and redo stacks. `past` is oldest-first; `future` is next-to-redo-first. */
export interface HistoryState<T> {
	past: T[];
	future: T[];
}

/** An empty history. */
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

/** Whether there is anything to undo. */
export const canUndo = <T>(state: HistoryState<T>): boolean => state.past.length > 0;
/** Whether there is anything to redo. */
export const canRedo = <T>(state: HistoryState<T>): boolean => state.future.length > 0;

/** Clear all undo/redo history (e.g. after a new project is created). */
export function historyClear<T>(state: HistoryState<T>): void {
	state.past = [];
	state.future = [];
}
