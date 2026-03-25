/**
 * ai-backend.ts
 *
 * Abstraction layer for AI image generation backends (ComfyUI, Automatic1111).
 * Handles API communication, polling for results, and error handling.
 *
 * Supports:
 * - ComfyUI (node-based workflow)
 * - Automatic1111 (txt2img API)
 *
 * Future: extend for other backends (Runway, Replicate, etc.)
 */

export interface AIBackendConfig {
	url: string; // Server URL (e.g. http://localhost:7860)
	api_key?: string; // Optional API key
	backend: 'comfyui' | 'a1111'; // Backend type
	timeout?: number; // Request timeout in ms (default: 60000)
}

export interface GenerationRequest {
	prompt: string;
	negative_prompt?: string;
	seed?: number;
	steps?: number;
	cfg_scale?: number;
	width?: number;
	height?: number;
	sampler?: string;
}

export interface GenerationResult {
	image_url: string;
	image_base64?: string;
	metadata: {
		seed: number;
		steps: number;
		cfg_scale: number;
	};
}

export interface GenerationProgress {
	status: 'idle' | 'queued' | 'generating' | 'done' | 'error';
	progress?: number; // 0-100
	eta?: number; // seconds
	error?: string;
}

/**
 * ComfyUI backend handler
 */
class ComfyUIBackend {
	private config: AIBackendConfig;
	private pollInterval = 1000; // ms

	constructor(config: AIBackendConfig) {
		this.config = config;
	}

	async generate(request: GenerationRequest): Promise<GenerationResult> {
		// TODO: Implement ComfyUI workflow generation
		// For now, return mock data for testing
		throw new Error('ComfyUI backend not yet implemented');
	}

	async checkProgress(job_id: string): Promise<GenerationProgress> {
		try {
			const response = await fetch(`${this.config.url}/api/progress`, {
				headers: this.config.api_key ? { Authorization: `Bearer ${this.config.api_key}` } : {}
			});

			if (!response.ok) {
				return { status: 'error', error: `HTTP ${response.status}` };
			}

			const data = await response.json();
			return {
				status: data.queue_remaining > 0 ? 'queued' : data.value?.max === 0 ? 'done' : 'generating',
				progress: data.value?.value ? (data.value.value / data.value.max) * 100 : undefined
			};
		} catch (err) {
			return { status: 'error', error: `${err}` };
		}
	}
}

/**
 * Automatic1111 (Stable Diffusion WebUI) backend handler
 */
class A1111Backend {
	private config: AIBackendConfig;

	constructor(config: AIBackendConfig) {
		this.config = config;
	}

	async generate(request: GenerationRequest): Promise<GenerationResult> {
		const body = {
			prompt: request.prompt,
			negative_prompt: request.negative_prompt || '',
			seed: request.seed ?? -1,
			steps: request.steps ?? 20,
			cfg_scale: request.cfg_scale ?? 7.5,
			width: request.width ?? 512,
			height: request.height ?? 512,
			sampler_name: request.sampler ?? 'Euler'
		};

		const response = await fetch(`${this.config.url}/api/txt2img`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(this.config.api_key && { Authorization: `Bearer ${this.config.api_key}` })
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(this.config.timeout ?? 60000)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`A1111 API error: ${response.status} - ${error}`);
		}

		const result = await response.json();

		return {
			image_base64: result.images?.[0],
			image_url: '', // Will be set by caller
			metadata: {
				seed: result.info?.seed ?? body.seed,
				steps: result.info?.steps ?? body.steps,
				cfg_scale: result.info?.cfg_scale ?? body.cfg_scale
			}
		};
	}

	async checkProgress(): Promise<GenerationProgress> {
		try {
			const response = await fetch(`${this.config.url}/api/progress`, {
				headers: this.config.api_key ? { Authorization: `Bearer ${this.config.api_key}` } : {}
			});

			if (!response.ok) {
				return { status: 'error', error: `HTTP ${response.status}` };
			}

			const data = await response.json();
			return {
				status: data.state?.job_count > 0 ? 'generating' : 'idle',
				progress: data.progress ? data.progress * 100 : undefined,
				eta: data.eta_relative
			};
		} catch (err) {
			return { status: 'error', error: `${err}` };
		}
	}
}

/**
 * Main AI Backend facade
 */
export class AIBackend {
	private config: AIBackendConfig;
	private backend: ComfyUIBackend | A1111Backend;

	constructor(config: AIBackendConfig) {
		this.config = config;

		if (config.backend === 'comfyui') {
			this.backend = new ComfyUIBackend(config);
		} else {
			this.backend = new A1111Backend(config);
		}
	}

	/** Test connection to AI backend */
	async testConnection(): Promise<{ ok: boolean; error?: string }> {
		try {
			const response = await fetch(`${this.config.url}`, {
				signal: AbortSignal.timeout(5000)
			});
			return { ok: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
		} catch (err) {
			return { ok: false, error: `${err}` };
		}
	}

	/** Generate image from prompt */
	async generate(request: GenerationRequest): Promise<GenerationResult> {
		return this.backend.generate(request);
	}

	/** Check generation progress */
	async checkProgress(job_id: string): Promise<GenerationProgress> {
		return this.backend.checkProgress(job_id);
	}

	/** Get current config */
	getConfig(): AIBackendConfig {
		return { ...this.config };
	}
}
