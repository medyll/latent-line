import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { ModelInputBinding, ModelManifest } from './render-types';

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;

/**
 * Registry of locally installed render models. Each model is described by a
 * single `*.manifest.json` file — there is no separate workflow graph file
 * to load or bind against (that concept belonged to ComfyUI, not to the
 * local worker). `prepare()` validates and defaults the caller-supplied
 * inputs and returns them as a flat object the render worker understands.
 */
export class ModelRegistry {
	private readonly models = new Map<string, ModelManifest>();

	constructor(private readonly directory: string) {}

	async load(): Promise<void> {
		this.models.clear();
		let files: string[];
		try {
			files = await readdir(this.directory);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw error;
		}

		for (const file of files.filter((name) => name.endsWith('.manifest.json')).sort()) {
			const manifestPath = path.join(this.directory, file);
			const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ModelManifest;
			this.validateManifest(manifest);
			this.models.set(manifest.id, manifest);
		}
	}

	list(): ModelManifest[] {
		return [...this.models.values()].map((manifest) => structuredClone(manifest));
	}

	get(id: string): ModelManifest | undefined {
		const found = this.models.get(id);
		return found ? structuredClone(found) : undefined;
	}

	prepare(id: string, rawInputs: Record<string, unknown>): Record<string, unknown> {
		const manifest = this.models.get(id);
		if (!manifest) throw new RenderValidationError(`Unknown model: ${id}`);

		const prepared: Record<string, unknown> = {};
		for (const [name, binding] of Object.entries(manifest.inputs)) {
			const supplied = rawInputs[name] ?? binding.default;
			if (supplied === undefined) {
				if (binding.required) throw new RenderValidationError(`Missing input: ${name}`);
				continue;
			}
			prepared[name] = validateInput(name, supplied, binding);
		}

		const unknown = Object.keys(rawInputs).filter((name) => !(name in manifest.inputs));
		if (unknown.length) throw new RenderValidationError(`Unknown inputs: ${unknown.join(', ')}`);
		return prepared;
	}

	private validateManifest(manifest: ModelManifest): void {
		if (!manifest || !ID_PATTERN.test(manifest.id)) {
			throw new RenderValidationError('Invalid model id');
		}
		if (!manifest.version || !manifest.label || !manifest.entrypoint) {
			throw new RenderValidationError(`Incomplete manifest: ${manifest.id}`);
		}
		if (!['text-to-video', 'image-to-video'].includes(manifest.mode)) {
			throw new RenderValidationError(`Invalid model mode: ${manifest.id}`);
		}
		if (!manifest.inputs || typeof manifest.inputs !== 'object') {
			throw new RenderValidationError(`Missing model inputs: ${manifest.id}`);
		}
	}
}

function validateInput(name: string, value: unknown, binding: ModelInputBinding): unknown {
	const valid =
		(binding.type === 'string' && typeof value === 'string') ||
		(binding.type === 'boolean' && typeof value === 'boolean') ||
		(binding.type === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
		(binding.type === 'integer' && typeof value === 'number' && Number.isInteger(value));
	if (!valid) throw new RenderValidationError(`Invalid ${binding.type} input: ${name}`);

	if (typeof value === 'number') {
		if (binding.min !== undefined && value < binding.min) {
			throw new RenderValidationError(`${name} must be >= ${binding.min}`);
		}
		if (binding.max !== undefined && value > binding.max) {
			throw new RenderValidationError(`${name} must be <= ${binding.max}`);
		}
	}
	if (typeof value === 'string' && value.length > 20_000) {
		throw new RenderValidationError(`${name} is too long`);
	}
	return value;
}

export class RenderValidationError extends Error {}
