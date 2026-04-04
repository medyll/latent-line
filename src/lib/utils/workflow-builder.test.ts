import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorkflow,
  createWorkflowFromTemplate,
  addNode,
  removeNode,
  addLink,
  removeLink,
  updateNodeInputs,
  addParameterMapping,
  removeParameterMapping,
  serializeToComfyApi,
  deserializeFromComfyApi,
  exportWorkflowToJson,
  importWorkflowFromJson,
  getNodeInputTypes,
  getNodeOutputTypes
} from '$lib/utils/workflow-builder';
import {
  getWorkflowTemplates,
  getWorkflowTemplateById,
  DEFORUM_TEMPLATE
} from '$lib/utils/workflow-templates';

describe('createWorkflow', () => {
  it('creates an empty workflow', () => {
    const workflow = createWorkflow('Test Workflow');
    expect(workflow.name).toBe('Test Workflow');
    expect(workflow.nodes).toHaveLength(0);
    expect(workflow.links).toHaveLength(0);
    expect(workflow.id).toMatch(/^workflow_\d+/);
  });
});

describe('createWorkflowFromTemplate', () => {
  it('creates workflow from template', () => {
    const templates = [DEFORUM_TEMPLATE];
    const workflow = createWorkflowFromTemplate('deforum_zoom_pan', templates);
    expect(workflow.name).toBe('Deforum Zoom/Pan');
    expect(workflow.nodes.length).toBeGreaterThan(0);
    expect(workflow.links.length).toBeGreaterThan(0);
  });

  it('throws on missing template', () => {
    expect(() => createWorkflowFromTemplate('nonexistent', [])).toThrow();
  });
});

describe('addNode', () => {
  it('adds a node to workflow', () => {
    const workflow = createWorkflow('Test');
    const node = addNode(workflow, {
      type: 'CheckpointLoaderSimple',
      position: [0, 0],
      inputs: { ckpt_name: 'model.safetensors' },
      outputs: ['MODEL', 'CLIP', 'VAE']
    });

    expect(workflow.nodes).toHaveLength(1);
    expect(node.id).toMatch(/^CheckpointLoaderSimple_\d+/);
  });

  it('uses provided position', () => {
    const workflow = createWorkflow('Test');
    const node = addNode(workflow, {
      type: 'CLIPTextEncode',
      position: [100, 200],
      inputs: {},
      outputs: []
    }, [300, 400]);

    expect(node.position).toEqual([300, 400]);
  });
});

describe('removeNode', () => {
  it('removes node and its links', () => {
    const workflow = createWorkflow('Test');
    const node1 = addNode(workflow, {
      type: 'CheckpointLoaderSimple',
      position: [0, 0],
      inputs: {},
      outputs: ['MODEL']
    });
    const node2 = addNode(workflow, {
      type: 'KSampler',
      position: [300, 0],
      inputs: {},
      outputs: ['LATENT']
    });

    addLink(workflow, node1.id, 'MODEL', node2.id, 'model');

    expect(workflow.nodes).toHaveLength(2);
    expect(workflow.links).toHaveLength(1);

    removeNode(workflow, node1.id);

    expect(workflow.nodes).toHaveLength(1);
    expect(workflow.links).toHaveLength(0);
  });
});

describe('addLink', () => {
  it('adds a link between nodes', () => {
    const workflow = createWorkflow('Test');
    const node1 = addNode(workflow, {
      type: 'CheckpointLoaderSimple',
      position: [0, 0],
      inputs: {},
      outputs: ['MODEL']
    });
    const node2 = addNode(workflow, {
      type: 'KSampler',
      position: [300, 0],
      inputs: {},
      outputs: []
    });

    const link = addLink(workflow, node1.id, 'MODEL', node2.id, 'model');

    expect(workflow.links).toHaveLength(1);
    expect(link.fromNode).toBe(node1.id);
    expect(link.toNode).toBe(node2.id);
  });
});

