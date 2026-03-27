import { json, type RequestHandler } from '@sveltejs/kit';
import { modelSchema } from '$lib/model/model-template';
import { exportAsYAML } from '$lib/utils/export-yaml';
import { exportAsJSONLD } from '$lib/utils/export-jsonld';
import { exportToCSV } from '$lib/utils/export-csv';

export type ExportRequest = {
	model: unknown;
	options?: {
		pretty?: boolean;
		includeMetadata?: boolean;
	};
};

export type ExportResponse = {
	format: string;
	content: string | object;
	mimeType: string;
	filename: string;
};

export type ErrorResponse = {
	error: string;
	details?: unknown;
	code: string;
};

/**
 * POST /api/export
 * Export timeline model in specified format
 *
 * Query params:
 *   - format: yaml | jsonld | csv | storyboard | framepack (default: yaml)
 *   - pretty: true | false (for JSON formats, default: true)
 *
 * Request body:
 *   {
 *     "model": { ... model object ... },
 *     "options": { "pretty": true }
 *   }
 *
 * Response:
 *   {
 *     "format": "yaml",
 *     "content": "# YAML content...",
 *     "mimeType": "application/x-yaml",
 *     "filename": "timeline.yaml"
 *   }
 */
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Get format from query param
		const format = url.searchParams.get('format') || 'yaml';
		const pretty = url.searchParams.get('pretty') !== 'false';

		// Parse request body
		const body = await request.json();
		const { model, options } = body as ExportRequest;

		if (!model) {
			return json(
				{
					error: 'Missing required field: model',
					code: 'MISSING_MODEL'
				} as ErrorResponse,
				{ status: 400 }
			);
		}

		// Validate model against schema
		const validated = modelSchema.safeParse(model);
		if (!validated.success) {
			return json(
				{
					error: 'Invalid model schema',
					details: validated.error.issues,
					code: 'INVALID_MODEL'
				} as ErrorResponse,
				{ status: 422 }
			);
		}

		const validatedModel = validated.data;
		let content: string | object;
		let mimeType: string;
		let fileExtension: string;

		// Export based on format
		switch (format.toLowerCase()) {
			case 'yaml': {
				content = exportAsYAML(validatedModel);
				mimeType = 'application/x-yaml';
				fileExtension = 'yaml';
				break;
			}

			case 'jsonld': {
				content = exportAsJSONLD(validatedModel);
				if (pretty) {
					content = JSON.stringify(content, null, 2);
				}
				mimeType = 'application/ld+json';
				fileExtension = 'jsonld';
				break;
			}

			case 'csv': {
				content = exportToCSV(validatedModel);
				mimeType = 'text/csv';
				fileExtension = 'csv';
				break;
			}

			case 'json': {
				content = validatedModel;
				if (typeof content !== 'string') {
					content = JSON.stringify(content, null, pretty ? 2 : 0);
				}
				mimeType = 'application/json';
				fileExtension = 'json';
				break;
			}

			default: {
				return json(
					{
						error: `Unsupported export format: ${format}`,
						details: { supportedFormats: ['yaml', 'jsonld', 'csv', 'json'] },
						code: 'UNSUPPORTED_FORMAT'
					} as ErrorResponse,
					{ status: 400 }
				);
			}
		}

		const filename = `timeline-${Date.now()}.${fileExtension}`;

		return json({
			format,
			content,
			mimeType,
			filename
		} as ExportResponse);
	} catch (error) {
		console.error('[export API] error:', error);

		return json(
			{
				error: 'Export failed',
				details: error instanceof Error ? error.message : String(error),
				code: 'EXPORT_ERROR'
			} as ErrorResponse,
			{ status: 500 }
		);
	}
};
