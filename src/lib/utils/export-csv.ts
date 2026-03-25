import type { Model } from '$lib/model/model-types';

const HEADERS = [
	'id',
	'frame_start',
	'frame_end',
	'duration',
	'character',
	'mood',
	'action',
	'speech',
	'environment',
	'audio',
	'zoom'
];

/** Escape a CSV cell per RFC 4180. */
function cell(v: string | number | undefined | null): string {
	const s = String(v ?? '');
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export timeline events as CSV.
 * UTF-8 with BOM for Excel compatibility.
 */
export function exportToCSV(model: Model): string {
	const BOM = '\uFEFF';
	const rows = [...model.timeline]
		.sort((a, b) => a.time - b.time)
		.map((ev, i) => {
			const actor = ev.frame.actors?.[0];
			const charName = actor
				? (model.assets.characters.find((c) => c.id === actor.id)?.name ?? actor.id)
				: '';
			const envKey = Object.keys(model.assets.environments)[0] ?? '';
			const audioIds = ev.frame.audio_tracks?.map((t) => t.id).join(';') ?? '';
			return [
				i + 1,
				ev.time,
				ev.time + (ev.duration ?? 24),
				ev.duration ?? 24,
				charName,
				actor?.speech?.mood ?? '',
				actor?.action ?? '',
				actor?.speech?.text ?? '',
				envKey,
				audioIds,
				ev.frame.camera?.zoom ?? ''
			]
				.map(cell)
				.join(',');
		});
	return BOM + [HEADERS.join(','), ...rows].join('\r\n');
}
