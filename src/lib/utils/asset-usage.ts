/**
 * Asset Usage Tracking for Latent-line
 *
 * Tracks which assets are used in which timeline events,
 * identifies unused assets, and provides usage statistics.
 */

import type { Model } from '$lib/model/model-types';

/**
 * Context where an asset is used in a timeline event
 */
export type UsageContext = 'actor' | 'background' | 'audio_track' | 'reference';

/**
 * Location of asset usage in the timeline
 */
export interface UsageLocation {
	/** Timeline event time (ms) */
	eventTime: number;
	/** Context of usage */
	context: UsageContext;
	/** Additional detail (e.g., actor index, track id) */
	detail?: string;
}

/**
 * Usage information for a single asset
 */
export interface AssetUsage {
	/** Asset ID */
	assetId: string;
	/** Asset type */
	assetType: 'character' | 'environment' | 'audio';
	/** All locations where this asset is used */
	usedIn: UsageLocation[];
}

/**
 * Build a complete usage index from the model
 */
export function buildUsageIndex(model: Model): Map<string, AssetUsage> {
	const usage = new Map<string, AssetUsage>();

	// Initialize all assets with empty usage
	for (const char of model.assets.characters) {
		usage.set(char.id, {
			assetId: char.id,
			assetType: 'character',
			usedIn: []
		});
	}

	for (const [envId] of Object.entries(model.assets.environments)) {
		usage.set(envId, {
			assetId: envId,
			assetType: 'environment',
			usedIn: []
		});
	}

	for (const audio of model.assets.audio) {
		usage.set(audio.id, {
			assetId: audio.id,
			assetType: 'audio',
			usedIn: []
		});
	}

	// Scan timeline events for usage
	for (const event of model.timeline) {
		const frame = event.frame;

		// Character usage (actors)
		if (frame.actors) {
			for (let i = 0; i < frame.actors.length; i++) {
				const actor = frame.actors[i];
				if (usage.has(actor.id)) {
					usage.get(actor.id)!.usedIn.push({
						eventTime: event.time,
						context: 'actor',
						detail: `Actor ${i + 1}`
					});
				}
			}
		}

		// Environment usage (background)
		if (frame.character && usage.has(frame.character)) {
			// Note: frame.character references a character ID
			// For environments, we'd need a separate field
		}

		// Audio track usage
		if (frame.audio_tracks) {
			for (const track of frame.audio_tracks) {
				if (usage.has(track.id)) {
					usage.get(track.id)!.usedIn.push({
						eventTime: event.time,
						context: 'audio_track',
						detail: track.id
					});
				}
			}
		}
	}

	return usage;
}

/**
 * Find all unused assets (assets not referenced in any timeline event)
 */
export function findUnusedAssets(model: Model): string[] {
	const usage = buildUsageIndex(model);
	const unused: string[] = [];

	for (const [assetId, assetUsage] of usage) {
		if (assetUsage.usedIn.length === 0) {
			unused.push(assetId);
		}
	}

	return unused;
}

/**
 * Get usage count for a specific asset
 */
export function getUsageCount(model: Model, assetId: string): number {
	const usage = buildUsageIndex(model);
	const assetUsage = usage.get(assetId);
	return assetUsage?.usedIn.length ?? 0;
}

/**
 * Get usage details for a specific asset
 */
export function getUsageDetails(model: Model, assetId: string): UsageLocation[] {
	const usage = buildUsageIndex(model);
	const assetUsage = usage.get(assetId);
	return assetUsage?.usedIn ?? [];
}

/**
 * Check if an asset is used anywhere in the timeline
 */
export function isAssetUsed(model: Model, assetId: string): boolean {
	return getUsageCount(model, assetId) > 0;
}

/**
 * Get usage summary (count per asset type)
 */
export function getUsageSummary(model: Model): {
	characters: { used: number; total: number };
	environments: { used: number; total: number };
	audio: { used: number; total: number };
} {
	const usage = buildUsageIndex(model);

	const characters = {
		used: 0,
		total: model.assets.characters.length
	};
	const environments = {
		used: 0,
		total: Object.keys(model.assets.environments).length
	};
	const audio = {
		used: 0,
		total: model.assets.audio.length
	};

	for (const assetUsage of usage.values()) {
		if (assetUsage.assetType === 'character' && assetUsage.usedIn.length > 0) {
			characters.used++;
		} else if (assetUsage.assetType === 'environment' && assetUsage.usedIn.length > 0) {
			environments.used++;
		} else if (assetUsage.assetType === 'audio' && assetUsage.usedIn.length > 0) {
			audio.used++;
		}
	}

	return { characters, environments, audio };
}
