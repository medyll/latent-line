import { onMount } from 'svelte';
import type { TimelineFrame } from '$lib/model/model-types';

const TEMPLATES_KEY = 'latent-line:templates';

/** A saved frame the user can stamp onto the timeline. */
export interface EventTemplate {
	id: string;
	name: string;
	frame: TimelineFrame;
	createdAt: number;
}

/** Templates store, persisted in local storage. Saved frames are deep-copied, so
 *  editing the source event does not alter the template. */
export function createTemplatesStore() {
	let templates = $state<EventTemplate[]>([]);

	onMount(() => {
		try {
			const raw = localStorage.getItem(TEMPLATES_KEY);
			if (raw) templates = JSON.parse(raw);
		} catch {
			/* ignore */
		}
	});

	$effect(() => {
		const snapshot = JSON.stringify(templates);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(TEMPLATES_KEY, snapshot);
		}
	});

	function saveTemplate(name: string, frame: TimelineFrame) {
		templates.push({
			id: `tpl_${Date.now()}`,
			name: name.trim() || 'Template',
			frame: structuredClone(frame),
			createdAt: Date.now()
		});
	}

	function deleteTemplate(id: string) {
		templates = templates.filter((t) => t.id !== id);
	}

	return { templates, saveTemplate, deleteTemplate };
}

/** The shape {@link createTemplatesStore} returns. */
export type TemplatesStore = ReturnType<typeof createTemplatesStore>;