describe('removeLink', () => {
  it('removes a link', () => {
    const workflow = createWorkflow('Test');
    const node1 = addNode(workflow, {
      type: 'CheckpointLoaderSimple',
      position: [0, 0],
      inputs: {},
      outputs: ['MODEL']
    });
    const node2 = addNode(workflow, {
      type: 'KSampler',
      position: [300, 0],
      inputs: {},
      outputs: []
    });

    const link = addLink(workflow, node1.id, 'MODEL', node2.id, 'model');
    expect(workflow.links).toHaveLength(1);

    removeLink(workflow, link.id);
    expect(workflow.links).toHaveLength(0);
  });
});

describe('updateNodeInputs', () => {
  it('updates node inputs', () => {
    const workflow = createWorkflow('Test');
    const node = addNode(workflow, {
      type: 'KSampler',
      position: [0, 0],
      inputs: { seed: 42, steps: 20 },
      outputs: []
    });

    updateNodeInputs(workflow, node.id, { seed: 123, cfg: 7.5 });

    expect(node.inputs.seed).toBe(123);
    expect(node.inputs.steps).toBe(20); // Preserved
    expect(node.inputs.cfg).toBe(7.5); // Added
  });
});

describe('serializeToComfyApi', () => {
  it('serializes workflow to ComfyUI API format', () => {
    const workflow = createWorkflow('Test');
    addNode(workflow, {
      type: 'CheckpointLoaderSimple',
      position: [0, 0],
      inputs: { ckpt_name: 'model.safetensors' },
      outputs: ['MODEL']
    });

    const api = serializeToComfyApi(workflow);
    const keys = Object.keys(api);
    expect(keys).toHaveLength(1);
    expect(api[keys[0]]).toHaveProperty('class_type', 'CheckpointLoaderSimple');
  });
});

describe('exportWorkflowToJson', () => {
  it('exports workflow as JSON', () => {
    const workflow = createWorkflow('Test');
    const json = exportWorkflowToJson(workflow);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('Test');
  });
});

describe('importWorkflowFromJson', () => {
  it('imports workflow from JSON', () => {
    const workflow = createWorkflow('Test');
    const json = exportWorkflowToJson(workflow);
    const imported = importWorkflowFromJson(json);
    expect(imported.name).toBe('Test');
    expect(imported.nodes).toHaveLength(0);
  });

  it('throws on invalid JSON', () => {
    expect(() => importWorkflowFromJson('{"no": "nodes"}')).toThrow();
  });
});

describe('getNodeInputTypes', () => {
  it('returns inputs for known node types', () => {
    expect(getNodeInputTypes('CheckpointLoaderSimple')).toContain('ckpt_name');
    expect(getNodeInputTypes('KSampler')).toContain('seed');
    expect(getNodeInputTypes('CLIPTextEncode')).toContain('text');
  });

  it('returns empty array for unknown types', () => {
    expect(getNodeInputTypes('UnknownType' as any)).toHaveLength(0);
  });
});

describe('getNodeOutputTypes', () => {
  it('returns outputs for known node types', () => {
    expect(getNodeOutputTypes('CheckpointLoaderSimple')).toContain('MODEL');
    expect(getNodeOutputTypes('KSampler')).toContain('LATENT');
    expect(getNodeOutputTypes('CLIPTextEncode')).toContain('CONDITIONING');
  });

  it('returns empty array for unknown types', () => {
    expect(getNodeOutputTypes('UnknownType' as any)).toHaveLength(0);
  });
});

describe('getWorkflowTemplates', () => {
  it('returns all templates', () => {
    const templates = getWorkflowTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });
});

describe('getWorkflowTemplateById', () => {
  it('finds template by ID', () => {
    const template = getWorkflowTemplateById('deforum_zoom_pan');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Deforum Zoom/Pan');
  });

  it('returns undefined for missing ID', () => {
    const template = getWorkflowTemplateById('nonexistent');
    expect(template).toBeUndefined();
  });
});
