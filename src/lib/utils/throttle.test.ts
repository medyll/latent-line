import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('calls fn immediately on first invocation', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a');
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('a');
	});

	it('throttles subsequent calls within delay', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a');
		t('b'); // within delay — should be scheduled, not immediate
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('executes scheduled call after delay elapses', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a');
		t('b');
		vi.advanceTimersByTime(110);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('executes immediately again after delay has passed', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a');
		vi.advanceTimersByTime(110);
		t('b');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('respects delay between rapid calls', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a'); t('b'); t('c'); // all within delay — only 'a' fires immediately
		expect(fn).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(110);
		expect(fn).toHaveBeenCalledTimes(2); // deferred call fires once
	});

	it('does not schedule duplicate timeouts', () => {
		const fn = vi.fn();
		const t = throttle(fn, 100);
		t('a');
		t('b');
		t('c'); // second call within delay — no new timeout
		vi.advanceTimersByTime(110);
		expect(fn).toHaveBeenCalledTimes(2); // initial + one deferred
	});
});
