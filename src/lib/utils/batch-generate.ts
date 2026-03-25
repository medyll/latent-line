/**
 * batch-generate.ts
 *
 * Utilities for batch image generation with rate limiting and progress tracking.
 */

import { generation } from '$lib/stores/generation.svelte';
import { AIBackend, type GenerationRequest } from '$lib/services/ai-backend';
import type { Preferences } from '$lib/stores/preferences.svelte';
import type { TimelineEvent } from '$lib/model/model-types';

export interface BatchGenerationOptions {
	rateLimit?: number; // Milliseconds between requests (default: 2000)
	timeout?: number; // Request timeout in ms (default: 300000)
}

export async function batchGenerate(
	events: TimelineEvent[],
	prefs: Preferences,
	options: BatchGenerationOptions = {}
) {
	const { rateLimit = 2000, timeout = 300000 } = options;

	if (!prefs.comfyui?.enabled || !prefs.comfyui?.url) {
		throw new Error('ComfyUI not configured');
	}

	const config = {
		backend: prefs.comfyui.backend,
		url: prefs.comfyui.url,
		api_key: prefs.comfyui.api_key,
		timeout
	};

	const aiBackend = new AIBackend(config);
	const eventsToGenerate = events.filter((e) => e.frame.prompt?.trim());

	for (let i = 0; i < eventsToGenerate.length; i++) {
		const event = eventsToGenerate[i];
		const eventId = String(event.time);

		generation.start(eventId);

		try {
			const request: GenerationRequest = {
				prompt: event.frame.prompt || '',
				negative_prompt: '',
				seed: -1,
				steps: 20,
				cfg_scale: 7.5,
				width: 512,
				height: 512
			};

			const result = await aiBackend.generate(request);

			if (result.image_base64) {
				generation.complete(eventId, result.image_base64);
			} else if (result.image_url) {
				// Fallback to URL-based image
				const response = await fetch(result.image_url);
				const blob = await response.blob();
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = reader.result?.toString().split(',')[1];
					if (base64) {
						generation.complete(eventId, base64);
					}
				};
				reader.readAsDataURL(blob);
			}
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			generation.error(eventId, error);
		}

		// Rate limiting: wait before next request (except for last item)
		if (i < eventsToGenerate.length - 1) {
			await new Promise((resolve) => setTimeout(resolve, rateLimit));
		}
	}
}
