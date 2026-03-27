import { json, type RequestHandler } from '@sveltejs/kit';
import { modelSchema, type Model } from '$lib/model/model-template';
import { parseYAML } from '$lib/utils/export-yaml';

export type ImportRequest = {
	content: string;
	format?: 'yaml' | 'jsonld' | 'json';
};

export type ImportResponse = {
	success: boolean;
	model?: Model;
	warnings?: string[];
	message: string;
};

export type ErrorResponse = {
	error: string;
	details?: unknown;
	code: string;
};

/**
 * POST /api/import
 * Import timeline model from YAML, JSON-LD, or JSON format
 *
 * Query params:
 *   - format: yaml | jsonld | json | auto (default: auto-detect from content)
 *
 * Request body:
 *   {
 *     "content": "YAML or JSON string",
 *     "format": "yaml"
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "model": { ... validated model ... },
 *     "warnings": ["Asset ID missing for event evt_1"],
 *     "message": "Model imported successfully"
 *   }
 */
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Get format from query param or request body
		let format = url.searchParams.get('format') || 'auto';
		const body = await request.json();
		const { content, format: bodyFormat } = body as ImportRequest;

		if (bodyFormat) {
			format = bodyFormat;
		}

		if (!content || typeof content !== 'string') {
			return json(
				{
					error: 'Missing or invalid required field: content',
					code: 'MISSING_CONTENT'
				} as ErrorResponse,
				{ status: 400 }
			);
		}

		const warnings: string[] = [];
		let model: unknown;

		// Auto-detect format if needed
		if (format === 'auto') {
			if (content.trim().startsWith('{')) {
				format = 'json';
			} else if (content.trim().startsWith('#') || content.includes('assets:')) {
				format = 'yaml';
			} else {
				return json(
					{
						error: 'Could not auto-detect format. Please specify format explicitly.',
						code: 'FORMAT_DETECTION_FAILED'
					} as ErrorResponse,
					{ status: 400 }
				);
			}
		}

		// Parse based on format
		switch (format.toLowerCase()) {
			case 'yaml': {
				try {
					const parsed = parseYAML(content);
					model = parsed;
				} catch (parseError) {
					return json(
						{
							error: 'Failed to parse YAML',
							details: parseError instanceof Error ? parseError.message : String(parseError),
							code: 'YAML_PARSE_ERROR'
						} as ErrorResponse,
						{ status: 422 }
					);
				}
				break;
			}

			case 'jsonld': {
				try {
					const parsed = JSON.parse(content);
					// Convert JSON-LD to model structure (simplified)
					model = jsonldToModel(parsed);
				} catch (parseError) {
					return json(
						{
							error: 'Failed to parse JSON-LD',
							details: parseError instanceof Error ? parseError.message : String(parseError),
							code: 'JSONLD_PARSE_ERROR'
						} as ErrorResponse,
						{ status: 422 }
					);
				}
				break;
			}

			case 'json': {
				try {
					model = JSON.parse(content);
				} catch (parseError) {
					return json(
						{
							error: 'Failed to parse JSON',
							details: parseError instanceof Error ? parseError.message : String(parseError),
							code: 'JSON_PARSE_ERROR'
						} as ErrorResponse,
						{ status: 422 }
					);
				}
				break;
			}

			default: {
				return json(
					{
						error: `Unsupported import format: ${format}`,
						details: { supportedFormats: ['yaml', 'jsonld', 'json'] },
						code: 'UNSUPPORTED_FORMAT'
					} as ErrorResponse,
					{ status: 400 }
				);
			}
		}

		// Validate against schema
		const validated = modelSchema.safeParse(model);
		if (!validated.success) {
			// Return validation errors but still provide partial model if possible
			const errorMessages = validated.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

			return json(
				{
					success: false,
					warnings: errorMessages,
					message: 'Model validation failed'
				} as ImportResponse,
				{ status: 422 }
			);
		}

		return json({
			success: true,
			model: validated.data,
			warnings: warnings.length > 0 ? warnings : undefined,
			message: 'Model imported successfully'
		} as ImportResponse);
	} catch (error) {
		console.error('[import API] error:', error);

		return json(
			{
				error: 'Import failed',
				details: error instanceof Error ? error.message : String(error),
				code: 'IMPORT_ERROR'
			} as ErrorResponse,
			{ status: 500 }
		);
	}
};

/**
 * Convert JSON-LD structure back to Model (simplified).
 * Full conversion would require semantic understanding of @context.
 */
function jsonldToModel(jsonld: any): unknown {
	if (!jsonld) return {};

	const model: any = {
		id: jsonld['@id']?.split('/').pop() || 'imported',
		assets: { characters: [], environments: {} },
		timeline: { events: [], duration: 10000 },
		config: {
			id: jsonld['@id']?.split('/').pop() || 'imported',
			title: jsonld.name || 'Imported Timeline',
			description: jsonld.description || ''
		}
	};

	// Parse events from hasPart
	if (Array.isArray(jsonld.hasPart)) {
		model.timeline.events = jsonld.hasPart
			.filter((part: any) => part['@type'] === 'Action')
			.map((action: any, idx: number) => ({
				id: action['@id']?.split('/').pop() || `evt_${idx}`,
				time: parseISO8601Duration(action.startTime) || idx * 1000,
				label: action.name || `Event ${idx}`,
				description: action.description || '',
				assets: Array.isArray(action.object)
					? action.object.map((obj: any) => ({
							asset_id: obj['@id'] || obj.name || '',
							variant: obj['latent:variant']
						}))
					: [],
				comfyui_settings: {
					enabled: action['latent:comfyui']?.enabled || false,
					custom_positive: action['latent:comfyui']?.positivePrompt,
					custom_negative: action['latent:comfyui']?.negativePrompt
				}
			}));
	}

	// Parse assets from mentions
	if (jsonld.mentions?.containsPlace) {
		jsonld.mentions.containsPlace.forEach((place: any) => {
			if (place['@type'] === 'Person') {
				model.assets.characters.push({
					id: place['@id']?.split('/').pop() || place.identifier || place.name,
					name: place.name || '',
					voice_id: place['latent:voiceId'],
					outfits: place['latent:outfits']
						? Object.fromEntries(
								place['latent:outfits'].map((outfit: any) => [
									outfit.name,
									{ prompt: outfit.description || '' }
								])
							)
						: {}
				});
			} else if (place['@type'] === 'Place') {
				const envId = place['@id']?.split('/').pop() || place.name;
				model.assets.environments[envId] = {
					prompt: place.description || '',
					ref: place['latent:referenceImage']
				};
			}
		});
	}

	return model;
}

/**
 * Parse ISO 8601 duration (e.g., "PT5S", "PT1M30S") to milliseconds.
 */
function parseISO8601Duration(duration: string): number | null {
	if (!duration || typeof duration !== 'string') return null;

	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
	if (!match) return null;

	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseFloat(match[3] || '0');

	return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
