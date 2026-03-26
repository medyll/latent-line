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

	// Model metadata
	lines.push(`name: "${escapeYAMLString(model.config?.title || 'Untitled')}"`);
	if (model.config?.description) {
		lines.push(`description: "${escapeYAMLString(model.config.description)}"`);
	}
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
	if (model.timeline?.events && model.timeline.events.length > 0) {
		lines.push('');
		lines.push('timeline:');
		lines.push(`  duration: ${model.timeline.duration || 10000}`);
		lines.push('  events:');

		model.timeline.events.forEach((event) => {
			lines.push(`    - id: "${event.id}"`);
			lines.push(`      time: ${event.time}`);
			lines.push(`      label: "${escapeYAMLString(event.label)}"`);
			if (event.description) {
				lines.push(`      description: "${escapeYAMLString(event.description)}"`);
			}

			// Asset references
			if (event.assets && event.assets.length > 0) {
				lines.push('      assets:');
				event.assets.forEach((assetRef) => {
					lines.push(`        - ${assetRef.asset_id}`);
					if (assetRef.variant) {
						lines.push(`          variant: "${assetRef.variant}"`);
					}
				});
			}

			// ComfyUI settings (if present)
			if (event.comfyui_settings) {
				lines.push(`      comfyui_enabled: ${event.comfyui_settings.enabled}`);
				if (event.comfyui_settings.custom_positive) {
					lines.push(`      comfyui_positive: "${escapeYAMLString(event.comfyui_settings.custom_positive)}"`);
				}
				if (event.comfyui_settings.custom_negative) {
					lines.push(`      comfyui_negative: "${escapeYAMLString(event.comfyui_settings.custom_negative)}"`);
				}
			}
		});
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
 */
export function parseYAML(yamlText: string): Partial<Model> {
	const model: Partial<Model> = {
		assets: { characters: [], environments: {} },
		timeline: { events: [], duration: 10000 },
		config: {}
	};

	const lines = yamlText.split('\n');
	let currentSection = '';
	let currentAssetType = '';

	let i = 0;
	while (i < lines.length) {
		const line = lines[i].trimStart();
		const indent = lines[i].length - lines[i].trimStart().length;

		// Skip comments and empty lines
		if (!line || line.startsWith('#')) {
			i++;
			continue;
		}

		// Section headers (only set section for root-level headers)
		if (indent === 0 || !lines[i].startsWith(' ')) {
			if (line === 'assets:') {
				currentSection = 'assets';
				i++;
				continue;
			}
			if (line === 'timeline:') {
				currentSection = 'timeline';
				i++;
				continue;
			}
		}

		// Parse key-value pairs
		const match = line.match(/^(\w+):\s*(.*)$/);
		if (match) {
			const [, key, value] = match;

			// Root-level properties
			if (indent === 0 || !lines[i].startsWith(' ')) {
				if (key === 'name' && model.config) {
					model.config.title = unescapeYAMLString(value.replace(/^["']|["']$/g, ''));
				}
				if (key === 'description' && model.config) {
					model.config.description = unescapeYAMLString(value.replace(/^["']|["']$/g, ''));
				}
			}

			// Asset section properties
			if (currentSection === 'assets') {
				if (key === 'characters') {
					currentAssetType = 'characters';
				} else if (key === 'environments') {
					currentAssetType = 'environments';
				}
			}

			// Timeline section properties
			if (currentSection === 'timeline' && key === 'duration') {
				model.timeline!.duration = parseInt(value, 10);
			}
		}

		i++;
	}

	return model;
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
