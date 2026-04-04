/**
 * ComfyUI Workflow Builder utilities
 */

import type {
  ComfyWorkflow,
  WorkflowNode,
  WorkflowLink,
  WorkflowNodeType,
  ParameterMapping
} from '$lib/types/comfy-workflow';

/**
 * Create a new empty workflow
 */
export function createWorkflow(name: string): ComfyWorkflow {
  const now = Date.now();
  return {
    id: `workflow_${now}`,
    name,
    nodes: [],
    links: [],
    parameters: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Create a workflow from a template
 */
export function createWorkflowFromTemplate(
  templateId: string,
  templates: Array<{ id: string; workflow: Omit<ComfyWorkflow, 'id' | 'createdAt' | 'updatedAt'> }>
): ComfyWorkflow {
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const now = Date.now();
  return {
    id: `workflow_${now}`,
    name: template.workflow.name,
    nodes: template.workflow.nodes,
    links: template.workflow.links,
    parameters: template.workflow.parameters,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Add a node to a workflow
 */
export function addNode(
  workflow: ComfyWorkflow,
  node: Omit<WorkflowNode, 'id'>,
  position?: [number, number]
): WorkflowNode {
  const newNode: WorkflowNode = {
    ...node,
    id: `${node.type}_${Date.now()}`,
    position: position ?? [0, 0]
  };

  workflow.nodes.push(newNode);
  workflow.updatedAt = Date.now();
  return newNode;
}

/**
 * Remove a node from a workflow
 */
export function removeNode(workflow: ComfyWorkflow, nodeId: string): void {
  workflow.nodes = workflow.nodes.filter((n) => n.id !== nodeId);
  workflow.links = workflow.links.filter(
    (l) => l.fromNode !== nodeId && l.toNode !== nodeId
  );
  workflow.updatedAt = Date.now();
}

/**
 * Add a link between two nodes
 */
export function addLink(
  workflow: ComfyWorkflow,
  fromNode: string,
  fromOutput: string,
  toNode: string,
  toInput: string
): WorkflowLink {
  const newLink: WorkflowLink = {
    id: `link_${Date.now()}`,
    fromNode,
    fromOutput,
    toNode,
    toInput
  };

  workflow.links.push(newLink);
  workflow.updatedAt = Date.now();
  return newLink;
}

/**
 * Remove a link from a workflow
 */
export function removeLink(workflow: ComfyWorkflow, linkId: string): void {
  workflow.links = workflow.links.filter((l) => l.id !== linkId);
  workflow.updatedAt = Date.now();
}

/**
 * Update a node's inputs
 */
export function updateNodeInputs(
  workflow: ComfyWorkflow,
  nodeId: string,
  inputs: Record<string, unknown>
): void {
  const node = workflow.nodes.find((n) => n.id === nodeId);
  if (node) {
    node.inputs = { ...node.inputs, ...inputs };
    workflow.updatedAt = Date.now();
  }
}

/**
 * Add a parameter mapping
 */
export function addParameterMapping(
  workflow: ComfyWorkflow,
  mapping: ParameterMapping
): void {
  workflow.parameters.push(mapping);
  workflow.updatedAt = Date.now();
}

/**
 * Remove a parameter mapping
 */
export function removeParameterMapping(workflow: ComfyWorkflow, index: number): void {
  workflow.parameters.splice(index, 1);
  workflow.updatedAt = Date.now();
}

/**
 * Serialize workflow to ComfyUI API format
 */
export function serializeToComfyApi(workflow: ComfyWorkflow): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const node of workflow.nodes) {
    result[node.id] = {
      class_type: node.type,
      inputs: node.inputs
    };
  }

  return result;
}

/**
 * Deserialize from ComfyUI API format
 */
export function deserializeFromComfyApi(
  data: Record<string, unknown>,
  name = 'Imported Workflow'
): ComfyWorkflow {
  const now = Date.now();
  const nodes: WorkflowNode[] = [];
  const links: WorkflowLink[] = [];

  for (const [nodeId, nodeData] of Object.entries(data)) {
    const data = nodeData as Record<string, unknown>;
    const inputs = (data.inputs as Record<string, unknown>) || {};

    // Extract links from inputs
    for (const [key, value] of Object.entries(inputs)) {
      if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'string') {
        links.push({
          id: `link_${nodeId}_${key}`,
          fromNode: value[0],
          fromOutput: key,
          toNode: nodeId,
          toInput: key
        });
      }
    }

    nodes.push({
      id: nodeId,
      type: data.class_type as WorkflowNodeType,
      position: [0, 0],
      inputs,
      outputs: [],
      title: data.title as string
    });
  }

  return {
    id: `workflow_${now}`,
    name,
    nodes,
    links,
    parameters: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Export workflow to JSON
 */
export function exportWorkflowToJson(workflow: ComfyWorkflow): string {
  return JSON.stringify(workflow, null, 2);
}

/**
 * Import workflow from JSON
 */
export function importWorkflowFromJson(json: string): ComfyWorkflow {
  const data = JSON.parse(json);
  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new Error('Invalid workflow JSON: missing nodes array');
  }
  return data as ComfyWorkflow;
}

/**
 * Get available input types for a node type
 */
export function getNodeInputTypes(nodeType: WorkflowNodeType): string[] {
  const inputMap: Record<WorkflowNodeType, string[]> = {
    CheckpointLoaderSimple: ['ckpt_name'],
    CLIPTextEncode: ['text', 'clip'],
    VAEDecode: ['samples', 'vae'],
    VAEEncode: ['pixels', 'vae'],
    EmptyLatentImage: ['width', 'height', 'batch_size'],
    KSampler: [
      'model', 'positive', 'negative', 'latent_image',
      'seed', 'steps', 'cfg', 'sampler_name', 'scheduler'
    ],
    SaveImage: ['images', 'filename_prefix'],
    LoadImage: ['image'],
    DeforumAnimation: ['model', 'positive', 'negative', 'latent_image'],
    FramePackInterpolate: ['model', 'positive', 'negative', 'latent_image'],
    AnimateDiffCombine: ['model', 'positive', 'negative', 'latent_image'],
    CogVideoXSampler: ['model', 'positive', 'negative', 'latent_image'],
    ConditioningCombine: ['conditioning_1', 'conditioning_2'],
    ControlNetApply: ['conditioning', 'control_net', 'image']
  };

  return inputMap[nodeType] || [];
}

/**
 * Get available output types for a node type
 */
export function getNodeOutputTypes(nodeType: WorkflowNodeType): string[] {
  const outputMap: Record<WorkflowNodeType, string[]> = {
    CheckpointLoaderSimple: ['MODEL', 'CLIP', 'VAE'],
    CLIPTextEncode: ['CONDITIONING'],
    VAEDecode: ['IMAGE'],
    VAEEncode: ['LATENT'],
    EmptyLatentImage: ['LATENT'],
    KSampler: ['LATENT'],
    SaveImage: [],
    LoadImage: ['IMAGE'],
    DeforumAnimation: ['LATENT'],
    FramePackInterpolate: ['LATENT'],
    AnimateDiffCombine: ['LATENT'],
    CogVideoXSampler: ['LATENT'],
    ConditioningCombine: ['CONDITIONING'],
    ControlNetApply: ['CONDITIONING']
  };

  return outputMap[nodeType] || [];
}
