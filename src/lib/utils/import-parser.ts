/**
 * import-parser.ts
 *
 * Utilities for importing timeline models from JSON/YAML files.
 * Supports validation, error reporting, and merge operations.
 */

import { modelSchema } from '$lib/model/model-template';
import type { Model } from '$lib/model/model-types';

export type ParseResult = 
	| { success: true; model: Model }
	| { success: false; error: string; details?: string[] };

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Parse imported file content (JSON or YAML)
 */
export function parseImportFile(content: string, fileType: 'json' | 'yaml'): ParseResult {
	try {
		let raw: unknown;

		if (fileType === 'json') {
			raw = JSON.parse(content);
		} else {
			// YAML parsing - use existing parseYAML function (stub for now)
			const { parseYAML } = require('./export-yaml');
			raw = parseYAML(content);
		}

		// Validate against schema
		const result = modelSchema.safeParse(raw);
		if (!result.success) {
			return {
				success: false,
				error: 'Schema validation failed',
				details: result.error.issues.map((issue) =>
					`${issue.path.join('.') || '(root)'}: ${issue.message}`
				)
			};
		}

		return {
			success: true,
			model: result.data as Model
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		
		if (message.includes('JSON')) {
			return {
				success: false,
				error: `Invalid ${fileType.toUpperCase()} syntax`,
				details: [message]
			};
		}

		return {
			success: false,
			error: 'Failed to parse file',
			details: [message]
		};
	}
}

/**
 * Validate imported model and return warnings
 */
export function validateImportFile(model: Model): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for empty timeline
	if (model.timeline.length === 0) {
		warnings.push('Timeline is empty');
	}

	// Check for missing assets
	if (model.assets.characters.length === 0 && 
	    Object.keys(model.assets.environments).length === 0 &&
	    model.assets.audio.length === 0) {
		warnings.push('No assets defined');
	}

	// Check for duplicate character IDs
	const charIds = new Set<string>();
	model.assets.characters.forEach((char) => {
		if (charIds.has(char.id)) {
			errors.push(`Duplicate character ID: ${char.id}`);
		}
		charIds.add(char.id);
	});

	// Check for duplicate audio IDs
	const audioIds = new Set<string>();
	model.assets.audio.forEach((audio) => {
		if (audioIds.has(audio.id)) {
			errors.push(`Duplicate audio ID: ${audio.id}`);
		}
		audioIds.add(audio.id);
	});

	// Check timeline events
	const times = new Set<number>();
	model.timeline.forEach((event, idx) => {
		if (times.has(event.time)) {
			warnings.push(`Multiple events at time ${event.time}ms`);
		}
		times.add(event.time);

		// Check actor references
		event.frame.actors?.forEach((actor) => {
			if (!model.assets.characters.find((c) => c.id === actor.id)) {
				errors.push(`Event ${idx}: Actor ${actor.id} not found in assets`);
			}
		});
	});

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Merge imported model into current model
 * - Append timeline events
 * - Merge assets (auto-rename duplicates)
 */
export function mergeModels(target: Model, source: Model): Model {
	const merged: Model = {
		project: target.project,
		assets: {
			characters: [...target.assets.characters],
			environments: { ...target.assets.environments },
			audio: [...target.assets.audio]
		},
		timeline: [...target.timeline],
		config: target.config
	};

	// Merge characters (auto-rename duplicates)
	const existingCharIds = new Set(merged.assets.characters.map((c) => c.id));
	source.assets.characters.forEach((char) => {
		let newId = char.id;
		let counter = 1;
		
		while (existingCharIds.has(newId)) {
			const parts = char.id.split('_');
			const base = parts.length > 1 ? parts.slice(0, -1).join('_') : char.id;
			newId = `${base}_${counter}`;
			counter++;
		}

		merged.assets.characters.push({
			...char,
			id: newId
		});
		existingCharIds.add(newId);
	});

	// Merge audio (auto-rename duplicates)
	const existingAudioIds = new Set(merged.assets.audio.map((a) => a.id));
	source.assets.audio.forEach((audio) => {
		let newId = audio.id;
		let counter = 1;
		
		while (existingAudioIds.has(newId)) {
			const parts = audio.id.split('_');
			const base = parts.length > 1 ? parts.slice(0, -1).join('_') : audio.id;
			newId = `${base}_${counter}`;
			counter++;
		}

		merged.assets.audio.push({
			...audio,
			id: newId
		});
		existingAudioIds.add(newId);
	});

	// Merge environments (auto-rename duplicates)
	const existingEnvIds = new Set(Object.keys(merged.assets.environments));
	Object.entries(source.assets.environments).forEach(([id, env]) => {
		let newId = id;
		let counter = 1;
		
		while (existingEnvIds.has(newId)) {
			newId = `${id}_${counter}`;
			counter++;
		}

		merged.assets.environments[newId] = env;
		existingEnvIds.add(newId);
	});

	// Append timeline events
	// Rebase times to continue from last event
	const lastTime = merged.timeline.length > 0 
		? Math.max(...merged.timeline.map((e) => e.time))
		: 0;
	const timeOffset = lastTime + 1000; // 1 second gap

	source.timeline.forEach((event) => {
		merged.timeline.push({
			...event,
			time: event.time + timeOffset
		});
	});

	// Sort timeline by time
	merged.timeline.sort((a, b) => a.time - b.time);

	return merged;
}

/**
 * Get model summary for preview
 */
export function getModelSummary(model: Model): {
	projectName: string;
	fps: number;
	resolution: string;
	characterCount: number;
	environmentCount: number;
	audioCount: number;
	eventCount: number;
	totalDuration: number;
} {
	const sortedEvents = [...model.timeline].sort((a, b) => a.time - b.time);
	const lastEvent = sortedEvents[sortedEvents.length - 1];
	const totalDuration = lastEvent 
		? lastEvent.time + (lastEvent.duration ?? 0)
		: 0;

	return {
		projectName: model.project.name,
		fps: model.project.fps,
		resolution: `${model.project.resolution.w}x${model.project.resolution.h}`,
		characterCount: model.assets.characters.length,
		environmentCount: Object.keys(model.assets.environments).length,
		audioCount: model.assets.audio.length,
		eventCount: model.timeline.length,
		totalDuration
	};
}
