import type { RenderArtifact, WorkerJobStatus } from './render-types';

export interface RenderWorkerClientOptions {
	baseUrl: string;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
}

/**
 * Talks to the local render worker (`server/render-worker`, a small Python
 * process running a Diffusers pipeline such as Wan 2.2 TI2V-5B) instead of a
 * ComfyUI instance. The worker keeps its own single-job queue since it owns
 * one GPU; the gateway just submits, polls and proxies artifacts.
 */
export class RenderWorkerClient {
	private readonly baseUrl: string;
	private readonly timeoutMs: number;
	private readonly fetchImpl: typeof fetch;

	constructor(options: RenderWorkerClientOptions) {
		const url = new URL(options.baseUrl);
		if (!['http:', 'https:'].includes(url.protocol)) {
			throw new Error('RENDER_WORKER_URL must use http or https');
		}
		this.baseUrl = url.toString().replace(/\/$/, '');
		this.timeoutMs = options.timeoutMs ?? 15_000;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	async health(): Promise<unknown> {
		return this.json('/health');
	}

	async submit(entrypoint: string, jobId: string, inputs: Record<string, unknown>): Promise<void> {
		await this.json('/jobs', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ model: entrypoint, jobId, inputs })
		});
	}

	async status(jobId: string): Promise<WorkerJobStatus | undefined> {
		const response = await this.request(`/jobs/${encodeURIComponent(jobId)}`);
		if (response.status === 404) return undefined;
		const body = await response.text();
		if (!response.ok) throw new Error(`Render worker ${response.status}: ${body.slice(0, 500)}`);
		return JSON.parse(body) as WorkerJobStatus;
	}

	async cancel(jobId: string): Promise<void> {
		await this.json(`/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' });
	}

	async uploadImage(filename: string, content: Uint8Array, mimeType: string): Promise<string> {
		const form = new FormData();
		const imageBuffer = new ArrayBuffer(content.byteLength);
		new Uint8Array(imageBuffer).set(content);
		form.append('file', new Blob([imageBuffer], { type: mimeType }), filename);
		const response = (await this.json('/uploads', { method: 'POST', body: form })) as {
			name?: unknown;
		};
		if (typeof response.name !== 'string') {
			throw new Error('Render worker did not return an uploaded image name');
		}
		return response.name;
	}

	async fetchArtifact(artifact: RenderArtifact): Promise<Response> {
		return this.request(`/artifacts/${encodeURIComponent(artifact.filename)}`);
	}

	private async json(pathname: string, init?: RequestInit): Promise<unknown> {
		const response = await this.request(pathname, init);
		const body = await response.text();
		if (!response.ok) throw new Error(`Render worker ${response.status}: ${body.slice(0, 500)}`);
		return body ? JSON.parse(body) : {};
	}

	private request(pathname: string, init?: RequestInit): Promise<Response> {
		return this.fetchImpl(`${this.baseUrl}${pathname}`, {
			...init,
			signal: AbortSignal.timeout(this.timeoutMs)
		});
	}
}
