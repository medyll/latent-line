import { describe, expect, it, vi } from 'vitest';
import { RenderClient, RenderClientError, isTerminal } from './render-client';

function client(fetchImpl: unknown, apiToken = 'test-token') {
	return new RenderClient({
		baseUrl: 'http://gateway.test',
		apiToken,
		fetchImpl: fetchImpl as typeof fetch
	});
}

describe('RenderClient', () => {
	it('sends the bearer token and lists installed models', async () => {
		const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
			expect(input).toBe('http://gateway.test/api/render/models');
			expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token');
			return Response.json([{ id: 'wan2.2-ti2v-5b', label: 'Wan 2.2 TI2V-5B (local)' }]);
		});

		await expect(client(fetchMock).listModels()).resolves.toMatchObject([
			{ id: 'wan2.2-ti2v-5b' }
		]);
	});

	it('omits the authorization header when no token is configured', async () => {
		const fetchMock = vi.fn(async (_input: string, init?: RequestInit) => {
			expect(new Headers(init?.headers).has('authorization')).toBe(false);
			return Response.json([]);
		});
		const anonymous = new RenderClient({
			baseUrl: 'http://gateway.test',
			fetchImpl: fetchMock as unknown as typeof fetch
		});

		await anonymous.listModels();
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('submits a job with modelId and flat inputs', async () => {
		const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
			expect(input).toBe('http://gateway.test/api/render/jobs');
			expect(init?.method).toBe('POST');
			expect(JSON.parse(String(init?.body))).toEqual({
				modelId: 'wan2.2-ti2v-5b',
				inputs: { positive_prompt: 'Ocean at dusk', seed: 42 }
			});
			return Response.json({ id: 'job-1', status: 'queued', progress: 0 }, { status: 202 });
		});

		await expect(
			client(fetchMock).submitJob('wan2.2-ti2v-5b', {
				positive_prompt: 'Ocean at dusk',
				seed: 42
			})
		).resolves.toMatchObject({ id: 'job-1', status: 'queued' });
	});

	it('surfaces the gateway error message and status', async () => {
		const fetchMock = vi.fn(
			async () => new Response(JSON.stringify({ error: 'Unknown inputs: workflow' }), { status: 400 })
		);

		await expect(client(fetchMock).submitJob('wan2.2-ti2v-5b', {})).rejects.toMatchObject({
			message: 'Unknown inputs: workflow',
			status: 400
		});
		await expect(client(fetchMock).submitJob('wan2.2-ti2v-5b', {})).rejects.toBeInstanceOf(
			RenderClientError
		);
	});

	it('falls back to a generic message when the error body is not JSON', async () => {
		const fetchMock = vi.fn(async () => new Response('<html>502</html>', { status: 502 }));

		await expect(client(fetchMock).listModels()).rejects.toMatchObject({
			message: 'Render gateway returned 502',
			status: 502
		});
	});

	it('polls until the job reaches a terminal state, reporting progress', async () => {
		const responses = [
			{ id: 'job-1', status: 'running', progress: 30, artifacts: [] },
			{ id: 'job-1', status: 'running', progress: 80, artifacts: [] },
			{
				id: 'job-1',
				status: 'completed',
				progress: 100,
				artifacts: [{ filename: 'job-1.mp4', kind: 'video' }]
			}
		];
		const fetchMock = vi.fn(async () => Response.json(responses.shift()));
		const seen: number[] = [];

		const job = await client(fetchMock).waitForJob('job-1', {
			intervalMs: 0,
			onProgress: (update) => seen.push(update.progress)
		});

		expect(seen).toEqual([30, 80, 100]);
		expect(job).toMatchObject({ status: 'completed', artifacts: [{ kind: 'video' }] });
	});

	it('stops polling when the caller aborts', async () => {
		const controller = new AbortController();
		const fetchMock = vi.fn(async () => {
			controller.abort();
			return Response.json({ id: 'job-1', status: 'running', progress: 10, artifacts: [] });
		});

		await expect(
			client(fetchMock).waitForJob('job-1', { intervalMs: 5, signal: controller.signal })
		).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('builds an artifact URL for a job output', () => {
		expect(client(vi.fn()).artifactUrl('job-1', 0)).toBe(
			'http://gateway.test/api/render/jobs/job-1/artifacts/0'
		);
	});
});

describe('isTerminal', () => {
	it('treats completed, failed and cancelled as terminal', () => {
		expect(isTerminal('completed')).toBe(true);
		expect(isTerminal('failed')).toBe(true);
		expect(isTerminal('cancelled')).toBe(true);
		expect(isTerminal('queued')).toBe(false);
		expect(isTerminal('running')).toBe(false);
	});
});
