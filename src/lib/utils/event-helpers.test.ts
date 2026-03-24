import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEventFromModel } from './event-helpers';

describe('deleteEventFromModel', () => {
	let model: any;

	beforeEach(() => {
		model = { timeline: [{ time: 1 }, { time: 2 }, { time: 3 }] };
		delete (globalThis as any).__TEST__;
		delete (globalThis as any).confirm;
		vi.restoreAllMocks();
	});

	it('bypasses confirm when __TEST__ is true', () => {
		(globalThis as any).__TEST__ = true;
		const res = deleteEventFromModel(model, 2);
		expect(res).toBe(true);
		expect(model.timeline.map((e: any) => e.time)).toEqual([1, 3]);
	});

	it('respects confirm deny when not test', () => {
		(globalThis as any).__TEST__ = false;
		(globalThis as any).confirm = vi.fn(() => false);
		const res = deleteEventFromModel(model, 1);
		expect((globalThis as any).confirm).toHaveBeenCalledWith('Delete event at frame 1?');
		expect(res).toBe(false);
		expect(model.timeline.map((e: any) => e.time)).toEqual([1, 2, 3]);
	});

	it('deletes when confirm accepted', () => {
		(globalThis as any).__TEST__ = false;
		(globalThis as any).confirm = vi.fn(() => true);
		const res = deleteEventFromModel(model, 1);
		expect(res).toBe(true);
		expect(model.timeline.map((e: any) => e.time)).toEqual([2, 3]);
	});
});
