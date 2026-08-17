/**
 * render-client.ts
 *
 * Browser client for the Latent-line render gateway (`server/src/render-gateway.ts`).
 *
 * The browser never talks to the render worker directly: the gateway owns
 * auth, quotas, job persistence and artifact proxying. This client only
 * speaks the gateway's `/api/render` contract.
 *
 * See docs/RENDER_BACKEND_OPTIONS_2026.md for why the render target is a
 * local Diffusers worker rather than ComfyUI.
 */

export type RenderJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RenderArtifact {
	filename: string;
	kind: 'image' | 'video' | 'audio' | 'file';
}

export interface RenderJob {
	id: string;
	modelId: string;
	modelVersion: string;
	status: RenderJobStatus;
	progress: number;
	createdAt: string;
	updatedAt: string;
	inputs: Record<string, unknown>;
	artifacts: RenderArtifact[];
	error?: string;
}

export interface ModelInputBinding {
	type: 'string' | 'integer' | 'number' | 'boolean';
	required?: boolean;
	default?: unknown;
	min?: number;
	max?: number;
}

export interface ModelManifest {
	id: string;
	version: string;
	label: string;
	description?: string;
	mode: 'text-to-video' | 'image-to-video';
	entrypoint: string;
	vramMinGb?: number;
	inputs: Record<string, ModelInputBinding>;
}

export interface RenderClientOptions {
	baseUrl?: string;
	apiToken?: string;
	fetchImpl?: typeof fetch;
}

/** Thrown when the gateway rejects a request; `status` carries the HTTP code. */
export class RenderClientError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'RenderClientError';
	}
}

const TERMINAL_STATUSES: ReadonlySet<RenderJobStatus> = new Set([
	'completed',
	'failed',
	'cancelled'
]);

export function isTerminal(status: RenderJobStatus): boolean {
	return TERMINAL_STATUSES.has(status);
}

export class RenderClient {
	private readonly baseUrl: string;
	private readonly apiToken?: string;
	private readonly fetchImpl: typeof fetch;

	constructor(options: RenderClientOptions = {}) {
		this.baseUrl = (options.baseUrl ?? 'http://127.0.0.1:8080').replace(/\/$/, '');
		this.apiToken = options.apiToken;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	async health(): Promise<{ status: string; worker: unknown }> {
		return this.json('/api/render/health');
	}

	/** Models the server has actually installed — the only valid `modelId` values. */
	async listModels(): Promise<ModelManifest[]> {
		return this.json('/api/render/models');
	}

	async listJobs(): Promise<RenderJob[]> {
		return this.json('/api/render/jobs');
	}

	async submitJob(modelId: string, inputs: Record<string, unknown>): Promise<RenderJob> {
		return this.json('/api/render/jobs', {
			method: 'POST',
			body: JSON.stringify({ modelId, inputs })
		});
	}

	async getJob(id: string): Promise<RenderJob> {
		return this.json(`/api/render/jobs/${encodeURIComponent(id)}`);
	}

	async cancelJob(id: string): Promise<RenderJob> {
		return this.json(`/api/render/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	/** Uploads an image-to-video source frame and returns the worker-side name. */
	async uploadImage(file: File): Promise<string> {
		const base64 = await fileToBase64(file);
		const body = await this.json<{ name: string }>('/api/render/uploads', {
			method: 'POST',
			body: JSON.stringify({ filename: file.name, mimeType: file.type, base64 })
		});
		return body.name;
	}

	/**
	 * URL of a finished artifact. Only usable directly in `src`/`href` when the
	 * gateway runs without a token — otherwise fetch it through `fetchArtifact`.
	 */
	artifactUrl(jobId: string, index: number): string {
		return `${this.baseUrl}/api/render/jobs/${encodeURIComponent(jobId)}/artifacts/${index}`;
	}

	async fetchArtifact(jobId: string, index: number): Promise<Blob> {
		const response = await this.request(this.artifactUrl(jobId, index).slice(this.baseUrl.length));
		if (!response.ok) {
			throw new RenderClientError(`Artifact request failed`, response.status);
		}
		return response.blob();
	}

	/**
	 * Polls a job until it reaches a terminal state.
	 *
	 * The gateway refreshes job state from the worker on each GET, so polling
	 * here is what actually advances progress. Pass a `signal` to stop polling
	 * (this abandons the poll loop; it does not cancel the render — use
	 * `cancelJob` for that).
	 */
	async waitForJob(
		id: string,
		options: {
			intervalMs?: number;
			signal?: AbortSignal;
			onProgress?: (job: RenderJob) => void;
		} = {}
	): Promise<RenderJob> {
		const { intervalMs = 2000, signal, onProgress } = options;

		for (;;) {
			if (signal?.aborted) throw new DOMException('Polling aborted', 'AbortError');
			const job = await this.getJob(id);
			onProgress?.(job);
			if (isTerminal(job.status)) return job;
			await delay(intervalMs, signal);
		}
	}

	private async json<T>(pathname: string, init: RequestInit = {}): Promise<T> {
		const response = await this.request(pathname, init);
		const text = await response.text();
		if (!response.ok) {
			throw new RenderClientError(errorMessage(text, response.status), response.status);
		}
		return (text ? JSON.parse(text) : {}) as T;
	}

	private request(pathname: string, init: RequestInit = {}): Promise<Response> {
		const headers = new Headers(init.headers);
		headers.set('content-type', 'application/json');
		if (this.apiToken) headers.set('authorization', `Bearer ${this.apiToken}`);
		return this.fetchImpl(`${this.baseUrl}${pathname}`, { ...init, headers });
	}
}

function errorMessage(body: string, status: number): string {
	try {
		const parsed = JSON.parse(body) as { error?: unknown };
		if (typeof parsed.error === 'string') return parsed.error;
	} catch {
		// Non-JSON error body — fall through to the generic message.
	}
	return `Render gateway returned ${status}`;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException('Polling aborted', 'AbortError'));
		};
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result !== 'string') {
				reject(new Error('Unexpected FileReader result'));
				return;
			}
			resolve(result.slice(result.indexOf(',') + 1));
		};
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}
