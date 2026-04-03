import { describe, it, expect } from 'vitest';
import {
	MARKER_COLORS,
	MARKER_LABELS,
	generateMarkerId,
	createMarker,
	getMarkerColor
} from '$lib/model/marker-types';
import type { MarkerType } from '$lib/model/marker-types';

describe('MARKER_COLORS', () => {
	it('has colors for all marker types', () => {
		expect(MARKER_COLORS.chapter).toBe('#ef4444');
		expect(MARKER_COLORS.beat).toBe('#3b82f6');
		expect(MARKER_COLORS.note).toBe('#f59e0b');
		expect(MARKER_COLORS.cue).toBe('#10b981');
	});

	it('covers all marker types', () => {
		const types: MarkerType[] = ['chapter', 'beat', 'note', 'cue'];
		types.forEach((type) => {
			expect(MARKER_COLORS[type]).toBeDefined();
			expect(MARKER_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});
});

describe('MARKER_LABELS', () => {
	it('has labels for all marker types', () => {
		expect(MARKER_LABELS.chapter).toBe('Chapter');
		expect(MARKER_LABELS.beat).toBe('Beat');
		expect(MARKER_LABELS.note).toBe('Note');
		expect(MARKER_LABELS.cue).toBe('Cue');
	});
});

describe('generateMarkerId', () => {
	it('generates unique IDs', () => {
		const id1 = generateMarkerId();
		const id2 = generateMarkerId();
		expect(id1).not.toBe(id2);
	});

	it('generates IDs with correct format', () => {
		const id = generateMarkerId();
		expect(id).toMatch(/^marker_\d+_[a-z0-9]{5}$/);
	});

	it('generates IDs starting with marker_', () => {
		const id = generateMarkerId();
		expect(id.match(/^marker_/)).toBeTruthy();
	});
});

describe('createMarker', () => {
	it('creates a marker with defaults', () => {
		const marker = createMarker(5000);
		expect(marker.id).toMatch(/^marker_\d+/);
		expect(marker.time).toBe(5000);
		expect(marker.type).toBe('note');
		expect(marker.label).toBe('Marker');
		expect(marker.color).toBe('#f59e0b');
		expect(marker.createdAt).toBeDefined();
		expect(marker.updatedAt).toBeDefined();
	});

	it('creates a marker with custom type and label', () => {
		const marker = createMarker(10000, 'chapter', 'Chapter 1');
		expect(marker.time).toBe(10000);
		expect(marker.type).toBe('chapter');
		expect(marker.label).toBe('Chapter 1');
		expect(marker.color).toBe('#ef4444');
	});

	it('sets createdAt and updatedAt to the same value initially', () => {
		const marker = createMarker(0);
		expect(marker.createdAt).toBe(marker.updatedAt);
	});

	it('uses correct default color for each type', () => {
		const chapter = createMarker(0, 'chapter');
		const beat = createMarker(0, 'beat');
		const note = createMarker(0, 'note');
		const cue = createMarker(0, 'cue');

		expect(chapter.color).toBe('#ef4444');
		expect(beat.color).toBe('#3b82f6');
		expect(note.color).toBe('#f59e0b');
		expect(cue.color).toBe('#10b981');
	});
});

describe('getMarkerColor', () => {
	it('returns custom color if set', () => {
		const marker = createMarker(0);
		marker.color = '#ff0000';
		expect(getMarkerColor(marker)).toBe('#ff0000');
	});

	it('returns default color if custom color not set', () => {
		const marker = createMarker(0, 'chapter');
		expect(getMarkerColor(marker)).toBe('#ef4444');
	});

	it('handles marker with undefined color', () => {
		const marker = createMarker(0, 'beat');
		marker.color = undefined;
		expect(getMarkerColor(marker)).toBe('#3b82f6');
	});
});
