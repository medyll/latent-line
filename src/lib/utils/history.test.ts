import { describe, it, expect } from 'vitest';
import {
	createHistoryState,
	historyPush,
	historyUndo,
	historyRedo,
	canUndo,
	canRedo,
	HISTORY_MAX
} from './history';

function makeSnapshot(name: string) {
	return { value: name } as any;
}

describe('history (S13-01)', () => {
	it('starts with empty past and future', () => {
		const state = createHistoryState();
		expect(canUndo(state)).toBe(false);
		expect(canRedo(state)).toBe(false);
	});

	it('push adds to past and clears future', () => {
		const state = createHistoryState();
		historyPush(state, makeSnapshot('a'));
		expect(canUndo(state)).toBe(true);
		expect(canRedo(state)).toBe(false);
		expect(state.past).toHaveLength(1);
	});

	it('undo returns previous snapshot', () => {
		const state = createHistoryState();
		const a = makeSnapshot('a');
		const b = makeSnapshot('b');
		historyPush(state, a);
		const result = historyUndo(state, b);
		expect(result).toEqual(a);
	});

	it('undo moves current to future', () => {
		const state = createHistoryState();
		historyPush(state, makeSnapshot('a'));
		historyUndo(state, makeSnapshot('b'));
		expect(canRedo(state)).toBe(true);
		expect(state.future).toHaveLength(1);
	});

	it('undo returns null when past is empty', () => {
		const state = createHistoryState();
		expect(historyUndo(state, makeSnapshot('x'))).toBeNull();
	});

	it('redo returns next snapshot', () => {
		const state = createHistoryState();
		historyPush(state, makeSnapshot('a'));
		const b = makeSnapshot('b');
		historyUndo(state, b);
		const result = historyRedo(state, makeSnapshot('a'));
		expect(result).toEqual(b);
	});

	it('redo returns null when future is empty', () => {
		const state = createHistoryState();
		expect(historyRedo(state, makeSnapshot('x'))).toBeNull();
	});

	it('push clears redo stack', () => {
		const state = createHistoryState();
		historyPush(state, makeSnapshot('a'));
		historyUndo(state, makeSnapshot('b'));
		expect(canRedo(state)).toBe(true);
		historyPush(state, makeSnapshot('c'));
		expect(canRedo(state)).toBe(false);
	});

	it('snapshots are isolated (structuredClone)', () => {
		const state = createHistoryState<{ items: string[] }>();
		const obj = { items: ['x'] };
		historyPush(state, obj);
		obj.items.push('y'); // mutate original
		const restored = historyUndo(state, obj);
		expect(restored?.items).toHaveLength(1); // clone not affected
	});

	it(`caps history at ${HISTORY_MAX} entries`, () => {
		const state = createHistoryState();
		for (let i = 0; i <= HISTORY_MAX + 5; i++) {
			historyPush(state, makeSnapshot(`s${i}`));
		}
		expect(state.past.length).toBeLessThanOrEqual(HISTORY_MAX);
	});

	it('full undo/redo round-trip preserves order', () => {
		const state = createHistoryState<string>();
		historyPush(state, 'a');
		historyPush(state, 'b');
		// current = 'c', past = ['a','b']
		const afterUndo1 = historyUndo(state, 'c');
		expect(afterUndo1).toBe('b');
		const afterUndo2 = historyUndo(state, 'b');
		expect(afterUndo2).toBe('a');
		const afterRedo1 = historyRedo(state, 'a');
		expect(afterRedo1).toBe('b');
		const afterRedo2 = historyRedo(state, 'b');
		expect(afterRedo2).toBe('c');
	});
});
