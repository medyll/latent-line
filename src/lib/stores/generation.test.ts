import { describe, it, expect, beforeEach } from 'vitest';
import { generation, isGenerating, generationStats } from './generation.svelte';

describe('generation store', () => {
	beforeEach(() => {
		generation.reset();
	});

	it('initializes with idle state', () => {
		const state = generation.get('event-1');
		expect(state).toBeUndefined();
	});

	it('starts generation', () => {
		generation.start('event-1');
		const state = generation.get('event-1');
		expect(state?.status).toBe('queued');
		expect(state?.progress).toBe(0);
		expect(state?.error).toBeUndefined();
	});

	it('updates progress', () => {
		generation.start('event-1');
		generation.setProgress('event-1', 50);
		const state = generation.get('event-1');
		expect(state?.status).toBe('generating');
		expect(state?.progress).toBe(50);
	});

	it('completes generation', () => {
		generation.start('event-1');
		generation.complete('event-1', 'base64data');
		const state = generation.get('event-1');
		expect(state?.status).toBe('done');
		expect(state?.progress).toBe(100);
		expect(state?.image_base64).toBe('base64data');
		expect(state?.generated_at).toBeDefined();
	});

	it('sets error state', () => {
		generation.start('event-1');
		generation.error('event-1', 'Connection timeout');
		const state = generation.get('event-1');
		expect(state?.status).toBe('error');
		expect(state?.error).toBe('Connection timeout');
	});

	it('clears specific event state', () => {
		generation.start('event-1');
		generation.start('event-2');
		generation.clear('event-1');
		expect(generation.get('event-1')).toBeUndefined();
		expect(generation.get('event-2')).toBeDefined();
	});

	it('resets all state', () => {
		generation.start('event-1');
		generation.start('event-2');
		generation.reset();
		expect(generation.get('event-1')).toBeUndefined();
		expect(generation.get('event-2')).toBeUndefined();
	});

	it('tracks isGenerating derived store', () => {
		let generating = false;
		isGenerating.subscribe((value) => {
			generating = value;
		});

		expect(generating).toBe(false);
		generation.start('event-1');
		expect(generating).toBe(true);
		generation.complete('event-1', 'base64');
		expect(generating).toBe(false);
	});

	it('tracks generationStats', () => {
		let stats = { total: 0, done: 0, error: 0, generating: 0 };
		generationStats.subscribe((value) => {
			stats = value;
		});

		generation.start('event-1');
		generation.start('event-2');
		expect(stats.total).toBe(2);
		expect(stats.generating).toBe(2);

		generation.complete('event-1', 'base64');
		expect(stats.done).toBe(1);
		expect(stats.generating).toBe(1);

		generation.error('event-2', 'Failed');
		expect(stats.error).toBe(1);
		expect(stats.generating).toBe(0);
	});
});
