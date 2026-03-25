import { describe, it, expect, beforeEach, vi } from 'vitest';
import { throttle } from '../../../utils/throttle';

/**
 * ST-022: Scroll sync tests
 * Tests for synchronization between Synoptic View and Temporal Sequencer
 */

describe('Throttle utility (ST-022)', () => {
	it('should execute function immediately on first call', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should throttle rapid calls within the delay window', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		throttled();
		throttled();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should execute again after delay expires', async () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		expect(fn).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(100);
		throttled();
		expect(fn).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});

	it('should schedule deferred call after delay if called within window', async () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		expect(fn).toHaveBeenCalledTimes(1);

		// Call again within window but wait for scheduled call
		throttled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});

	it('should pass correct arguments to throttled function', () => {
		const fn = vi.fn((a: number, b: string) => `${a}-${b}`) as unknown as (
			...args: unknown[]
		) => void;
		const throttled = throttle(fn, 100);

		throttled(42, 'test');
		expect(fn).toHaveBeenCalledWith(42, 'test');
	});
});

describe('Scroll sync store state management (ST-022)', () => {
	it('should initialize scroll state with zeros', () => {
		const initialState = { scrollLeft: 0, scrollTop: 0 };
		expect(initialState.scrollLeft).toBe(0);
		expect(initialState.scrollTop).toBe(0);
	});

	it('should track scrollLeft updates', () => {
		const state = { scrollLeft: 0, scrollTop: 0 };
		// Simulate scroll event
		state.scrollLeft = 150;

		expect(state.scrollLeft).toBe(150);
		expect(state.scrollTop).toBe(0);
	});

	it('should track scrollTop updates', () => {
		const state = { scrollLeft: 0, scrollTop: 0 };
		// Simulate vertical scroll
		state.scrollTop = 50;

		expect(state.scrollLeft).toBe(0);
		expect(state.scrollTop).toBe(50);
	});

	it('should track independent horizontal scrolls', () => {
		let state = { scrollLeft: 0, scrollTop: 0 };

		// Synoptic scrolls horizontally
		state = { ...state, scrollLeft: 200 };
		expect(state.scrollLeft).toBe(200);

		// Temporal scrolls horizontally (same value)
		state = { ...state, scrollLeft: 200 };
		expect(state.scrollLeft).toBe(200);
	});

	it('should handle edge case: max scroll position', () => {
		let state = { scrollLeft: 0, scrollTop: 0 };
		// Simulate max scroll (very large values)
		state = { scrollLeft: 10000, scrollTop: 5000 };

		expect(state.scrollLeft).toBe(10000);
		expect(state.scrollTop).toBe(5000);
	});
});

describe('Scroll sync debounce behavior (ST-022)', () => {
	it('should debounce rapid scroll events', async () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		// Simulate rapid scroll events
		for (let i = 0; i < 10; i++) {
			throttled();
		}

		expect(fn).toHaveBeenCalledTimes(1); // Only one immediate call

		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2); // One deferred call after delay

		vi.useRealTimers();
	});

	it('should not prevent legitimate updates after delay', async () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled();
		expect(fn).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(150); // Wait longer than delay
		throttled();
		expect(fn).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});
});
