/**
 * Event Statistics Dashboard for Latent-line
 *
 * Calculates timeline statistics including event counts,
 * character screen time, mood distribution, etc.
 */

import type { Model, Mood, LightingType } from '$lib/model/model-types';

/**
 * Timeline statistics
 */
export interface TimelineStats {
	/** Total number of events */
	totalEvents: number;
	/** Total timeline duration in ms */
	totalDuration: number;
	/** Screen time per character (ms) */
	characterScreenTime: Map<string, number>;
	/** Count of events per mood */
	moodDistribution: Record<string, number>;
	/** Count of events per lighting type */
	lightingDistribution: Record<string, number>;
	/** Total audio tracks */
	audioTrackCount: number;
	/** Total markers */
	markerCount: number;
	/** Average event duration */
	averageEventDuration: number;
	/** Events with camera movements */
	cameraMovementCount: number;
	/** Events with FX */
	fxCount: number;
}

/**
 * Calculate comprehensive timeline statistics
 */
export function calculateStats(model: Model): TimelineStats {
	const events = model.timeline;
	const totalEvents = events.length;

	// Calculate total duration
	const maxTime = events.reduce((max, ev) => Math.max(max, ev.time), 0);
	const lastEvent = events.find((ev) => ev.time === maxTime);
	const totalDuration = lastEvent
		? maxTime + (lastEvent.duration ?? 24)
		: 0;

	// Character screen time
	const characterScreenTime = new Map<string, number>();
	for (const event of events) {
		const duration = event.duration ?? 24;
		if (event.frame.actors) {
			for (const actor of event.frame.actors) {
				const current = characterScreenTime.get(actor.id) ?? 0;
				characterScreenTime.set(actor.id, current + duration);
			}
		}
	}

	// Mood distribution
	const moodDistribution: Record<string, number> = {};
	for (const event of events) {
		if (event.frame.actors) {
			for (const actor of event.frame.actors) {
				if (actor.speech?.mood) {
					const mood = actor.speech.mood;
					moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
				}
			}
		}
	}

	// Lighting distribution
	const lightingDistribution: Record<string, number> = {};
	for (const event of events) {
		if (event.frame.lighting?.type) {
			const type = event.frame.lighting.type;
			lightingDistribution[type] = (lightingDistribution[type] || 0) + 1;
		}
	}

	// Audio track count
	const audioTrackCount = events.reduce(
		(count, event) => count + (event.frame.audio_tracks?.length ?? 0),
		0
	);

	// Marker count
	const markerCount = model.markers?.length ?? 0;

	// Average event duration
	const totalEventDuration = events.reduce(
		(sum, ev) => sum + (ev.duration ?? 24),
		0
	);
	const averageEventDuration = totalEvents > 0 ? totalEventDuration / totalEvents : 0;

	// Camera movement count
	const cameraMovementCount = events.filter(
		(ev) =>
			ev.frame.camera?.zoom ||
			ev.frame.camera?.pan ||
			ev.frame.camera?.tilt
	).length;

	// FX count
	const fxCount = events.filter(
		(ev) => ev.frame.fx?.bloom || ev.frame.fx?.motion_blur
	).length;

	return {
		totalEvents,
		totalDuration,
		characterScreenTime,
		moodDistribution,
		lightingDistribution,
		audioTrackCount,
		markerCount,
		averageEventDuration,
		cameraMovementCount,
		fxCount
	};
}

/**
 * Format duration from ms to human-readable string
 */
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

/**
 * Get top characters by screen time
 */
export function getTopCharacters(
	model: Model,
	limit = 5
): Array<{ id: string; screenTime: number; percentage: number }> {
	const stats = calculateStats(model);
	const totalDuration = stats.totalDuration || 1;

	return Array.from(stats.characterScreenTime.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([id, screenTime]) => ({
			id,
			screenTime,
			percentage: Math.round((screenTime / totalDuration) * 100)
		}));
}

/**
 * Get mood breakdown as percentages
 */
export function getMoodBreakdown(
	model: Model
): Array<{ mood: string; count: number; percentage: number }> {
	const stats = calculateStats(model);
	const total = Object.values(stats.moodDistribution).reduce((sum, n) => sum + n, 0) || 1;

	return Object.entries(stats.moodDistribution)
		.sort((a, b) => b[1] - a[1])
		.map(([mood, count]) => ({
			mood,
			count,
			percentage: Math.round((count / total) * 100)
		}));
}

/**
 * Export stats as JSON
 */
export function exportStatsToJson(model: Model): string {
	const stats = calculateStats(model);
	const topChars = getTopCharacters(model);
	const moodBreakdown = getMoodBreakdown(model);

	return JSON.stringify(
		{
			totalEvents: stats.totalEvents,
			totalDuration: stats.totalDuration,
			totalDurationFormatted: formatDuration(stats.totalDuration),
			averageEventDuration: Math.round(stats.averageEventDuration),
			characterScreenTime: topChars,
			moodDistribution: moodBreakdown,
			lightingDistribution: stats.lightingDistribution,
			audioTrackCount: stats.audioTrackCount,
			markerCount: stats.markerCount,
			cameraMovementCount: stats.cameraMovementCount,
			fxCount: stats.fxCount
		},
		null,
		2
	);
}
