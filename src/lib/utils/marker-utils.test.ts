import { describe, it, expect } from 'vitest';
import {
	exportMarkersToCsv,
	exportMarkersToJson,
	importMarkersFromJson,
	importMarkersFromCsv,
	sortMarkersByTime,
	findMarkersInRange,
	getMarkerTypeStats
} from '$lib/utils/marker-utils';
import type { TimelineMarker } from '$lib/model/marker-types';

const sampleMarkers: TimelineMarker[] = [
	{
		id: 'marker_1',
		time: 5000,
		type: 'chapter',
		label: 'Chapter 1',
		color: '#ef4444',
		notes: 'First chapter',
		createdAt: 1000,
		updatedAt: 1000
	},
	{
		id: 'marker_2',
		time: 10000,
		type: 'beat',
		label: 'Beat 1',
		notes: 'Story beat',
		createdAt: 2000,
		updatedAt: 2000
	},
	{
		id: 'marker_3',
		time: 15000,
		type: 'note',
		label: 'Important note',
		color: '#f59e0b',
		createdAt: 3000,
		updatedAt: 3000
	}
];

describe('exportMarkersToCsv', () => {
	it('exports markers to CSV format', () => {
		const csv = exportMarkersToCsv(sampleMarkers);
		const lines = csv.split('\n');

		expect(lines[0]).toContain('id,time,type,label,color,notes');
		expect(lines[1]).toContain('marker_1');
		expect(lines[1]).toContain('5000');
		expect(lines[1]).toContain('chapter');
		expect(lines[1]).toContain('Chapter 1');
	});

	it('handles empty markers array', () => {
		const csv = exportMarkersToCsv([]);
		const lines = csv.split('\n');
		expect(lines[0]).toBe('id,time,type,label,color,notes');
		expect(lines.length).toBe(1);
	});

	it('escapes quotes in values', () => {
		const markers: TimelineMarker[] = [
			{
				id: 'marker_1',
				time: 1000,
				type: 'note',
				label: 'Test "quoted"',
				notes: 'Has "quotes"',
				createdAt: 0,
				updatedAt: 0
			}
		];
		const csv = exportMarkersToCsv(markers);
		expect(csv).toContain('"Test ""quoted"""');
	});
});

describe('exportMarkersToJson', () => {
	it('exports markers to JSON format', () => {
		const json = exportMarkersToJson(sampleMarkers);
		const parsed = JSON.parse(json);

		expect(Array.isArray(parsed)).toBe(true);
		expect(parsed.length).toBe(3);
		expect(parsed[0].id).toBe('marker_1');
		expect(parsed[0].time).toBe(5000);
	});

	it('handles empty markers array', () => {
		const json = exportMarkersToJson([]);
		expect(json).toBe('[]');
	});
});

describe('importMarkersFromJson', () => {
	it('imports markers from JSON', () => {
		const json = JSON.stringify(sampleMarkers);
		const markers = importMarkersFromJson(json);

		expect(markers).toHaveLength(3);
		expect(markers[0].id).toBe('marker_1');
		expect(markers[0].time).toBe(5000);
	});

	it('throws on invalid JSON array', () => {
		expect(() => importMarkersFromJson('{"not": "array"}')).toThrow(
			'Invalid markers JSON: expected array'
		);
	});

	it('throws on invalid JSON', () => {
		expect(() => importMarkersFromJson('not json')).toThrow();
	});
});

describe('importMarkersFromCsv', () => {
	it('imports markers from CSV', () => {
		const csv = 'id,time,type,label,color,notes\nmarker_1,5000,chapter,Chapter 1,#ef4444,Notes';
		const markers = importMarkersFromCsv(csv);

		expect(markers).toHaveLength(1);
		expect(markers[0].id).toBe('marker_1');
		expect(markers[0].time).toBe(5000);
		expect(markers[0].type).toBe('chapter');
		expect(markers[0].label).toBe('Chapter 1');
	});

	it('handles empty CSV', () => {
		const markers = importMarkersFromCsv('id,time,type,label,color,notes');
		expect(markers).toHaveLength(0);
	});

	it('handles quoted values with commas', () => {
		const csv = 'id,time,type,label,color,notes\nmarker_1,5000,note,"Label, with comma",#fff,Notes';
		const markers = importMarkersFromCsv(csv);
		expect(markers[0].label).toBe('Label, with comma');
	});
});

describe('sortMarkersByTime', () => {
	it('sorts markers by time ascending', () => {
		const unsorted: TimelineMarker[] = [
			{ id: 'm1', time: 15000, type: 'note', label: 'C', createdAt: 0, updatedAt: 0 },
			{ id: 'm2', time: 5000, type: 'note', label: 'A', createdAt: 0, updatedAt: 0 },
			{ id: 'm3', time: 10000, type: 'note', label: 'B', createdAt: 0, updatedAt: 0 }
		];

		const sorted = sortMarkersByTime(unsorted);
		expect(sorted[0].time).toBe(5000);
		expect(sorted[1].time).toBe(10000);
		expect(sorted[2].time).toBe(15000);
	});

	it('does not mutate original array', () => {
		const unsorted: TimelineMarker[] = [
			{ id: 'm1', time: 10000, type: 'note', label: 'B', createdAt: 0, updatedAt: 0 },
			{ id: 'm2', time: 5000, type: 'note', label: 'A', createdAt: 0, updatedAt: 0 }
		];

		sortMarkersByTime(unsorted);
		expect(unsorted[0].time).toBe(10000);
	});
});

describe('findMarkersInRange', () => {
	it('finds markers in time range', () => {
		const result = findMarkersInRange(sampleMarkers, 4000, 11000);
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('marker_1');
		expect(result[1].id).toBe('marker_2');
	});

	it('returns empty array if no markers in range', () => {
		const result = findMarkersInRange(sampleMarkers, 100, 1000);
		expect(result).toHaveLength(0);
	});

	it('includes markers at boundaries', () => {
		const result = findMarkersInRange(sampleMarkers, 5000, 5000);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('marker_1');
	});
});

describe('getMarkerTypeStats', () => {
	it('returns count per marker type', () => {
		const stats = getMarkerTypeStats(sampleMarkers);
		expect(stats.chapter).toBe(1);
		expect(stats.beat).toBe(1);
		expect(stats.note).toBe(1);
		expect(stats.cue).toBeUndefined();
	});

	it('handles empty array', () => {
		const stats = getMarkerTypeStats([]);
		expect(stats).toEqual({});
	});

	it('counts multiple markers of same type', () => {
		const markers: TimelineMarker[] = [
			{ id: 'm1', time: 1000, type: 'chapter', label: 'C1', createdAt: 0, updatedAt: 0 },
			{ id: 'm2', time: 2000, type: 'chapter', label: 'C2', createdAt: 0, updatedAt: 0 },
			{ id: 'm3', time: 3000, type: 'beat', label: 'B1', createdAt: 0, updatedAt: 0 }
		];
		const stats = getMarkerTypeStats(markers);
		expect(stats.chapter).toBe(2);
		expect(stats.beat).toBe(1);
	});
});
