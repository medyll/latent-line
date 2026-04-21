import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkModel, loadChunks } from './model-chunker';

describe('model-chunker', () => {
	describe('chunkModel', () => {
		it('should split events into chunks of specified size', () => {
			const model = {
				project: { name: 'Test Project' },
				assets: { characters: [] },
				events: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			};
			
			const chunked = chunkModel(model, 3);
			
			expect(chunked.totalChunks).toBe(4);
			expect(chunked.timelineChunks.length).toBe(4);
			expect(chunked.timelineChunks[0]).toEqual([1, 2, 3]);
			expect(chunked.timelineChunks[1]).toEqual([4, 5, 6]);
			expect(chunked.timelineChunks[2]).toEqual([7, 8, 9]);
			expect(chunked.timelineChunks[3]).toEqual([10]);
		});
		
		it('should handle empty events array', () => {
			const model = {
				project: { name: 'Empty Project' },
				events: []
			};
			
			const chunked = chunkModel(model, 10);
			
			expect(chunked.totalChunks).toBe(0);
			expect(chunked.timelineChunks.length).toBe(0);
			expect(chunked.loadedChunks).toBe(0);
		});
		
		it('should handle model without events property', () => {
			const model = {
				project: { name: 'No Events' },
				assets: { characters: [] }
			};
			
			const chunked = chunkModel(model as any, 10);
			
			expect(chunked.totalChunks).toBe(0);
			expect(chunked.project.name).toBe('No Events');
		});
		
		it('should use default chunk size of 100', () => {
			const model = {
				events: Array.from({ length: 250 }, (_, i) => i)
			};
			
			const chunked = chunkModel(model);
			
			expect(chunked.chunkSize).toBe(100);
			expect(chunked.totalChunks).toBe(3);
		});
		
		it('should exclude events from base model', () => {
			const model = {
				project: { name: 'Test' },
				events: [1, 2, 3]
			};
			
			const chunked = chunkModel(model, 10);
			
			expect(chunked).not.toHaveProperty('events');
			expect(chunked.project.name).toBe('Test');
		});
	});
	
	describe('loadChunks', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});
		
		it('should load all chunks and return flat events array', async () => {
			const model = {
				events: [1, 2, 3, 4, 5]
			};
			
			const chunked = chunkModel(model, 2);
			const events = await loadChunks(chunked);
			
			expect(events).toEqual([1, 2, 3, 4, 5]);
			expect(chunked.loadedChunks).toBe(3);
		});
		
		it('should call onChunkLoaded callback with progress', async () => {
			const model = {
				events: [1, 2, 3, 4, 5, 6]
			};
			
			const chunked = chunkModel(model, 2);
			const progressCallback = vi.fn();
			
			await loadChunks(chunked, progressCallback);
			
			expect(progressCallback).toHaveBeenCalledTimes(3);
			expect(progressCallback).toHaveBeenNthCalledWith(1, {
				chunkIndex: 0,
				totalChunks: 3,
				percent: 33,
				eventsLoaded: 2,
				totalEvents: 6
			});
		});
		
		it('should handle single chunk', async () => {
			const model = {
				events: [1, 2, 3]
			};
			
			const chunked = chunkModel(model, 10);
			const events = await loadChunks(chunked);
			
			expect(events).toEqual([1, 2, 3]);
			expect(chunked.totalChunks).toBe(1);
		});
		
		it('should handle large number of chunks', async () => {
			const model = {
				events: Array.from({ length: 1000 }, (_, i) => i)
			};
			
			const chunked = chunkModel(model, 50);
			const progressCallback = vi.fn();
			
			const events = await loadChunks(chunked, progressCallback);
			
			expect(events.length).toBe(1000);
			expect(chunked.totalChunks).toBe(20);
			expect(progressCallback).toHaveBeenCalledTimes(20);
			
			const lastCall = progressCallback.mock.calls[19][0];
			expect(lastCall.percent).toBe(100);
			expect(lastCall.eventsLoaded).toBe(1000);
		});
	});
});
