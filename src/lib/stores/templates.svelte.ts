import { onMount } from 'svelte';
import type { TimelineFrame } from '$lib/model/model-types';

const TEMPLATES_KEY = 'latent-line:templates';

export interface EventTemplate {
	id: string;
	name: string;
	frame: TimelineFrame;
	createdAt: number;
}

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

export type TemplatesStore = ReturnType<typeof createTemplatesStore>;
