import { describe, it, expect, beforeEach } from 'vitest';
import { generation, isGenerating, generationStats } from './generation.svelte';

describe('generation store', () => {
	beforeEach(() => {
		generation.reset();
	});

	it('initializes empty', () => {
		let state: any;
		generation.subscribe((s) => {
			state = s;
		})();
		expect(state.size).toBe(0);
	});

	it('tracks event generation state', () => {
		generation.start('event_0');
		const state = generation.get('event_0');

		expect(state).toBeDefined();
		expect(state?.status).toBe('queued');
		expect(state?.progress).toBe(0);
	});

	it('updates progress', () => {
		generation.start('event_0');
		generation.setProgress('event_0', 50);

		const state = generation.get('event_0');
		expect(state?.progress).toBe(50);
		expect(state?.status).toBe('generating');
	});

	it('marks generation complete', () => {
		generation.start('event_0');
		generation.complete('event_0', 'data:image/png;base64,...');

		const state = generation.get('event_0');
		expect(state?.status).toBe('done');
		expect(state?.progress).toBe(100);
		expect(state?.image_base64).toBe('data:image/png;base64,...');
		expect(state?.generated_at).toBeDefined();
	});

	it('tracks errors', () => {
		generation.start('event_0');
		generation.error('event_0', 'Connection timeout');

		const state = generation.get('event_0');
		expect(state?.status).toBe('error');
		expect(state?.error).toBe('Connection timeout');
	});

	it('clears individual event state', () => {
		generation.start('event_0');
		generation.start('event_1');
		generation.clear('event_0');

		expect(generation.get('event_0')).toBeUndefined();
		expect(generation.get('event_1')).toBeDefined();
	});

	it('resets all state', () => {
		generation.start('event_0');
		generation.start('event_1');
		generation.reset();

		let state: any;
		generation.subscribe((s) => {
			state = s;
		})();
		expect(state.size).toBe(0);
	});

	describe('isGenerating derived', () => {
		it('returns false when idle', () => {
			generation.start('event_0');
			generation.complete('event_0', 'data:...');

			let generating = false;
			isGenerating.subscribe((v) => {
				generating = v;
			})();

			expect(generating).toBe(false);
		});

		it('returns true when queued', () => {
			generation.start('event_0');

			let generating = false;
			isGenerating.subscribe((v) => {
				generating = v;
			})();

			expect(generating).toBe(true);
		});

		it('returns true when generating', () => {
			generation.start('event_0');
			generation.setProgress('event_0', 50);

			let generating = false;
			isGenerating.subscribe((v) => {
				generating = v;
			})();

			expect(generating).toBe(true);
		});
	});

	describe('generationStats derived', () => {
		it('counts states correctly', () => {
			generation.start('event_0');
			generation.start('event_1');
			generation.complete('event_0', 'data:...');
			generation.error('event_2', 'Error');

			let stats: any;
			generationStats.subscribe((v) => {
				stats = v;
			})();

			expect(stats.total).toBe(3);
			expect(stats.done).toBe(1);
			expect(stats.error).toBe(1);
			expect(stats.generating).toBe(1);
		});
	});
});
