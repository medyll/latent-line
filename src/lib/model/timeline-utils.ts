import type { TimelineEvent } from './model-types';

/**
 * Accepts a timeline in either array or record form and returns a sorted array of TimelineEvent.
 * - If input is already an array, returns a shallow copy.
 * - If input is an object (Record<string, TimelineEvent>), returns Object.values(...) sorted by time.
 * - Otherwise returns an empty array.
 */
export function toTimelineArray(input: unknown): TimelineEvent[] {
	if (!input) return [];
	if (Array.isArray(input)) return [...input] as TimelineEvent[];
	if (typeof input === 'object') {
		const obj = input as Record<string, TimelineEvent>;
		try {
			return Object.values(obj)
				.slice()
				.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
		} catch {
			return [];
		}
	}
	return [];
}
