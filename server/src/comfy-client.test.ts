import { describe, expect, it, vi } from 'vitest';
import { ComfyClient, extractArtifacts } from './comfy-client';

describe('ComfyClient', () => {
	it('interrupts only when the requested prompt is currently running', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json({ queue_running: [[1, 'active-prompt']] }))
			.mockResolvedValueOnce(Response.json({}));
		const client = new ComfyClient({
			baseUrl: 'http://comfy.test',
			fetchImpl: fetchMock as typeof fetch
		});

		await client.cancel('active-prompt');

		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			'http://comfy.test/interrupt',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('deletes a queued prompt without interrupting another render', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json({ queue_running: [[1, 'another-prompt']] }))
			.mockResolvedValueOnce(Response.json({}));
		const client = new ComfyClient({
			baseUrl: 'http://comfy.test',
			fetchImpl: fetchMock as typeof fetch
		});

		await client.cancel('queued-prompt');

		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			'http://comfy.test/queue',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ delete: ['queued-prompt'] })
			})
		);
	});

	it('extracts only declared workflow output nodes', () => {
		expect(
			extractArtifacts(
				{
					outputs: {
						'8': { images: [{ filename: 'preview.png', type: 'temp' }] },
						'9': {
							gifs: [{ filename: 'final.mp4', subfolder: 'clips', type: 'output' }]
						}
					}
				},
				['9']
			)
		).toEqual([
			{
				filename: 'final.mp4',
				subfolder: 'clips',
				type: 'output',
				nodeId: '9',
				kind: 'video'
			}
		]);
	});
});
