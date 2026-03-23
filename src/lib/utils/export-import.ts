import { modelSchema } from '$lib/model/model-template';
import type { Model } from '$lib/model/model-types';

export type ExportResult =
	| { success: true; json: string }
	| { success: false; errors: string[] };

export type ImportResult =
	| { success: true; data: Model }
	| { success: false; errors: string[] };

function formatIssues(issues: { path: (string | number)[]; message: string }[]): string[] {
	return issues
		.slice(0, 8)
		.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`);
}

export function serializeModel(model: unknown): ExportResult {
	const result = modelSchema.safeParse(model);
	if (!result.success) {
		return { success: false, errors: formatIssues(result.error.issues) };
	}
	return { success: true, json: JSON.stringify(result.data, null, 2) };
}

export function deserializeModel(text: string): ImportResult {
	try {
		const raw = JSON.parse(text);
		const result = modelSchema.safeParse(raw);
		if (!result.success) {
			return { success: false, errors: formatIssues(result.error.issues) };
		}
		return { success: true, data: result.data as Model };
	} catch {
		return { success: false, errors: ['Invalid JSON file.'] };
	}
}
