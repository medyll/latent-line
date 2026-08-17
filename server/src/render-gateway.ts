import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { randomUUID } from 'node:crypto';
import { ModelRegistry, RenderValidationError } from './model-registry';
import { JobStore } from './job-store';
import type { RenderJob } from './render-types';
import { RenderWorkerClient } from './render-worker-client';

export interface RenderGatewayOptions {
	client: RenderWorkerClient;
	registry: ModelRegistry;
	store: JobStore;
	apiToken?: string;
	allowedOrigins: string[];
	maxActiveJobs: number;
	maxBodyBytes: number;
}

export class RenderGateway {
	constructor(private readonly options: RenderGatewayOptions) {}

	async handle(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
		const url = new URL(request.url ?? '/', 'http://localhost');
		if (!url.pathname.startsWith('/api/render')) return false;

		this.applyCors(request, response);
		if (request.method === 'OPTIONS') {
			response.writeHead(204).end();
			return true;
		}
		if (!this.isOriginAllowed(request)) {
			this.send(response, 403, { error: 'Origin not allowed' });
			return true;
		}
		if (!this.isAuthorized(request)) {
			this.send(response, 401, { error: 'Unauthorized' });
			return true;
		}

		try {
			if (request.method === 'GET' && url.pathname === '/api/render/health') {
				const worker = await this.options.client.health();
				this.send(response, 200, { status: 'ok', worker });
				return true;
			}
			if (request.method === 'GET' && url.pathname === '/api/render/models') {
				this.send(response, 200, this.options.registry.list());
				return true;
			}
			if (request.method === 'GET' && url.pathname === '/api/render/jobs') {
				this.send(response, 200, this.options.store.list());
				return true;
			}
			if (request.method === 'POST' && url.pathname === '/api/render/jobs') {
				await this.createJob(request, response);
				return true;
			}
			if (request.method === 'POST' && url.pathname === '/api/render/uploads') {
				await this.uploadImage(request, response);
				return true;
			}

			const jobMatch = url.pathname.match(/^\/api\/render\/jobs\/([^/]+)$/);
			if (jobMatch && request.method === 'GET') {
				await this.getJob(decodeURIComponent(jobMatch[1]), response);
				return true;
			}
			if (jobMatch && request.method === 'DELETE') {
				await this.cancelJob(decodeURIComponent(jobMatch[1]), response);
				return true;
			}

			const artifactMatch = url.pathname.match(/^\/api\/render\/jobs\/([^/]+)\/artifacts\/(\d+)$/);
			if (artifactMatch && request.method === 'GET') {
				await this.proxyArtifact(
					decodeURIComponent(artifactMatch[1]),
					Number(artifactMatch[2]),
					response
				);
				return true;
			}

			this.send(response, 404, { error: 'Render route not found' });
		} catch (error) {
			console.error('Render gateway request failed:', error);
			const status =
				error instanceof RenderValidationError || error instanceof SyntaxError ? 400 : 502;
			this.send(response, status, {
				error:
					status === 400 && error instanceof Error
						? error.message
						: 'Upstream render worker unavailable'
			});
		}
		return true;
	}

	private async createJob(request: IncomingMessage, response: ServerResponse): Promise<void> {
		const activeJobs = this.options.store
			.list()
			.filter((job) => job.status === 'queued' || job.status === 'running');
		await Promise.all(activeJobs.map((job) => this.refreshJob(job)));
		const activeCount = this.options.store
			.list()
			.filter((job) => job.status === 'queued' || job.status === 'running').length;
		if (activeCount >= this.options.maxActiveJobs) {
			this.send(response, 429, { error: 'Render queue is full' });
			return;
		}

		const body = (await readJsonBody(request, this.options.maxBodyBytes)) as {
			modelId?: unknown;
			inputs?: unknown;
		};
		if (typeof body.modelId !== 'string') {
			throw new RenderValidationError('modelId is required');
		}
		if (!body.inputs || typeof body.inputs !== 'object' || Array.isArray(body.inputs)) {
			throw new RenderValidationError('inputs must be an object');
		}

		const manifest = this.options.registry.get(body.modelId);
		if (!manifest) throw new RenderValidationError(`Unknown model: ${body.modelId}`);
		const inputs = body.inputs as Record<string, unknown>;
		const prepared = this.options.registry.prepare(body.modelId, inputs);
		const id = randomUUID();
		await this.options.client.submit(manifest.entrypoint, id, prepared);
		const now = new Date().toISOString();
		const job: RenderJob = {
			id,
			modelId: manifest.id,
			modelVersion: manifest.version,
			status: 'queued',
			progress: 0,
			createdAt: now,
			updatedAt: now,
			inputs: redactInputs(inputs),
			artifacts: []
		};
		await this.options.store.set(job);
		this.send(response, 202, job);
	}

