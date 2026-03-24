import { describe, it, expect } from 'vitest';
import type { TimelineEvent } from '../../../model/model-types';

// Pure orphan-detection and reference-count helpers tested independently.

function computeUsedCharIds(timeline: TimelineEvent[]): Set<string> {
	return new Set(timeline.flatMap((ev) => (ev.frame.actors ?? []).map((a) => a.id)));
}

function computeCharRefCounts(timeline: TimelineEvent[]): Record<string, number> {
	return timeline.reduce(
		(acc, ev) => {
			for (const actor of ev.frame.actors ?? []) {
				acc[actor.id] = (acc[actor.id] ?? 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>
	);
}

function computeUsedAudioIds(timeline: TimelineEvent[]): Set<string> {
	return new Set(timeline.flatMap((ev) => (ev.frame.audio_tracks ?? []).map((t) => t.id)));
}

function computeAudioRefCounts(timeline: TimelineEvent[]): Record<string, number> {
	return timeline.reduce(
		(acc, ev) => {
			for (const track of ev.frame.audio_tracks ?? []) {
				acc[track.id] = (acc[track.id] ?? 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>
	);
}

const timeline: TimelineEvent[] = [
	{
		time: 0,
		frame: {
			actors: [{ id: 'char_01' }, { id: 'char_02' }],
			audio_tracks: [{ id: 'bgm_01', volume: 0.6 }, { id: 'sfx_01' }]
		}
	},
	{
		time: 10,
		frame: {
			actors: [{ id: 'char_01' }],
			audio_tracks: [{ id: 'bgm_01' }]
		}
	}
];

describe('Orphan detection — characters', () => {
	it('identifies used character IDs', () => {
		const used = computeUsedCharIds(timeline);
		expect(used.has('char_01')).toBe(true);
		expect(used.has('char_02')).toBe(true);
		expect(used.has('char_03')).toBe(false);
	});

	it('counts character references across frames', () => {
		const counts = computeCharRefCounts(timeline);
		expect(counts['char_01']).toBe(2);
		expect(counts['char_02']).toBe(1);
		expect(counts['char_03']).toBeUndefined();
	});

	it('marks unused character as orphan', () => {
		const used = computeUsedCharIds(timeline);
		expect(used.has('char_99')).toBe(false); // orphan
	});

	it('handles empty timeline', () => {
		const used = computeUsedCharIds([]);
		expect(used.size).toBe(0);
	});

	it('handles events with no actors', () => {
		const tl: TimelineEvent[] = [{ time: 0, frame: {} }];
		const used = computeUsedCharIds(tl);
		expect(used.size).toBe(0);
	});
});

describe('Orphan detection — audio', () => {
	it('identifies used audio IDs', () => {
		const used = computeUsedAudioIds(timeline);
		expect(used.has('bgm_01')).toBe(true);
		expect(used.has('sfx_01')).toBe(true);
		expect(used.has('sfx_99')).toBe(false);
	});

	it('counts audio references across frames', () => {
		const counts = computeAudioRefCounts(timeline);
		expect(counts['bgm_01']).toBe(2);
		expect(counts['sfx_01']).toBe(1);
	});

	it('marks unused audio as orphan', () => {
		const used = computeUsedAudioIds(timeline);
		expect(used.has('unused_track')).toBe(false);
	});

	it('handles events with no audio_tracks', () => {
		const tl: TimelineEvent[] = [{ time: 0, frame: { actors: [{ id: 'c1' }] } }];
		const used = computeUsedAudioIds(tl);
		expect(used.size).toBe(0);
	});
});
