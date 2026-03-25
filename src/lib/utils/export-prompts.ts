import type { Model, TimelineEvent } from '$lib/model/model-types';

export interface PromptEntry {
	frame: number;
	prompt: string;
	negative_prompt: string;
	seed?: number;
	steps: number;
}

/** Build a single prompt string from a timeline event. */
export function buildPrompt(event: TimelineEvent, model: Model): string {
	const actor = event.frame.actors?.[0];
	const charName = actor
		? (model.assets.characters.find((c) => c.id === actor.id)?.name ?? actor.id)
		: null;
	const parts: string[] = [];
	if (charName) parts.push(charName);
	if (actor?.action) parts.push(actor.action);
	if (actor?.speech?.mood) parts.push(`${actor.speech.mood} mood`);
	const envKey = Object.keys(model.assets.environments)[0];
	if (envKey) parts.push(model.assets.environments[envKey].prompt);
	if (event.frame.lighting?.type) parts.push(event.frame.lighting.type);
	if (event.frame.fx?.bloom) parts.push(`bloom ${event.frame.fx.bloom}`);
	return parts.join(', ') || 'scene';
}

/** One prompt per line: `{frame}: {prompt}` */
export function exportToPromptsTxt(model: Model): string {
	return [...model.timeline]
		.sort((a, b) => a.time - b.time)
		.map((ev) => `${ev.time}: ${buildPrompt(ev, model)}`)
		.join('\n');
}

/** Array of structured prompt objects. */
export function exportToPromptsJson(model: Model, includeNegative = true): PromptEntry[] {
	return [...model.timeline]
		.sort((a, b) => a.time - b.time)
		.map((ev) => ({
			frame: ev.time,
			prompt: buildPrompt(ev, model),
			negative_prompt: includeNegative ? 'blur, watermark, low quality, distorted' : '',
			seed: model.config.seed,
			steps: 20
		}));
}

/** Deforum-style keyframe dict: `{"0": "prompt", "24": "prompt"}` */
export function exportToDeforumFormat(model: Model): string {
	const entries = [...model.timeline]
		.sort((a, b) => a.time - b.time)
		.map((ev) => `  "${ev.time}": "${buildPrompt(ev, model).replace(/"/g, '\\"')}"`)
		.join(',\n');
	return `{\n${entries}\n}`;
}
