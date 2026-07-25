export type WorkflowInputType = 'string' | 'integer' | 'number' | 'boolean';

export interface WorkflowInputBinding {
	nodeId: string;
	input: string;
	type: WorkflowInputType;
	required?: boolean;
	default?: unknown;
	min?: number;
	max?: number;
}

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

export interface ComfyArtifact {
	filename: string;
	subfolder: string;
	type: string;
	nodeId: string;
	kind: 'image' | 'video' | 'audio' | 'file';
}

export type RenderJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

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

export interface ComfyHistoryEntry {
	status?: {
		status_str?: string;
		completed?: boolean;
		messages?: unknown[];
	};
	outputs?: Record<string, Record<string, unknown>>;
}
