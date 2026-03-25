import { serializeModel, deserializeModel } from './export-import';
import type { ImportResult, ExportResult } from './export-import';

/**
 * Encode a JSON string to base64 safe for URLs (handles UTF-8)
 */
function utf8ToB64(str: string) {
	if (typeof window !== 'undefined' && (window as any).btoa) {
		return btoa(unescape(encodeURIComponent(str)));
	}
	// Node fallback
	return Buffer.from(str, 'utf-8').toString('base64');
}

function b64ToUtf8(b64: string) {
	if (typeof window !== 'undefined' && (window as any).atob) {
		return decodeURIComponent(escape(atob(b64)));
	}
	// Node fallback
	return Buffer.from(b64, 'base64').toString('utf-8');
}

export function createModelParam(
	model: unknown
): { success: true; param: string } | { success: false; errors: string[] } {
	const serialized = serializeModel(model);
	if (!serialized.success) return { success: false, errors: serialized.errors };
	const b64 = utf8ToB64(serialized.json);
	// Use compact base64 in query param
	return { success: true, param: b64 };
}

export function parseModelParam(param: string): ImportResult {
	try {
		const json = b64ToUtf8(param);
		return deserializeModel(json);
	} catch (err) {
		return { success: false, errors: ['Failed to decode model parameter.'] };
	}
}
