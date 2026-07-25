import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { RenderValidationError, WorkflowRegistry } from './workflow-registry';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true }))
	);
});

describe('WorkflowRegistry', () => {
	it('loads a versioned workflow and injects validated logical inputs', async () => {
		const directory = await workflowDirectory();
		const registry = new WorkflowRegistry(directory);
		await registry.load();

		expect(registry.list()).toHaveLength(1);
		expect(registry.prepare('wan-test', { positive_prompt: 'A lighthouse', seed: 7 })).toEqual({
			'1': { class_type: 'CLIPTextEncode', inputs: { text: 'A lighthouse' } },
			'2': { class_type: 'KSampler', inputs: { seed: 7 } }
		});
	});

	it('rejects unknown and out-of-range inputs', async () => {
		const directory = await workflowDirectory();
		const registry = new WorkflowRegistry(directory);
		await registry.load();

		expect(() => registry.prepare('wan-test', { positive_prompt: 'x', seed: -1 })).toThrow(
			'seed must be >= 0'
		);
		expect(() =>
			registry.prepare('wan-test', { positive_prompt: 'x', seed: 1, raw_workflow: {} })
		).toThrow('Unknown inputs');
	});

	it('prevents manifests from reading workflows outside the registry', async () => {
		const directory = await mkdtemp(path.join(tmpdir(), 'latent-line-workflows-'));
		temporaryDirectories.push(directory);
		await writeFile(
			path.join(directory, 'escape.manifest.json'),
			JSON.stringify({
				id: 'escape',
				version: '1',
				label: 'Escape',
				mode: 'image',
				workflowFile: '../secret.json',
				inputs: {}
			})
		);

		await expect(new WorkflowRegistry(directory).load()).rejects.toBeInstanceOf(
			RenderValidationError
		);
	});
});

async function workflowDirectory(): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'latent-line-workflows-'));
	temporaryDirectories.push(directory);
	await writeFile(
		path.join(directory, 'wan-test.manifest.json'),
		JSON.stringify({
			id: 'wan-test',
			version: '1.0.0',
			label: 'Wan test',
			mode: 'text-to-video',
			workflowFile: 'wan-test.workflow.json',
			outputNodeIds: ['9'],
			inputs: {
				positive_prompt: {
					nodeId: '1',
					input: 'text',
					type: 'string',
					required: true
				},
				seed: {
					nodeId: '2',
					input: 'seed',
					type: 'integer',
					required: true,
					min: 0
				}
			}
		})
	);
	await writeFile(
		path.join(directory, 'wan-test.workflow.json'),
		JSON.stringify({
			'1': { class_type: 'CLIPTextEncode', inputs: { text: '' } },
			'2': { class_type: 'KSampler', inputs: { seed: 0 } }
		})
	);
	return directory;
}
