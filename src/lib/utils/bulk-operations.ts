/**
 * bulk-operations.ts
 *
 * Bulk operations for timeline events.
 */

import type { TimelineEvent, Model } from '$lib/model/model-types';

export interface BulkOperationResult {
	success: boolean;
	affectedCount: number;
	newModel?: Model;
	error?: string;
}

/**
 * Delete multiple events from timeline
 */
export function bulkDelete(
	model: Model,
	times: number[]
): BulkOperationResult {
	try {
		const newModel = structuredClone(model);
		const originalCount = newModel.timeline.length;
		
		newModel.timeline = newModel.timeline.filter(
			(event) => !times.includes(event.time)
		);
		
		const affectedCount = originalCount - newModel.timeline.length;
		
		return {
			success: true,
			affectedCount,
			newModel
		};
	} catch (err) {
		return {
			success: false,
			affectedCount: 0,
			error: err instanceof Error ? err.message : 'Delete failed'
		};
	}
}

/**
 * Duplicate multiple events
 */
export function bulkDuplicate(
	model: Model,
	times: number[],
	offsetMs: number = 1000
): BulkOperationResult {
	try {
		const newModel = structuredClone(model);
		
		// Find events to duplicate
		const eventsToDuplicate = newModel.timeline.filter((event) =>
			times.includes(event.time)
		);
		
		// Create duplicates with offset time
		const duplicates: TimelineEvent[] = eventsToDuplicate.map((event) => ({
			...structuredClone(event),
			time: event.time + offsetMs
		}));
		
		// Add duplicates to timeline
		newModel.timeline.push(...duplicates);
		
		// Sort by time
		newModel.timeline.sort((a, b) => a.time - b.time);
		
		return {
			success: true,
			affectedCount: duplicates.length,
			newModel
		};
	} catch (err) {
		return {
			success: false,
			affectedCount: 0,
			error: err instanceof Error ? err.message : 'Duplicate failed'
		};
	}
}

/**
 * Move multiple events in time
 */
export function bulkMove(
	model: Model,
	times: number[],
	deltaMs: number
): BulkOperationResult {
	try {
		const newModel = structuredClone(model);
		
		// Move selected events
		newModel.timeline = newModel.timeline.map((event) => {
			if (times.includes(event.time)) {
				return {
					...event,
					time: Math.max(0, event.time + deltaMs)
				};
			}
			return event;
		});
		
		// Sort by time
		newModel.timeline.sort((a, b) => a.time - b.time);
		
		return {
			success: true,
			affectedCount: times.length,
			newModel
		};
	} catch (err) {
		return {
			success: false,
			affectedCount: 0,
			error: err instanceof Error ? err.message : 'Move failed'
		};
	}
}

/**
 * Batch edit common properties
 */
export function bulkEdit(
	model: Model,
	times: number[],
	updates: Partial<TimelineEvent['frame']>
): BulkOperationResult {
	try {
		const newModel = structuredClone(model);
		let affectedCount = 0;
		
		newModel.timeline = newModel.timeline.map((event) => {
			if (times.includes(event.time)) {
				affectedCount++;
				return {
					...event,
					frame: {
						...event.frame,
						...updates
					}
				};
			}
			return event;
		});
		
		return {
			success: true,
			affectedCount,
			newModel
		};
	} catch (err) {
		return {
			success: false,
			affectedCount: 0,
			error: err instanceof Error ? err.message : 'Edit failed'
		};
	}
}
