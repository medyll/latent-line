import { describe, it, expect } from 'vitest';
import type { TimelineEvent, TimelineFrame } from '$lib/model/model-types';

// Pure logic helpers extracted from SequenceOrchestrator for unit testing.

function addEvent(timeline: TimelineEvent[]): { timeline: TimelineEvent[]; newTime: number } {
	const maxTime = timeline.reduce((max, ev) => Math.max(max, ev.time), -1);
	const newTime = maxTime + 10;
	const updated = [...timeline, { time: newTime, frame: {} as TimelineFrame }];
	return { timeline: updated, newTime };
}

function deleteEvent(timeline: TimelineEvent[], time: number): TimelineEvent[] {
	return timeline.filter((ev) => ev.time !== time);
}

function duplicateEvent(
	timeline: TimelineEvent[],
	time: number
): { timeline: TimelineEvent[]; newTime: number } | null {
	const source = timeline.find((ev) => ev.time === time);
	if (!source) return null;
	let freeTime = time + 1;
	while (timeline.some((ev) => ev.time === freeTime)) {
		freeTime++;
	}
	const updated = [...timeline, { time: freeTime, frame: structuredClone(source.frame) }];
	return { timeline: updated, newTime: freeTime };
}

describe('SequenceOrchestrator event CRUD logic', () => {
	describe('addEvent', () => {
		it('adds an event at max+10 when timeline is non-empty', () => {
			const tl: TimelineEvent[] = [
				{ time: 0, frame: {} },
				{ time: 10, frame: {} }
			];
			const { timeline, newTime } = addEvent(tl);
			expect(newTime).toBe(20);
			expect(timeline).toHaveLength(3);
			expect(timeline[2].time).toBe(20);
		});

		it('adds an event at time 9 (0 + 10 - 1) on empty timeline', () => {
			const { timeline, newTime } = addEvent([]);
			// max is -1, so newTime = -1 + 10 = 9
			expect(newTime).toBe(9);
			expect(timeline).toHaveLength(1);
		});

		it('does not mutate the original array', () => {
			const tl: TimelineEvent[] = [{ time: 5, frame: {} }];
			const { timeline } = addEvent(tl);
			expect(tl).toHaveLength(1);
			expect(timeline).toHaveLength(2);
		});
	});

	describe('deleteEvent', () => {
		it('removes the event with the given time', () => {
			const tl: TimelineEvent[] = [
				{ time: 0, frame: {} },
				{ time: 10, frame: {} }
			];
			const updated = deleteEvent(tl, 0);
			expect(updated).toHaveLength(1);
			expect(updated[0].time).toBe(10);
		});

		it('returns the same array if time is not found', () => {
			const tl: TimelineEvent[] = [{ time: 5, frame: {} }];
			const updated = deleteEvent(tl, 99);
			expect(updated).toHaveLength(1);
		});

		it('handles empty timeline gracefully', () => {
			const updated = deleteEvent([], 0);
			expect(updated).toHaveLength(0);
		});
	});

	describe('duplicateEvent', () => {
		it('duplicates an event at time+1', () => {
			const tl: TimelineEvent[] = [{ time: 5, frame: { actors: [] } }];
			const result = duplicateEvent(tl, 5);
			expect(result).not.toBeNull();
			expect(result!.newTime).toBe(6);
			expect(result!.timeline).toHaveLength(2);
		});

		it('bumps time if time+1 is occupied', () => {
			const tl: TimelineEvent[] = [
				{ time: 5, frame: {} },
				{ time: 6, frame: {} }
			];
			const result = duplicateEvent(tl, 5);
			expect(result!.newTime).toBe(7);
		});

		it('deep-clones the frame so mutations do not affect the source', () => {
			const tl: TimelineEvent[] = [{ time: 5, frame: { actors: [{ id: 'a1', action: 'walk' }] } }];
			const result = duplicateEvent(tl, 5);
			const clone = result!.timeline.find((ev) => ev.time === result!.newTime)!;
			clone.frame.actors![0].action = 'run';
			expect(tl[0].frame.actors![0].action).toBe('walk');
		});

		it('returns null when source time is not found', () => {
			const tl: TimelineEvent[] = [{ time: 5, frame: {} }];
			const result = duplicateEvent(tl, 99);
			expect(result).toBeNull();
		});
	});
});
