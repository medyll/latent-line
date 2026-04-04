/**
 * ComfyUI Workflow types for Latent-line
 */

/**
 * Workflow node types supported in ComfyUI
 */
export type WorkflowNodeType =
  | 'CheckpointLoaderSimple'
  | 'CLIPTextEncode'
  | 'VAEDecode'
  | 'VAEEncode'
  | 'EmptyLatentImage'
  | 'KSampler'
  | 'SaveImage'
  | 'LoadImage'
  | 'DeforumAnimation'
  | 'FramePackInterpolate'
  | 'AnimateDiffCombine'
  | 'CogVideoXSampler'
  | 'ConditioningCombine'
  | 'ControlNetApply';

/**
 * A single node in a ComfyUI workflow
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: [number, number];
  inputs: Record<string, unknown>;
  outputs: string[];
  title?: string;
}

/**
 * Connection between two workflow nodes
 */
export interface WorkflowLink {
  id: string;
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

/**
 * Mapping between timeline fields and workflow parameters
 */
export interface ParameterMapping {
  workflowParam: string;
  timelineField: string;
  transform?: (value: unknown) => unknown;
}

/**
 * Complete ComfyUI workflow definition
 */
export interface ComfyWorkflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  links: WorkflowLink[];
  parameters: ParameterMapping[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Workflow template for quick creation
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'animation' | 'interpolation' | 'generation';
  workflow: Omit<ComfyWorkflow, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * Render status
 */
export type RenderStatus = 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';

/**
 * Render job for a single timeline event
 */
export interface RenderJob {
  id: string;
  eventId: number;
  workflowId: string;
  status: RenderStatus;
  progress: number;
  eta?: number;
  outputPath?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Render queue state
 */
export interface RenderQueue {
  items: RenderJob[];
  status: 'idle' | 'rendering' | 'paused' | 'completed';
  currentItemId?: string;
  outputFolder: string;
}

/**
 * Progress update from ComfyUI
 */
export interface RenderProgress {
  sessionId: string;
  status: RenderStatus;
  currentStep: number;
  totalSteps: number;
  currentFrame?: number;
  totalFrames?: number;
  eta?: number;
  previewUrl?: string;
  logs: string[];
}
