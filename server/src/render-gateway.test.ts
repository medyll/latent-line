import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { ComfyClient } from './comfy-client';
import { JobStore } from './job-store';
import { RenderGateway } from './render-gateway';
import { WorkflowRegistry } from './workflow-registry';

describe('RenderGateway', () => {
	let directory: string;
	let server: Server;
	let baseUrl: string;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'latent-line-gateway-'));
		await installWorkflow(directory);
		const registry = new WorkflowRegistry(path.join(directory, 'workflows'));
		await registry.load();
		const store = new JobStore(path.join(directory, 'data', 'jobs.json'));
		await store.load();

		fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/system_stats')) return Response.json({ devices: [{ name: 'test-gpu' }] });
			if (url.endsWith('/prompt')) {
				const body = JSON.parse(String(init?.body));
				expect(body.prompt['1'].inputs.text).toBe('Ocean at dusk');
				return Response.json({ prompt_id: 'prompt-1' });
			}
			if (url.endsWith('/history/prompt-1')) {
				return Response.json({
					'prompt-1': {
						status: { completed: true, status_str: 'success' },
						outputs: {
							'9': {
								gifs: [{ filename: 'clip.mp4', subfolder: 'video', type: 'output' }]
							}
						}
					}
				});
			}
			if (url.includes('/view?')) {
				return new Response('video-bytes', { headers: { 'content-type': 'video/mp4' } });
			}
			if (url.endsWith('/upload/image')) {
				expect(init?.body).toBeInstanceOf(FormData);
				return Response.json({ name: 'start.png', subfolder: 'latent-line' });
			}
			if (url.endsWith('/queue') && init?.method === 'POST') return Response.json({});
			throw new Error(`Unexpected ComfyUI request: ${url}`);
		});

		const gateway = new RenderGateway({
			client: new ComfyClient({
				baseUrl: 'http://comfy.test',
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

	it('requires authentication and lists safe workflow metadata', async () => {
		expect((await fetch(`${baseUrl}/api/render/workflows`)).status).toBe(401);

		const response = await api('/api/render/workflows');
		expect(response.status).toBe(200);
		const workflows = (await response.json()) as Record<string, unknown>[];
		expect(workflows[0]).toMatchObject({ id: 'wan-test', version: '1.0.0' });
		expect(workflows[0]).not.toHaveProperty('workflowFile');
	});

	it('submits, persists and resolves a completed video job', async () => {
		const submitted = await api('/api/render/jobs', {
			method: 'POST',
			body: JSON.stringify({
				workflowId: 'wan-test',
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
			artifacts: [{ filename: 'clip.mp4', kind: 'video' }]
		});

		const artifact = await api(`/api/render/jobs/${queued.id}/artifacts/0`);
		expect(artifact.headers.get('content-type')).toBe('video/mp4');
		expect(await artifact.text()).toBe('video-bytes');

		const reloadedStore = new JobStore(path.join(directory, 'data', 'jobs.json'));
		await reloadedStore.load();
		expect(reloadedStore.get(queued.id)?.status).toBe('completed');
	});

	it('rejects raw or unknown workflow parameters', async () => {
		const response = await api('/api/render/jobs', {
			method: 'POST',
			body: JSON.stringify({
				workflowId: 'wan-test',
				inputs: { positive_prompt: 'Ocean at dusk', seed: 42, workflow: {} }
			})
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: expect.stringContaining('Unknown inputs')
		});
	});

	it('uploads a validated I2V source image without exposing ComfyUI', async () => {
		const response = await api('/api/render/uploads', {
			method: 'POST',
			body: JSON.stringify({
				filename: 'start.png',
				mimeType: 'image/png',
				base64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]).toString('base64')
			})
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ name: 'latent-line/start.png' });
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

async function installWorkflow(directory: string): Promise<void> {
	const workflows = path.join(directory, 'workflows');
	await import('node:fs/promises').then(({ mkdir }) => mkdir(workflows));
	await writeFile(
		path.join(workflows, 'wan-test.manifest.json'),
		JSON.stringify({
			id: 'wan-test',
			version: '1.0.0',
			label: 'Wan test',
			mode: 'text-to-video',
			workflowFile: 'wan-test.workflow.json',
			outputNodeIds: ['9'],
			inputs: {
				positive_prompt: { nodeId: '1', input: 'text', type: 'string', required: true },
				seed: { nodeId: '2', input: 'seed', type: 'integer', required: true, min: 0 }
			}
		})
	);
	await writeFile(
		path.join(workflows, 'wan-test.workflow.json'),
		JSON.stringify({
			'1': { class_type: 'CLIPTextEncode', inputs: { text: '' } },
			'2': { class_type: 'KSampler', inputs: { seed: 0 } }
		})
	);
}
