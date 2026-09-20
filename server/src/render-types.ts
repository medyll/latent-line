/** Value kinds a workflow input can take. */
export type WorkflowInputType = 'string' | 'integer' | 'number' | 'boolean';

/** Binds one named workflow input to a field of a ComfyUI node, with the bounds
 *  and default to apply before submitting. */
export interface WorkflowInputBinding {
	nodeId: string;
	input: string;
	type: WorkflowInputType;
	required?: boolean;
	default?: unknown;
	min?: number;
	max?: number;
}

/** A render workflow: the ComfyUI graph file, the inputs it accepts, and the nodes
 *  whose outputs are collected as artifacts. */
export interface WorkflowManifest {
	id: string;
	version: string;
	label: string;
	description?: string;
	mode: 'text-to-video' | 'image-to-video' | 'image';
	workflowFile: string;
	inputs: Record<string, WorkflowInputBinding>;
	outputNodeIds?: string[];
}

/** One file produced by a render, as ComfyUI reports it. */
export interface ComfyArtifact {
	filename: string;
	subfolder: string;
	type: string;
	nodeId: string;
	kind: 'image' | 'video' | 'audio' | 'file';
}

/** Lifecycle state of a render job. */
export type RenderJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** A submitted render. `promptId` is ComfyUI's own id for it; `id` is ours. */
export interface RenderJob {
	id: string;
	promptId: string;
	workflowId: string;
	workflowVersion: string;
	status: RenderJobStatus;
	progress: number;
	createdAt: string;
	updatedAt: string;
	inputs: Record<string, unknown>;
	artifacts: ComfyArtifact[];
	error?: string;
}

/** The shape of one entry in ComfyUI's `/history` response, narrowed to what is read. */
export interface ComfyHistoryEntry {
	status?: {
		status_str?: string;
		completed?: boolean;
		messages?: unknown[];
	};
	outputs?: Record<string, Record<string, unknown>>;
}
