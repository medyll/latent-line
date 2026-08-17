import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { JobStore } from './job-store';
import { ModelRegistry } from './model-registry';
import { RenderGateway } from './render-gateway';
import { RenderWorkerClient } from './render-worker-client';

describe('RenderGateway', () => {
	let directory: string;
	let server: Server;
	let baseUrl: string;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'latent-line-gateway-'));
		await installModel(directory);
		const registry = new ModelRegistry(path.join(directory, 'models'));
		await registry.load();
		const store = new JobStore(path.join(directory, 'data', 'jobs.json'));
		await store.load();

		let jobId = '';
		fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/health')) return Response.json({ gpu: 'test-gpu' });
			if (url.endsWith('/jobs') && init?.method === 'POST') {
				const body = JSON.parse(String(init?.body));
				expect(body.model).toBe('wan2.2-ti2v-5b-test');
				expect(body.inputs.positive_prompt).toBe('Ocean at dusk');
				jobId = body.jobId;
				return Response.json({ jobId });
			}
			if (url.endsWith(`/jobs/${jobId}`)) {
				return Response.json({
					state: 'completed',
					progress: 100,
					artifacts: [{ filename: `${jobId}.mp4`, kind: 'video' }]
				});
			}
			if (url.includes('/artifacts/')) {
				return new Response('video-bytes', { headers: { 'content-type': 'video/mp4' } });
			}
			if (url.endsWith('/uploads')) {
				expect(init?.body).toBeInstanceOf(FormData);
				return Response.json({ name: 'start.png' });
			}
			throw new Error(`Unexpected render worker request: ${url}`);
		});

		const gateway = new RenderGateway({
			client: new RenderWorkerClient({
				baseUrl: 'http://worker.test',
				fetchImpl: fetchMock as unknown as typeof fetch
			}),
			registry,
			store,
			apiToken: 'secret-token',
			allowedOrigins: ['http://localhost:5167'],
			maxActiveJobs: 2,
			maxBodyBytes: 10_000
		});
		server = createServer(async (request, response) => {
			if (!(await gateway.handle(request, response))) response.writeHead(404).end();
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Missing test server address');
		baseUrl = `http://127.0.0.1:${address.port}`;
	});

	afterEach(async () => {
		await new Promise<void>((resolve, reject) =>
			server.close((error) => (error ? reject(error) : resolve()))
		);
		await rm(directory, { recursive: true, force: true });
	});

	it('requires authentication and lists safe model metadata', async () => {
		expect((await fetch(`${baseUrl}/api/render/models`)).status).toBe(401);

		const response = await api('/api/render/models');
		expect(response.status).toBe(200);
		const models = (await response.json()) as Record<string, unknown>[];
		expect(models[0]).toMatchObject({ id: 'wan2.2-ti2v-5b-test', version: '1.0.0' });
	});

	it('submits, persists and resolves a completed local render job', async () => {
		const submitted = await api('/api/render/jobs', {
			method: 'POST',
			body: JSON.stringify({
				modelId: 'wan2.2-ti2v-5b-test',
				inputs: { positive_prompt: 'Ocean at dusk', seed: 42 }
			})
		});
		expect(submitted.status).toBe(202);
		const queued = (await submitted.json()) as { id: string; status: string };
		expect(queued.status).toBe('queued');

		const completed = await api(`/api/render/jobs/${queued.id}`);
		expect(await completed.json()).toMatchObject({
			status: 'completed',
			progress: 100,
			artifacts: [{ filename: `${queued.id}.mp4`, kind: 'video' }]
		});

		const artifact = await api(`/api/render/jobs/${queued.id}/artifacts/0`);
		expect(artifact.headers.get('content-type')).toBe('video/mp4');
		expect(await artifact.text()).toBe('video-bytes');

		const reloadedStore = new JobStore(path.join(directory, 'data', 'jobs.json'));
		await reloadedStore.load();
		expect(reloadedStore.get(queued.id)?.status).toBe('completed');
	});

	it('rejects raw or unknown model parameters', async () => {
		const response = await api('/api/render/jobs', {
			method: 'POST',
			body: JSON.stringify({
				modelId: 'wan2.2-ti2v-5b-test',
				inputs: { positive_prompt: 'Ocean at dusk', seed: 42, workflow: {} }
			})
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: expect.stringContaining('Unknown inputs')
		});
	});

	it('uploads a validated I2V source image without exposing the render worker', async () => {
		const response = await api('/api/render/uploads', {
			method: 'POST',
			body: JSON.stringify({
				filename: 'start.png',
				mimeType: 'image/png',
				base64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]).toString('base64')
			})
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ name: 'start.png' });
	});

	function api(pathname: string, init: RequestInit = {}): Promise<Response> {
		return fetch(`${baseUrl}${pathname}`, {
			...init,
			headers: {
				authorization: 'Bearer secret-token',
				'content-type': 'application/json',
				...init.headers
			}
		});
	}
});

async function installModel(directory: string): Promise<void> {
	const models = path.join(directory, 'models');
	await import('node:fs/promises').then(({ mkdir }) => mkdir(models));
	await writeFile(
		path.join(models, 'wan2.2-ti2v-5b-test.manifest.json'),
		JSON.stringify({
			id: 'wan2.2-ti2v-5b-test',
			version: '1.0.0',
			label: 'Wan 2.2 TI2V-5B (test)',
			mode: 'text-to-video',
			entrypoint: 'wan2.2-ti2v-5b-test',
			inputs: {
				positive_prompt: { type: 'string', required: true },
				seed: { type: 'integer', required: false, min: 0 }
			}
		})
	);
}