	private async uploadImage(request: IncomingMessage, response: ServerResponse): Promise<void> {
		const body = (await readJsonBody(request, this.options.maxBodyBytes)) as {
			filename?: unknown;
			mimeType?: unknown;
			base64?: unknown;
		};
		if (
			typeof body.filename !== 'string' ||
			!SAFE_FILENAME.test(body.filename) ||
			typeof body.mimeType !== 'string' ||
			!ALLOWED_IMAGE_TYPES.has(body.mimeType) ||
			typeof body.base64 !== 'string'
		) {
			throw new RenderValidationError('Invalid image upload');
		}
		const content = Buffer.from(body.base64, 'base64');
		if (
			!body.base64.length ||
			body.base64.length % 4 !== 0 ||
			!BASE64_PATTERN.test(body.base64) ||
			!matchesImageSignature(content, body.mimeType)
		) {
			throw new RenderValidationError('Image content does not match its declared type');
		}
		const name = await this.options.client.uploadImage(body.filename, content, body.mimeType);
		this.send(response, 201, { name });
	}

	private async getJob(id: string, response: ServerResponse): Promise<void> {
		const job = this.options.store.get(id);
		if (!job) {
			this.send(response, 404, { error: 'Render job not found' });
			return;
		}
		if (job.status === 'queued' || job.status === 'running') {
			await this.refreshJob(job);
		}
		this.send(response, 200, job);
	}

	private async refreshJob(job: RenderJob): Promise<void> {
		const status = await this.options.client.status(job.id);
		if (!status) return;
		job.status = status.state;
		job.progress = status.progress;
		job.artifacts = status.artifacts;
		job.error = status.error;
		job.updatedAt = new Date().toISOString();
		await this.options.store.set(job);
	}

	private async cancelJob(id: string, response: ServerResponse): Promise<void> {
		const job = this.options.store.get(id);
		if (!job) {
			this.send(response, 404, { error: 'Render job not found' });
			return;
		}
		if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
			this.send(response, 409, { error: `Cannot cancel a ${job.status} job` });
			return;
		}
		await this.options.client.cancel(job.id);
		job.status = 'cancelled';
		job.updatedAt = new Date().toISOString();
		await this.options.store.set(job);
		this.send(response, 200, job);
	}

	private async proxyArtifact(
		jobId: string,
		artifactIndex: number,
		response: ServerResponse
	): Promise<void> {
		const job = this.options.store.get(jobId);
		const artifact = job?.artifacts[artifactIndex];
		if (!job || !artifact) {
			this.send(response, 404, { error: 'Artifact not found' });
			return;
		}
		const upstream = await this.options.client.fetchArtifact(artifact);
		if (!upstream.ok || !upstream.body) {
			throw new Error(`Render worker artifact request failed: ${upstream.status}`);
		}
		response.statusCode = upstream.status;
		for (const header of ['content-type', 'content-length', 'content-disposition']) {
			const value = upstream.headers.get(header);
			if (value) response.setHeader(header, value);
		}
		response.setHeader('cache-control', 'private, max-age=3600');
		Readable.fromWeb(upstream.body as unknown as ReadableStream).pipe(response);
	}

	private isAuthorized(request: IncomingMessage): boolean {
		const expected = this.options.apiToken;
		if (!expected) return true;
		const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
		const expectedBuffer = Buffer.from(expected);
		const suppliedBuffer = Buffer.from(supplied);
		return (
			expectedBuffer.length === suppliedBuffer.length &&
			timingSafeEqual(expectedBuffer, suppliedBuffer)
		);
	}

	private isOriginAllowed(request: IncomingMessage): boolean {
		const origin = request.headers.origin;
		return !origin || this.options.allowedOrigins.includes(origin);
	}

	private applyCors(request: IncomingMessage, response: ServerResponse): void {
		const origin = request.headers.origin;
		if (origin && this.options.allowedOrigins.includes(origin)) {
			response.setHeader('access-control-allow-origin', origin);
			response.setHeader('vary', 'origin');
			response.setHeader('access-control-allow-headers', 'authorization, content-type');
			response.setHeader('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS');
		}
	}

	private send(response: ServerResponse, status: number, body: unknown): void {
		response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
		response.end(JSON.stringify(body));
	}
}

const SAFE_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function matchesImageSignature(content: Buffer, mimeType: string): boolean {
	if (mimeType === 'image/png') {
		return content.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	}
	if (mimeType === 'image/jpeg') {
		return content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
	}
	return (
		content.subarray(0, 4).toString('ascii') === 'RIFF' &&
		content.subarray(8, 12).toString('ascii') === 'WEBP'
	);
}

async function readJsonBody(request: IncomingMessage, maxBytes: number): Promise<unknown> {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > maxBytes) throw new RenderValidationError('Request body is too large');
		chunks.push(buffer);
	}
	return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function redactInputs(inputs: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(inputs).map(([key, value]) => [
			key,
			/image|file|base64/i.test(key) ? '[redacted]' : value
		])
	);
}
