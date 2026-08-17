export type ModelInputType = 'string' | 'integer' | 'number' | 'boolean';

export interface ModelInputBinding {
	type: ModelInputType;
	required?: boolean;
	default?: unknown;
	min?: number;
	max?: number;
}

/**
 * Describes one locally installed generative model that the render worker
 * can run. Unlike a ComfyUI workflow manifest, there is no node graph to
 * bind against: the worker takes the validated flat `inputs` object as-is
 * and passes it straight to the model's own pipeline.
 */
export interface ModelManifest {
	id: string;
	version: string;
	label: string;
	description?: string;
	mode: 'text-to-video' | 'image-to-video';
	/** Model identifier the render worker knows how to load (e.g. a HF repo id or an internal key). */
	entrypoint: string;
	vramMinGb?: number;
	inputs: Record<string, ModelInputBinding>;
}

export interface RenderArtifact {
	filename: string;
	kind: 'image' | 'video' | 'audio' | 'file';
}

export type RenderJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

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

/** Status payload returned by the local render worker for a given job id. */
export interface WorkerJobStatus {
	state: RenderJobStatus;
	progress: number;
	artifacts: RenderArtifact[];
	error?: string;
}
