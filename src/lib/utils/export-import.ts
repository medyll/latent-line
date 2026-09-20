import { modelSchema } from '$lib/model/model-template';
import type { Model } from '$lib/model/model-types';

/** Serialization outcome: the JSON, or the validation problems that stopped it. */
export type ExportResult = { success: true; json: string } | { success: false; errors: string[] };

/** Parse outcome: the validated model, or the problems that stopped it. */
export type ImportResult = { success: true; data: Model } | { success: false; errors: string[] };

function formatIssues(issues: { path: PropertyKey[]; message: string }[]): string[] {
	return issues
		.slice(0, 8)
		.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`);
}

/** Validates a model and renders it as indented JSON. Reports at most 8 issues. */
export function serializeModel(model: unknown): ExportResult {
	const result = modelSchema.safeParse(model);
	if (!result.success) {
		return { success: false, errors: formatIssues(result.error.issues) };
	}
	return { success: true, json: JSON.stringify(result.data, null, 2) };
}

/** Parses JSON text and validates it as a model. Reports at most 8 issues. */
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
