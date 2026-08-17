import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { ModelRegistry, RenderValidationError } from './model-registry';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true }))
	);
});

describe('ModelRegistry', () => {
	it('loads a versioned model and defaults/validates flat inputs', async () => {
		const directory = await modelDirectory();
		const registry = new ModelRegistry(directory);
		await registry.load();

		expect(registry.list()).toHaveLength(1);
		expect(registry.prepare('wan-test', { positive_prompt: 'A lighthouse', seed: 7 })).toEqual({
			positive_prompt: 'A lighthouse',
			seed: 7,
			width: 1280
		});
	});

	it('rejects unknown and out-of-range inputs', async () => {
		const directory = await modelDirectory();
		const registry = new ModelRegistry(directory);
		await registry.load();

		expect(() => registry.prepare('wan-test', { positive_prompt: 'x', width: 10 })).toThrow(
			'width must be >= 64'
		);
		expect(() =>
			registry.prepare('wan-test', { positive_prompt: 'x', raw_workflow: {} })
		).toThrow('Unknown inputs');
	});

	it('requires an entrypoint and rejects unsupported modes', async () => {
		const directory = await mkdtemp(path.join(tmpdir(), 'latent-line-models-'));
		temporaryDirectories.push(directory);
		await writeFile(
			path.join(directory, 'broken.manifest.json'),
			JSON.stringify({ id: 'broken', version: '1', label: 'Broken', mode: 'image', inputs: {} })
		);

		await expect(new ModelRegistry(directory).load()).rejects.toBeInstanceOf(
			RenderValidationError
		);
	});
});

async function modelDirectory(): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), 'latent-line-models-'));
	temporaryDirectories.push(directory);
	await writeFile(
		path.join(directory, 'wan-test.manifest.json'),
		JSON.stringify({
			id: 'wan-test',
			version: '1.0.0',
			label: 'Wan test',
			mode: 'text-to-video',
			entrypoint: 'wan2.2-ti2v-5b',
			inputs: {
				positive_prompt: { type: 'string', required: true },
				seed: { type: 'integer', required: false },
				width: { type: 'integer', required: false, default: 1280, min: 64, max: 1920 }
			}
		})
	);
	return directory;
}
