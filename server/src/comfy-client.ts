import type { ComfyArtifact, ComfyHistoryEntry } from './render-types';

/** Where ComfyUI is, how long to wait on it, and which fetch to use (injectable for tests). */
export interface ComfyClientOptions {
	baseUrl: string;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
}

/** HTTP client for one ComfyUI instance. The constructor rejects a `baseUrl` that
 *  is not http or https. */
export class ComfyClient {
	private readonly baseUrl: string;
	private readonly timeoutMs: number;
	private readonly fetchImpl: typeof fetch;

	constructor(options: ComfyClientOptions) {
		const url = new URL(options.baseUrl);
		if (!['http:', 'https:'].includes(url.protocol)) {
			throw new Error('COMFYUI_URL must use http or https');
		}
		this.baseUrl = url.toString().replace(/\/$/, '');
		this.timeoutMs = options.timeoutMs ?? 15_000;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	async health(): Promise<unknown> {
		return this.json('/system_stats');
	}

	async submit(prompt: Record<string, unknown>, clientId: string): Promise<string> {
		const response = (await this.json('/prompt', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ prompt, client_id: clientId })
		})) as { prompt_id?: unknown; error?: unknown; node_errors?: unknown };
		if (typeof response.prompt_id !== 'string') {
			throw new Error(`ComfyUI rejected prompt: ${JSON.stringify(response.error ?? response)}`);
		}
		return response.prompt_id;
	}

	async history(promptId: string): Promise<ComfyHistoryEntry | undefined> {
		const history = (await this.json(`/history/${encodeURIComponent(promptId)}`)) as Record<
			string,
			ComfyHistoryEntry
		>;
		return history[promptId];
	}

	async queue(): Promise<unknown> {
		return this.json('/queue');
	}

	async cancel(promptId: string): Promise<void> {
		const queue = (await this.queue()) as {
			queue_running?: unknown[];
			queue_pending?: unknown[];
		};
		if (queueContains(queue.queue_running, promptId)) {
			await this.json('/interrupt', { method: 'POST' });
		} else {
			await this.json('/queue', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ delete: [promptId] })
			});
		}
	}

	async uploadImage(filename: string, content: Uint8Array, mimeType: string): Promise<string> {
		const form = new FormData();
		const imageBuffer = new ArrayBuffer(content.byteLength);
		new Uint8Array(imageBuffer).set(content);
		form.append('image', new Blob([imageBuffer], { type: mimeType }), filename);
		form.append('type', 'input');
		form.append('overwrite', 'false');
		const response = (await this.json('/upload/image', {
			method: 'POST',
			body: form
		})) as { name?: unknown; subfolder?: unknown };
		if (typeof response.name !== 'string') {
			throw new Error('ComfyUI did not return an uploaded image name');
		}
		const subfolder = typeof response.subfolder === 'string' ? response.subfolder : '';
		return subfolder ? `${subfolder}/${response.name}` : response.name;
	}

	async fetchArtifact(artifact: ComfyArtifact): Promise<Response> {
		const query = new URLSearchParams({
			filename: artifact.filename,
			subfolder: artifact.subfolder,
			type: artifact.type
		});
		return this.request(`/view?${query.toString()}`);
	}

	private async json(pathname: string, init?: RequestInit): Promise<unknown> {
		const response = await this.request(pathname, init);
		const body = await response.text();
		if (!response.ok) throw new Error(`ComfyUI ${response.status}: ${body.slice(0, 500)}`);
		return body ? JSON.parse(body) : {};
	}

	private request(pathname: string, init?: RequestInit): Promise<Response> {
		return this.fetchImpl(`${this.baseUrl}${pathname}`, {
			...init,
			signal: AbortSignal.timeout(this.timeoutMs)
		});
	}
}

/** Whether ComfyUI's queue listing still holds this prompt id. */
export function queueContains(entries: unknown[] | undefined, promptId: string): boolean {
	return Boolean(
		entries?.some((entry) => Array.isArray(entry) && entry.some((value) => value === promptId))
	);
}

/**
 * Collects the output files out of one ComfyUI history entry.
 *
 * Restricted to `outputNodeIds` when given; entries without a filename are
 * skipped, so a malformed output is dropped rather than throwing.
 */
export function extractArtifacts(
	entry: ComfyHistoryEntry,
	outputNodeIds?: string[]
): ComfyArtifact[] {
	const artifacts: ComfyArtifact[] = [];
	for (const [nodeId, output] of Object.entries(entry.outputs ?? {})) {
		if (outputNodeIds?.length && !outputNodeIds.includes(nodeId)) continue;
		for (const [key, rawItems] of Object.entries(output)) {
			if (!Array.isArray(rawItems)) continue;
			for (const rawItem of rawItems) {
				if (!rawItem || typeof rawItem !== 'object') continue;
				const item = rawItem as Record<string, unknown>;
				if (typeof item.filename !== 'string') continue;
				artifacts.push({
					filename: item.filename,
					subfolder: typeof item.subfolder === 'string' ? item.subfolder : '',
					type: typeof item.type === 'string' ? item.type : 'output',
					nodeId,
					kind: artifactKind(key, item.filename)
				});
			}
		}
	}
	return artifacts;
}

function artifactKind(key: string, filename: string): ComfyArtifact['kind'] {
	if (/video|gifs?/i.test(key) || /\.(mp4|webm|mov|mkv|gif)$/i.test(filename)) return 'video';
	if (/audio/i.test(key) || /\.(wav|mp3|ogg|flac)$/i.test(filename)) return 'audio';
	if (/images?/i.test(key) || /\.(png|jpe?g|webp)$/i.test(filename)) return 'image';
	return 'file';
}
