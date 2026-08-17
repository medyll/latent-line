import { describe, expect, it, vi } from 'vitest';
import { RenderWorkerClient } from './render-worker-client';

describe('RenderWorkerClient', () => {
	it('submits a job with the model entrypoint and job id', async () => {
		const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			expect(url).toBe('http://worker.test/jobs');
			const body = JSON.parse(String(init?.body));
			expect(body).toEqual({
				model: 'wan2.2-ti2v-5b',
				jobId: 'job-1',
				inputs: { positive_prompt: 'Ocean at dusk' }
			});
			return Response.json({ jobId: 'job-1' });
		});
		const client = new RenderWorkerClient({
			baseUrl: 'http://worker.test',
			fetchImpl: fetchMock as unknown as typeof fetch
		});

		await client.submit('wan2.2-ti2v-5b', 'job-1', { positive_prompt: 'Ocean at dusk' });
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('reports job status and treats 404 as unknown', async () => {
		const fetchMock = vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.endsWith('/jobs/job-1')) {
				return Response.json({
					state: 'completed',
					progress: 100,
					artifacts: [{ filename: 'job-1.mp4', kind: 'video' }]
				});
			}
			if (url.endsWith('/jobs/missing')) {
				return new Response(null, { status: 404 });
			}
			throw new Error(`Unexpected request: ${url}`);
		});
		const client = new RenderWorkerClient({
			baseUrl: 'http://worker.test',
			fetchImpl: fetchMock as unknown as typeof fetch
		});

		await expect(client.status('job-1')).resolves.toMatchObject({ state: 'completed' });
		await expect(client.status('missing')).resolves.toBeUndefined();
	});

	it('uploads an image and returns the worker-assigned name', async () => {
		const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			expect(String(input)).toBe('http://worker.test/uploads');
			expect(init?.body).toBeInstanceOf(FormData);
			return Response.json({ name: 'start.png' });
		});
		const client = new RenderWorkerClient({
			baseUrl: 'http://worker.test',
			fetchImpl: fetchMock as unknown as typeof fetch
		});

		await expect(
			client.uploadImage('start.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 'image/png')
		).resolves.toBe('start.png');
	});

	it('rejects non-http base URLs', () => {
		expect(() => new RenderWorkerClient({ baseUrl: 'file:///etc/passwd' })).toThrow(
			'RENDER_WORKER_URL must use http or https'
		);
	});
});
