import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { WorkflowInputBinding, WorkflowManifest } from './render-types';

type WorkflowGraph = Record<string, { inputs?: Record<string, unknown>; class_type?: string }>;

/** A loaded workflow: its manifest, and the ComfyUI graph the manifest points at. */
export interface RegisteredWorkflow {
	manifest: WorkflowManifest;
	workflow: WorkflowGraph;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;

/**
 * Loads the `*.manifest.json` workflows from a directory and validates render
 * inputs against the bindings they declare.
 *
 * A missing directory yields an empty registry rather than an error.
 */
export class WorkflowRegistry {
	private readonly workflows = new Map<string, RegisteredWorkflow>();

	constructor(private readonly directory: string) {}

	async load(): Promise<void> {
		this.workflows.clear();
		let files: string[];
		try {
			files = await readdir(this.directory);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw error;
		}

		for (const file of files.filter((name) => name.endsWith('.manifest.json')).sort()) {
			const manifestPath = path.join(this.directory, file);
			const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as WorkflowManifest;
			this.validateManifest(manifest);

			const workflowPath = this.resolveContained(manifest.workflowFile);
			const workflow = JSON.parse(await readFile(workflowPath, 'utf8')) as WorkflowGraph;
			this.validateWorkflow(manifest, workflow);
			this.workflows.set(manifest.id, { manifest, workflow });
		}
	}

	list(): WorkflowManifest[] {
		return [...this.workflows.values()].map(({ manifest }) => structuredClone(manifest));
	}

	get(id: string): RegisteredWorkflow | undefined {
		const found = this.workflows.get(id);
		return found ? structuredClone(found) : undefined;
	}

	prepare(id: string, rawInputs: Record<string, unknown>): WorkflowGraph {
		const registered = this.workflows.get(id);
		if (!registered) throw new RenderValidationError(`Unknown workflow: ${id}`);

		const workflow = structuredClone(registered.workflow);
		for (const [name, binding] of Object.entries(registered.manifest.inputs)) {
			const supplied = rawInputs[name] ?? binding.default;
			if (supplied === undefined) {
				if (binding.required) throw new RenderValidationError(`Missing input: ${name}`);
				continue;
			}

			const value = validateInput(name, supplied, binding);
			const node = workflow[binding.nodeId];
			if (!node?.inputs) {
				throw new RenderValidationError(`Workflow node ${binding.nodeId} has no inputs`);
			}
			node.inputs[binding.input] = value;
		}

		const unknown = Object.keys(rawInputs).filter((name) => !(name in registered.manifest.inputs));
		if (unknown.length) throw new RenderValidationError(`Unknown inputs: ${unknown.join(', ')}`);
		return workflow;
	}

	private resolveContained(relativeFile: string): string {
		if (path.isAbsolute(relativeFile)) {
			throw new RenderValidationError('workflowFile must be relative');
		}
		const root = path.resolve(this.directory);
		const resolved = path.resolve(root, relativeFile);
		if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
			throw new RenderValidationError('workflowFile escapes the workflow directory');
		}
		return resolved;
	}

	private validateManifest(manifest: WorkflowManifest): void {
		if (!manifest || !ID_PATTERN.test(manifest.id)) {
			throw new RenderValidationError('Invalid workflow id');
		}
		if (!manifest.version || !manifest.label || !manifest.workflowFile) {
			throw new RenderValidationError(`Incomplete manifest: ${manifest.id}`);
		}
		if (!['text-to-video', 'image-to-video', 'image'].includes(manifest.mode)) {
			throw new RenderValidationError(`Invalid workflow mode: ${manifest.id}`);
		}
		if (!manifest.inputs || typeof manifest.inputs !== 'object') {
			throw new RenderValidationError(`Missing workflow inputs: ${manifest.id}`);
		}
	}

	private validateWorkflow(manifest: WorkflowManifest, workflow: WorkflowGraph): void {
		if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
			throw new RenderValidationError(`Invalid workflow graph: ${manifest.id}`);
		}
		for (const [name, binding] of Object.entries(manifest.inputs)) {
			if (!workflow[binding.nodeId]?.inputs) {
				throw new RenderValidationError(`Input ${name} points to missing node ${binding.nodeId}`);
			}
		}
	}
}

function validateInput(name: string, value: unknown, binding: WorkflowInputBinding): unknown {
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

/** Thrown when render inputs do not satisfy the workflow's declared bindings. */
export class RenderValidationError extends Error {}
