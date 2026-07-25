import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIBackend } from './ai-backend';

afterEach(() => {
	vi.unstubAllGlobals();
});

function comfyBackend() {
	return new AIBackend({
		backend: 'comfyui',
		url: 'http://comfy.test'
	});
}

describe('ComfyUI backend contract', () => {
	it('uses system_stats for the health check', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(comfyBackend().testConnection()).resolves.toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledWith(
			'http://comfy.test/system_stats',
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('reports a completed prompt from history', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						job_1: { outputs: { save_video: {} }, status: { completed: true } }
					}),
					{ status: 200 }
				)
			)
		);

		await expect(comfyBackend().checkProgress('job_1')).resolves.toEqual({
			status: 'done',
			progress: 100
		});
	});

	it('reports a prompt waiting in the ComfyUI queue', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('{}', { status: 200 }))
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ queue_running: [], queue_pending: [[0, 'job_2']] }), {
					status: 200
				})
			);
		vi.stubGlobal('fetch', fetchMock);

		await expect(comfyBackend().checkProgress('job_2')).resolves.toEqual({ status: 'queued' });
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			'http://comfy.test/history/job_2',
			expect.any(Object)
		);
		expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://comfy.test/queue', expect.any(Object));
	});

	it('keeps generation disabled until a versioned API workflow is configured', async () => {
		await expect(
			comfyBackend().generate({
				prompt: 'test'
			})
		).rejects.toThrow('ComfyUI backend not yet implemented');
	});
});
