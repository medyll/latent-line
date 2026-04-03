/**
 * Marker utilities for export/import and manipulation
 */

import type { TimelineMarker } from '$lib/model/marker-types';

/**
 * Export markers to CSV format
 */
export function exportMarkersToCsv(markers: TimelineMarker[]): string {
	const headers = ['id', 'time', 'type', 'label', 'color', 'notes'];
	const rows = markers.map((m) =>
		[m.id, m.time, m.type, m.label, m.color ?? '', m.notes ?? '']
			.map((v) => `"${String(v).replace(/"/g, '""')}"`)
			.join(',')
	);

	return [headers.join(','), ...rows].join('\n');
}

/**
 * Export markers to JSON format
 */
export function exportMarkersToJson(markers: TimelineMarker[]): string {
	return JSON.stringify(markers, null, 2);
}

/**
 * Import markers from JSON
 * @throws Error if JSON is invalid
 */
export function importMarkersFromJson(json: string): TimelineMarker[] {
	const markers = JSON.parse(json);
	if (!Array.isArray(markers)) {
		throw new Error('Invalid markers JSON: expected array');
	}
	return markers as TimelineMarker[];
}

/**
 * Import markers from CSV
 */
export function importMarkersFromCsv(csv: string): TimelineMarker[] {
	const lines = csv.trim().split('\n');
	if (lines.length < 2) return [];

	const markers: TimelineMarker[] = [];
	const now = Date.now();

	for (let i = 1; i < lines.length; i++) {
		const values = parseCsvLine(lines[i]);
		if (values.length < 4) continue;

		markers.push({
			id: values[0] || `marker_${now}_${i}`,
			time: parseInt(values[1], 10) || 0,
			type: (values[2] as 'chapter' | 'beat' | 'note' | 'cue') || 'note',
			label: values[3] || 'Marker',
			color: values[4] || undefined,
			notes: values[5] || undefined,
			createdAt: now,
			updatedAt: now
		});
	}

	return markers;
}

/**
 * Parse a single CSV line (handles quoted values with commas)
 */
function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current);

	return result;
}

/**
 * Sort markers by time
 */
export function sortMarkersByTime(markers: TimelineMarker[]): TimelineMarker[] {
	return [...markers].sort((a, b) => a.time - b.time);
}

/**
 * Find markers in a time range
 */
export function findMarkersInRange(
	markers: TimelineMarker[],
	startTime: number,
	endTime: number
): TimelineMarker[] {
	return markers.filter((m) => m.time >= startTime && m.time <= endTime);
}

/**
 * Get marker type statistics
 */
export function getMarkerTypeStats(markers: TimelineMarker[]): Record<string, number> {
	const stats: Record<string, number> = {};
	for (const marker of markers) {
		stats[marker.type] = (stats[marker.type] || 0) + 1;
	}
	return stats;
}
