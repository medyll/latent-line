/**
 * Model Chunking Utility
 * 
 * Enables progressive loading of large timeline models by splitting
 * events into chunks and loading them with requestIdleCallback.
 * 
 * @module model-chunker
 */

/**
 * Polyfill for requestIdleCallback (must be before any usage)
 */
if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'undefined') {
	(window as any).requestIdleCallback = (
		callback: (deadline: { timeRemaining: () => number }) => void,
		options?: { timeout?: number }
	) => {
		const start = Date.now();
		return setTimeout(() => {
			callback({
				timeRemaining: () => Math.max(0, options?.timeout || 50 - (Date.now() - start))
			});
		}, 1);
	};
	
	(window as any).cancelIdleCallback = (handle: number) => {
		clearTimeout(handle);
	};
}

export interface ChunkedModel {
	project: any;
	assets: any;
	timelineChunks: any[][];
	totalChunks: number;
	loadedChunks: number;
	chunkSize: number;
}

export interface LoadProgress {
	chunkIndex: number;
	totalChunks: number;
	percent: number;
	eventsLoaded: number;
	totalEvents: number;
}

/**
 * Splits a large model into manageable chunks for progressive loading
 */
export function chunkModel(model: { events?: any[]; [key: string]: any }, chunkSize: number = 100): ChunkedModel {
	const events = model.events || [];
	const totalEvents = events.length;
	const totalChunks = Math.ceil(totalEvents / chunkSize);
	
	const timelineChunks: any[][] = [];
	
	// Split events into chunks
	for (let i = 0; i < totalEvents; i += chunkSize) {
		const chunk = events.slice(i, i + chunkSize);
		timelineChunks.push(chunk);
	}
	
	// Create chunked model without events (they're in chunks)
	const { events: _, ...modelWithoutEvents } = model;
	
	return {
		...modelWithoutEvents,
		project: model.project || {},
		assets: model.assets || {},
		timelineChunks,
		totalChunks,
		loadedChunks: 0,
		chunkSize
	};
}

/**
 * Loads chunks progressively using requestIdleCallback
 * to avoid blocking the main thread
 */
export async function loadChunks(
	chunkedModel: ChunkedModel,
	onChunkLoaded?: (progress: LoadProgress) => void
): Promise<any[]> {
	const allEvents: any[][] = new Array(chunkedModel.totalChunks);
	
	return new Promise((resolve) => {
		let currentChunk = 0;
		
		function loadNextChunk() {
			if (currentChunk >= chunkedModel.totalChunks) {
				// All chunks loaded
				resolve(allEvents.flat());
				return;
			}
			
		// Check if requestIdleCallback is available
		if (typeof requestIdleCallback !== 'undefined') {
			// Use requestIdleCallback to load chunk when browser is idle
			requestIdleCallback(
				(deadline) => {
					while (deadline.timeRemaining() > 0 && currentChunk < chunkedModel.totalChunks) {
						// Load chunk synchronously
						const chunkIndex = currentChunk;
						allEvents[chunkIndex] = chunkedModel.timelineChunks[chunkIndex];
						chunkedModel.loadedChunks++;
						
						// Notify progress
						if (onChunkLoaded) {
							const progress: LoadProgress = {
								chunkIndex: chunkIndex,
								totalChunks: chunkedModel.totalChunks,
								percent: Math.round(((chunkIndex + 1) / chunkedModel.totalChunks) * 100),
								eventsLoaded: (chunkIndex + 1) * chunkedModel.chunkSize,
								totalEvents: chunkedModel.totalChunks * chunkedModel.chunkSize
							};
							onChunkLoaded(progress);
						}
						
						currentChunk++;
					}
					
					// Schedule next batch if chunks remain
					if (currentChunk < chunkedModel.totalChunks) {
						loadNextChunk();
					} else {
						resolve(allEvents.flat());
					}
				},
				{ timeout: 1000 } // Force execution within 1 second
			);
		} else {
			// Fallback for Node.js/test environments without requestIdleCallback
			setTimeout(() => {
				const chunkIndex = currentChunk;
				allEvents[chunkIndex] = chunkedModel.timelineChunks[chunkIndex];
				chunkedModel.loadedChunks++;
				
				if (onChunkLoaded) {
					const progress: LoadProgress = {
						chunkIndex: chunkIndex,
						totalChunks: chunkedModel.totalChunks,
						percent: Math.round(((chunkIndex + 1) / chunkedModel.totalChunks) * 100),
						eventsLoaded: (chunkIndex + 1) * chunkedModel.chunkSize,
						totalEvents: chunkedModel.totalChunks * chunkedModel.chunkSize
					};
					onChunkLoaded(progress);
				}
				
				currentChunk++;
				loadNextChunk();
			}, 0);
		}
		}
		
		// Start loading
		loadNextChunk();
	});
}


