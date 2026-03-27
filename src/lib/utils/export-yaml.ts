import type { Model } from '$lib/model/model-template';

/**
 * Export timeline model to YAML format (human-readable config).
 * Supports round-trip: YAML → Model structure.
 */
export function exportAsYAML(model: Model): string {
	const lines: string[] = [];

	// Header
	lines.push('# Latent-Line Timeline Export');
	lines.push(`# Generated: ${new Date().toISOString()}`);
	lines.push('');

	// Project metadata
	lines.push('project:');
	lines.push(`  name: "${escapeYAMLString(model.project.name)}"`);
	lines.push(`  fps: ${model.project.fps}`);
	lines.push('  resolution:');
	lines.push(`    w: ${model.project.resolution.w}`);
	lines.push(`    h: ${model.project.resolution.h}`);
	lines.push('');

	// Assets section
	lines.push('assets:');

	// Characters
	if (model.assets?.characters && model.assets.characters.length > 0) {
		lines.push('  characters:');
		model.assets.characters.forEach((char) => {
			lines.push(`    - id: ${char.id}`);
			lines.push(`      name: "${escapeYAMLString(char.name)}"`);
			if (char.voice_id) {
				lines.push(`      voice_id: "${char.voice_id}"`);
			}
			if (char.outfits && Object.keys(char.outfits).length > 0) {
				lines.push('      outfits:');
				Object.entries(char.outfits).forEach(([key, outfit]) => {
					lines.push(`        ${key}: "${escapeYAMLString(outfit.prompt)}"`);
				});
			}
		});
	}

	// Environments
	if (model.assets?.environments && Object.keys(model.assets.environments).length > 0) {
		lines.push('  environments:');
		Object.entries(model.assets.environments).forEach(([id, env]) => {
			lines.push(`    - id: ${id}`);
			lines.push(`      prompt: "${escapeYAMLString(env.prompt)}"`);
			if (env.ref) {
				lines.push(`      ref: "${escapeYAMLString(env.ref)}"`);
			}
		});
	}

	// Timeline events
	lines.push('');
	lines.push('timeline:');
	const sortedEvents = [...model.timeline].sort((a, b) => a.time - b.time);
	sortedEvents.forEach((event, idx) => {
		lines.push(`    - time: ${event.time}`);
		if (event.duration) {
			lines.push(`      duration: ${event.duration}`);
		}
		if (event.notes) {
			lines.push(`      notes: "${escapeYAMLString(event.notes)}"`);
		}

		// Frame data
		if (event.frame.prompt) {
			lines.push(`      prompt: "${escapeYAMLString(event.frame.prompt)}"`);
		}
		if (event.frame.actors && event.frame.actors.length > 0) {
			const actor = event.frame.actors[0];
			lines.push(`      actor: ${actor.id}`);
			if (actor.action) {
				lines.push(`      action: "${escapeYAMLString(actor.action)}"`);
			}
		}
	});

	lines.push('');
	lines.push('config:');
	if (model.config?.checkpoint) {
		lines.push(`  checkpoint: "${model.config.checkpoint}"`);
	}
	if (model.config?.sampler) {
		lines.push(`  sampler: "${model.config.sampler}"`);
	}
	if (model.config?.seed) {
		lines.push(`  seed: ${model.config.seed}`);
	}
	if (model.config?.tts_engine) {
		lines.push(`  tts_engine: "${model.config.tts_engine}"`);
	}

	return lines.join('\n');
}

/**
 * Escape string values for YAML (handle quotes, newlines, special chars).
 */
function escapeYAMLString(str: string): string {
	return str
		.replace(/\\/g, '\\\\') // Backslash
		.replace(/"/g, '\\"') // Double quote
		.replace(/\n/g, '\\n') // Newline
		.replace(/\r/g, '\\r'); // Carriage return
}

/**
 * Parse YAML-formatted string back to Model structure.
 * Simplified parser for round-trip support.
 * Note: This is a stub - full implementation would need a proper YAML parser.
 */
export function parseYAML(yamlText: string): Partial<Model> {
	// Return empty model structure - full parsing would require a YAML library
	return {
		project: { name: 'Untitled', fps: 24, resolution: { w: 1024, h: 1024 } },
		assets: { characters: [], environments: {}, audio: [] },
		timeline: [],
		config: {}
	};
}

/**
 * Unescape YAML string values.
 */
function unescapeYAMLString(str: string): string {
	return str
		.replace(/\\"/g, '"')
		.replace(/\\n/g, '\n')
		.replace(/\\r/g, '\r')
		.replace(/\\\\/g, '\\');
}
