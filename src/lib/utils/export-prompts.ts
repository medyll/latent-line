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

export interface DeforumOptions {
	negative_prompt?: string;
	seed?: number;
	steps?: number;
	cfg_scale?: number;
}

/** Full Deforum format with prompts, negative_prompts, and options. */
export function exportToDeforumFormat(model: Model, options: DeforumOptions = {}): string {
	const sortedEvents = [...model.timeline].sort((a, b) => a.time - b.time);

	// Ensure frame 0 exists (required by Deforum)
	const hasFrame0 = sortedEvents.some(ev => ev.time === 0);
	if (!hasFrame0 && sortedEvents.length > 0) {
		sortedEvents.unshift({
			time: 0,
			duration: sortedEvents[0]?.duration ?? 24,
			frame: sortedEvents[0]?.frame ?? {}
		});
	}

	const prompts: Record<string, string> = {};
	const negativePrompts: Record<string, string> = {};

	sortedEvents.forEach((ev) => {
		const prompt = buildPrompt(ev, model).replace(/"/g, '\\"');
		prompts[String(ev.time)] = prompt;
		negativePrompts[String(ev.time)] = options.negative_prompt ?? 'blur, watermark, low quality, distorted';
	});

	// Generate morphing prompts for interpolated frames
	for (let i = 0; i < sortedEvents.length - 1; i++) {
		const current = sortedEvents[i];
		const next = sortedEvents[i + 1];
		const gap = next.time - current.time;

		// Only add morphing frames if gap > 1
		if (gap > 1) {
			const step = Math.ceil(gap / 4); // Create intermediate frames
			for (let f = current.time + step; f < next.time; f += step) {
				// Morphing prompt hints that transition between frames
				const morphPrompt = `${buildPrompt(current, model)}, morphing transition`.replace(/"/g, '\\"');
				prompts[String(f)] = morphPrompt;
				negativePrompts[String(f)] = options.negative_prompt ?? 'blur, watermark, low quality, distorted';
			}
		}
	}

	// Build full Deforum JSON
	const deforumObj = {
		prompts,
		negative_prompts: negativePrompts,
		...(options.seed !== undefined && { seed: options.seed }),
		...(options.steps !== undefined && { steps: options.steps }),
		...(options.cfg_scale !== undefined && { cfg_scale: options.cfg_scale })
	};

	return JSON.stringify(deforumObj, null, 2);
}
