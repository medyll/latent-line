import type { Model } from '$lib/model/model-types';

/**
 * deleteEventFromModel
 * - In normal mode, prompts confirm() before deleting.
 * - In test mode (globalThis.__TEST__ === true) the confirm is bypassed.
 */
export function deleteEventFromModel(model: Model, time: number): boolean {
	const isTest = (globalThis as any).__TEST__ === true;
	if (!isTest) {
		// Use globalThis.confirm so tests can mock it in Node environment
		const confirmed = (globalThis as any).confirm
			? (globalThis as any).confirm(`Delete event at frame ${time}?`)
			: true;
		if (!confirmed) return false;
	}
	model.timeline = model.timeline.filter((ev: any) => ev.time !== time);
	return true;
}
