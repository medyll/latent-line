/**
 * ComfyUI Workflow Templates
 *
 * Pre-built workflow templates for common AI generation tasks.
 */

import type { WorkflowTemplate, WorkflowNode, WorkflowLink } from '$lib/types/comfy-workflow';

/**
 * Create a unique node ID
 */
function nodeId(type: string, index: number): string {
  return `${type}_${index}`;
}

/**
 * Deforum Zoom/Pan Animation Template
 *
 * Creates smooth zoom and pan animations from text prompts.
 */
export const DEFORUM_TEMPLATE: WorkflowTemplate = {
  id: 'deforum_zoom_pan',
  name: 'Deforum Zoom/Pan',
  description: 'Create smooth zoom and pan animations from text prompts',
  category: 'animation',
  workflow: {
    name: 'Deforum Zoom/Pan',
    nodes: [
      {
        id: nodeId('checkpoint', 1),
        type: 'CheckpointLoaderSimple',
        position: [0, 0],
        inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' },
        outputs: ['MODEL', 'CLIP', 'VAE'],
        title: 'Load Checkpoint'
      },
      {
        id: nodeId('positive', 2),
        type: 'CLIPTextEncode',
        position: [300, -100],
        inputs: { text: '', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Positive Prompt'
      },
      {
        id: nodeId('negative', 3),
        type: 'CLIPTextEncode',
        position: [300, 100],
        inputs: { text: 'nsfw, lowres, bad anatomy', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Negative Prompt'
      },
      {
        id: nodeId('latent', 4),
        type: 'EmptyLatentImage',
        position: [300, 300],
        inputs: { width: 512, height: 512, batch_size: 1 },
        outputs: ['LATENT'],
        title: 'Empty Latent'
      },
      {
        id: nodeId('sampler', 5),
        type: 'KSampler',
        position: [600, 0],
        inputs: {
          model: ['MODEL'],
          positive: ['CONDITIONING'],
          negative: ['CONDITIONING'],
          latent_image: ['LATENT'],
          seed: 42,
          steps: 20,
          cfg: 7.0,
          sampler_name: 'euler',
          scheduler: 'normal'
        },
        outputs: ['LATENT'],
        title: 'KSampler'
      },
      {
        id: nodeId('decode', 6),
        type: 'VAEDecode',
        position: [900, 0],
        inputs: { samples: ['LATENT'], vae: ['VAE'] },
        outputs: ['IMAGE'],
        title: 'VAE Decode'
      },
      {
        id: nodeId('save', 7),
        type: 'SaveImage',
        position: [1200, 0],
        inputs: { images: ['IMAGE'], filename_prefix: 'deforum_' },
        outputs: [],
        title: 'Save Image'
      }
    ],
    links: [
      { id: 'link_1', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'MODEL', toNode: 'KSampler_5', toInput: 'model' },
      { id: 'link_2', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_2', toInput: 'clip' },
      { id: 'link_3', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_3', toInput: 'clip' },
      { id: 'link_4', fromNode: 'CLIPTextEncode_2', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'positive' },
      { id: 'link_5', fromNode: 'CLIPTextEncode_3', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'negative' },
      { id: 'link_6', fromNode: 'EmptyLatentImage_4', fromOutput: 'LATENT', toNode: 'KSampler_5', toInput: 'latent_image' },
      { id: 'link_7', fromNode: 'KSampler_5', fromOutput: 'LATENT', toNode: 'VAEDecode_6', toInput: 'samples' },
      { id: 'link_8', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'VAE', toNode: 'VAEDecode_6', toInput: 'vae' },
      { id: 'link_9', fromNode: 'VAEDecode_6', fromOutput: 'IMAGE', toNode: 'SaveImage_7', toInput: 'images' }
    ],
    parameters: [
      { workflowParam: 'CLIPTextEncode_2.inputs.text', timelineField: 'frame.prompt' },
      { workflowParam: 'KSampler_5.inputs.seed', timelineField: 'config.seed' },
      { workflowParam: 'KSampler_5.inputs.steps', timelineField: 'config.steps' },
      { workflowParam: 'EmptyLatentImage_4.inputs.width', timelineField: 'project.resolution.w' },
      { workflowParam: 'EmptyLatentImage_4.inputs.height', timelineField: 'project.resolution.h' }
    ]
  }
};

/**
 * FramePack Interpolation Template
 *
 * Smooth frame interpolation for video generation.
 */
export const FRAMEPACK_TEMPLATE: WorkflowTemplate = {
  id: 'framepack_interpolate',
  name: 'FramePack Interpolation',
  description: 'Smooth frame interpolation for video generation',
  category: 'interpolation',
  workflow: {
    name: 'FramePack Interpolation',
    nodes: [
      {
        id: nodeId('checkpoint', 1),
        type: 'CheckpointLoaderSimple',
        position: [0, 0],
        inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' },
        outputs: ['MODEL', 'CLIP', 'VAE'],
        title: 'Load Checkpoint'
      },
      {
        id: nodeId('positive', 2),
        type: 'CLIPTextEncode',
        position: [300, -100],
        inputs: { text: '', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Positive Prompt'
      },
      {
        id: nodeId('negative', 3),
        type: 'CLIPTextEncode',
        position: [300, 100],
        inputs: { text: 'nsfw, blurry', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Negative Prompt'
      },
      {
        id: nodeId('latent', 4),
        type: 'EmptyLatentImage',
        position: [300, 300],
        inputs: { width: 512, height: 512, batch_size: 1 },
        outputs: ['LATENT'],
        title: 'Empty Latent'
      },
      {
        id: nodeId('sampler', 5),
        type: 'KSampler',
        position: [600, 0],
        inputs: {
          model: ['MODEL'],
          positive: ['CONDITIONING'],
          negative: ['CONDITIONING'],
          latent_image: ['LATENT'],
          seed: 42,
          steps: 25,
          cfg: 7.5,
          sampler_name: 'dpmpp_2m',
          scheduler: 'karras'
        },
        outputs: ['LATENT'],
        title: 'KSampler'
      },
      {
        id: nodeId('decode', 6),
        type: 'VAEDecode',
        position: [900, 0],
        inputs: { samples: ['LATENT'], vae: ['VAE'] },
        outputs: ['IMAGE'],
        title: 'VAE Decode'
      },
      {
        id: nodeId('save', 7),
        type: 'SaveImage',
        position: [1200, 0],
        inputs: { images: ['IMAGE'], filename_prefix: 'framepack_' },
        outputs: [],
        title: 'Save Image'
      }
    ],
    links: [
      { id: 'link_1', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'MODEL', toNode: 'KSampler_5', toInput: 'model' },
      { id: 'link_2', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_2', toInput: 'clip' },
      { id: 'link_3', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_3', toInput: 'clip' },
      { id: 'link_4', fromNode: 'CLIPTextEncode_2', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'positive' },
      { id: 'link_5', fromNode: 'CLIPTextEncode_3', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'negative' },
      { id: 'link_6', fromNode: 'EmptyLatentImage_4', fromOutput: 'LATENT', toNode: 'KSampler_5', toInput: 'latent_image' },
      { id: 'link_7', fromNode: 'KSampler_5', fromOutput: 'LATENT', toNode: 'VAEDecode_6', toInput: 'samples' },
      { id: 'link_8', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'VAE', toNode: 'VAEDecode_6', toInput: 'vae' },
      { id: 'link_9', fromNode: 'VAEDecode_6', fromOutput: 'IMAGE', toNode: 'SaveImage_7', toInput: 'images' }
    ],
    parameters: [
      { workflowParam: 'CLIPTextEncode_2.inputs.text', timelineField: 'frame.prompt' },
      { workflowParam: 'KSampler_5.inputs.seed', timelineField: 'config.seed' },
      { workflowParam: 'EmptyLatentImage_4.inputs.width', timelineField: 'project.resolution.w' },
      { workflowParam: 'EmptyLatentImage_4.inputs.height', timelineField: 'project.resolution.h' }
    ]
  }
};

/**
 * AnimateDiff Template
 *
 * Text-to-video generation using AnimateDiff.
 */
export const ANIMATEDIFF_TEMPLATE: WorkflowTemplate = {
  id: 'animatediff_generation',
  name: 'AnimateDiff',
  description: 'Text-to-video generation using AnimateDiff motion module',
  category: 'generation',
  workflow: {
    name: 'AnimateDiff',
    nodes: [
      {
        id: nodeId('checkpoint', 1),
        type: 'CheckpointLoaderSimple',
        position: [0, 0],
        inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' },
        outputs: ['MODEL', 'CLIP', 'VAE'],
        title: 'Load Checkpoint'
      },
      {
        id: nodeId('positive', 2),
        type: 'CLIPTextEncode',
        position: [300, -100],
        inputs: { text: '', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Positive Prompt'
      },
      {
        id: nodeId('negative', 3),
        type: 'CLIPTextEncode',
        position: [300, 100],
        inputs: { text: 'nsfw, lowres', clip: ['CLIP'] },
        outputs: ['CONDITIONING'],
        title: 'Negative Prompt'
      },
      {
        id: nodeId('latent', 4),
        type: 'EmptyLatentImage',
        position: [300, 300],
        inputs: { width: 512, height: 512, batch_size: 16 },
        outputs: ['LATENT'],
        title: 'Empty Latent (16 frames)'
      },
      {
        id: nodeId('sampler', 5),
        type: 'KSampler',
        position: [600, 0],
        inputs: {
          model: ['MODEL'],
          positive: ['CONDITIONING'],
          negative: ['CONDITIONING'],
          latent_image: ['LATENT'],
          seed: 42,
          steps: 20,
          cfg: 7.0,
          sampler_name: 'euler_ancestral',
          scheduler: 'normal'
        },
        outputs: ['LATENT'],
        title: 'KSampler'
      },
      {
        id: nodeId('decode', 6),
        type: 'VAEDecode',
        position: [900, 0],
        inputs: { samples: ['LATENT'], vae: ['VAE'] },
        outputs: ['IMAGE'],
        title: 'VAE Decode'
      },
      {
        id: nodeId('save', 7),
        type: 'SaveImage',
        position: [1200, 0],
        inputs: { images: ['IMAGE'], filename_prefix: 'animatediff_' },
        outputs: [],
        title: 'Save Image'
      }
    ],
    links: [
      { id: 'link_1', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'MODEL', toNode: 'KSampler_5', toInput: 'model' },
      { id: 'link_2', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_2', toInput: 'clip' },
      { id: 'link_3', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'CLIP', toNode: 'CLIPTextEncode_3', toInput: 'clip' },
      { id: 'link_4', fromNode: 'CLIPTextEncode_2', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'positive' },
      { id: 'link_5', fromNode: 'CLIPTextEncode_3', fromOutput: 'CONDITIONING', toNode: 'KSampler_5', toInput: 'negative' },
      { id: 'link_6', fromNode: 'EmptyLatentImage_4', fromOutput: 'LATENT', toNode: 'KSampler_5', toInput: 'latent_image' },
      { id: 'link_7', fromNode: 'KSampler_5', fromOutput: 'LATENT', toNode: 'VAEDecode_6', toInput: 'samples' },
      { id: 'link_8', fromNode: 'CheckpointLoaderSimple_1', fromOutput: 'VAE', toNode: 'VAEDecode_6', toInput: 'vae' },
      { id: 'link_9', fromNode: 'VAEDecode_6', fromOutput: 'IMAGE', toNode: 'SaveImage_7', toInput: 'images' }
    ],
    parameters: [
      { workflowParam: 'CLIPTextEncode_2.inputs.text', timelineField: 'frame.prompt' },
      { workflowParam: 'KSampler_5.inputs.seed', timelineField: 'config.seed' },
      { workflowParam: 'EmptyLatentImage_4.inputs.batch_size', timelineField: 'frame.batch_size' }
    ]
  }
};

/**
 * Get all available workflow templates
 */
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return [DEFORUM_TEMPLATE, FRAMEPACK_TEMPLATE, ANIMATEDIFF_TEMPLATE];
}

/**
 * Get a template by ID
 */
export function getWorkflowTemplateById(id: string): WorkflowTemplate | undefined {
  return getWorkflowTemplates().find((t) => t.id === id);
}
