import type { PageServerLoad } from './$types';
import type { Model } from '$lib/model/model-types';

/**
 * Loads the presentation from the `model` query parameter, a base64-encoded model,
 * with `index` as the starting slide.
 *
 * A missing or undecodable model is returned as an `error` for the page to show,
 * rather than thrown.
 */
export const load: PageServerLoad = async ({ url }) => {
	const modelBase64 = url.searchParams.get('model');
	const startIndex = url.searchParams.get('index');

	let model: Model | null = null;
	let error: string | null = null;

	if (!modelBase64) {
		error = 'No model provided. Use /present?model=<base64-encoded-model>';
		return { model, error, startIndex: 0 };
	}

	try {
		// Decode base64 string
		const modelJson = Buffer.from(modelBase64, 'base64').toString('utf-8');
		model = JSON.parse(modelJson);
	} catch (err) {
		error = `Failed to decode model: ${err instanceof Error ? err.message : 'Unknown error'}`;
		return { model, error, startIndex: 0 };
	}

	return {
		model,
		error,
		startIndex: startIndex ? parseInt(startIndex, 10) : 0
	};
};
