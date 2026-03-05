import { describe, it, expect } from 'vitest';
import type { LightingType, TimelineFrame } from '$lib/model/model-types';

interface TimelineEventWithFrame {
	id: string;
	label: string;
	start: number;
	end: number;
	zoom?: number;
	timelineFrame?: TimelineFrame;
}

// Mirrors the helpers in PropertiesPanel.svelte
function updateEventCamera(events: TimelineEventWithFrame[], eventId: string, zoom: number): TimelineEventWithFrame[] {
	const idx = events.findIndex((e) => e.id === eventId);
	if (idx === -1) return events;
	const ev = events[idx];
	const updated = [...events];
	updated[idx] = {
		...ev,
		zoom,
		timelineFrame: ev.timelineFrame
			? { ...ev.timelineFrame, camera: { ...(ev.timelineFrame.camera ?? {}), zoom } }
			: ev.timelineFrame
	};
	return updated;
}

function updateEventLighting(events: TimelineEventWithFrame[], eventId: string, type: LightingType): TimelineEventWithFrame[] {
	const idx = events.findIndex((e) => e.id === eventId);
	if (idx === -1) return events;
	const ev = events[idx];
	const updated = [...events];
	updated[idx] = {
		...ev,
		timelineFrame: ev.timelineFrame
			? { ...ev.timelineFrame, lighting: { ...(ev.timelineFrame.lighting ?? {}), type } }
			: ev.timelineFrame
	};
	return updated;
}

const baseEvents: TimelineEventWithFrame[] = [
	{
		id: 'event_0',
		label: 'Event 1',
		start: 0,
		end: 120,
		zoom: 1.0,
		timelineFrame: {
			actors: [],
			camera: { zoom: 1.0 },
			lighting: { type: 'daylight', intensity: 0.8 }
		}
	},
	{
		id: 'event_1',
		label: 'Event 2',
		start: 120,
		end: 240,
		timelineFrame: { actors: [] }
	}
];

describe('updateEventCamera', () => {
	it('updates zoom on matching event', () => {
		const result = updateEventCamera(baseEvents, 'event_0', 2.5);
		expect(result[0].zoom).toBe(2.5);
		expect(result[0].timelineFrame?.camera?.zoom).toBe(2.5);
	});

	it('does not mutate other events', () => {
		const result = updateEventCamera(baseEvents, 'event_0', 2.5);
		expect(result[1]).toBe(baseEvents[1]);
	});

	it('returns original array when id not found', () => {
		const result = updateEventCamera(baseEvents, 'event_99', 2.5);
		expect(result).toBe(baseEvents);
	});

	it('creates camera object if timelineFrame has no camera', () => {
		const result = updateEventCamera(baseEvents, 'event_1', 1.5);
		expect(result[1].timelineFrame?.camera?.zoom).toBe(1.5);
	});
});

describe('updateEventLighting', () => {
	it('updates lighting type on matching event', () => {
		const result = updateEventLighting(baseEvents, 'event_0', 'dusk');
		expect(result[0].timelineFrame?.lighting?.type).toBe('dusk');
	});

	it('preserves other lighting properties', () => {
		const result = updateEventLighting(baseEvents, 'event_0', 'studio');
		expect(result[0].timelineFrame?.lighting?.intensity).toBe(0.8);
	});

	it('does not mutate other events', () => {
		const result = updateEventLighting(baseEvents, 'event_0', 'tungsten');
		expect(result[1]).toBe(baseEvents[1]);
	});

	it('returns original array when id not found', () => {
		const result = updateEventLighting(baseEvents, 'event_99', 'ambient');
		expect(result).toBe(baseEvents);
	});

	it('creates lighting object if timelineFrame has no lighting', () => {
		const result = updateEventLighting(baseEvents, 'event_1', 'ambient');
		expect(result[1].timelineFrame?.lighting?.type).toBe('ambient');
	});
});
