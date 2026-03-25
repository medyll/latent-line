<script lang="ts">
	import { type Preferences } from '$lib/stores/preferences.svelte';
	import { generation, type EventGenerationState } from '$lib/stores/generation.svelte';
	import { generatedImages } from '$lib/stores/generated-images.svelte';
	import { AIBackend, type GenerationRequest } from '$lib/services/ai-backend';
	import { toast } from '$lib/stores/toast.svelte';

	interface Props {
		eventId: string;
		prompt: string;
		prefs: Preferences;
	}

	let { eventId, prompt, prefs }: Props = $props();

	let currentState = $state<EventGenerationState>({ event_id: eventId, status: 'idle' });

	$effect(() => {
		const unsubscribe = generation.subscribe((map) => {
			currentState = map.get(eventId) ?? { event_id: eventId, status: 'idle' };
		});
		return unsubscribe;
	});

	let state = $derived(currentState);

	let generatedImage = $state<string | undefined>();

	$effect(async () => {
		if (state.image_base64) {
			generatedImage = `data:image/png;base64,${state.image_base64}`;
			try {
				await generatedImages.save({
					event_id: eventId,
					image_base64: state.image_base64,
					generated_at: Date.now(),
					metadata: state as any
				});
			} catch (err) {
				console.error('Failed to save image to IndexedDB:', err);
			}
		}
	});

	async function handleGenerate() {
		if (!prefs.comfyui?.enabled || !prefs.comfyui?.url) {
			toast.error('❌ ComfyUI not configured. Go to settings.');
			return;
		}

		if (!prompt || !prompt.trim()) {
			toast.error('❌ No prompt to generate from');
			return;
		}

		generation.start(eventId);

		try {
			const config = {
				backend: prefs.comfyui.backend,
				url: prefs.comfyui.url,
				api_key: prefs.comfyui.api_key,
				timeout: 300000 // 5 minutes
			};

			const aiBackend = new AIBackend(config);
			const request: GenerationRequest = {
				prompt,
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
				toast.success('✓ Image generated successfully');
			} else if (result.image_url) {
				// Fallback to URL-based image
				const response = await fetch(result.image_url);
				const blob = await response.blob();
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = reader.result?.toString().split(',')[1];
					if (base64) {
						generation.complete(eventId, base64);
						toast.success('✓ Image generated successfully');
					}
				};
				reader.readAsDataURL(blob);
			}
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			generation.error(eventId, error);
			toast.error(`❌ Generation failed: ${error}`);
		}
	}

	function clearGeneration() {
		generation.clear(eventId);
		generatedImage = undefined;
	}
</script>

<div class="generate-panel">
	{#if state.status === 'idle'}
		<button onclick={handleGenerate} class="btn-generate" title="Generate image from prompt">
			🎨 Generate
		</button>
	{:else if state.status === 'queued' || state.status === 'generating'}
		<div class="generating">
			<div class="spinner"></div>
			<span>{state.status === 'queued' ? 'Queued...' : 'Generating...'}</span>
			{#if state.progress !== undefined}
				<div class="progress-bar">
					<div class="progress-fill" style={`width: ${state.progress}%`}></div>
				</div>
				<span class="progress-text">{Math.round(state.progress)}%</span>
			{/if}
		</div>
	{:else if state.status === 'done'}
		<div class="generated">
			{#if generatedImage}
				<img src={generatedImage} alt="Generated" class="generated-thumbnail" />
			{/if}
			<div class="generated-info">
				<span class="status-badge done">✓ Done</span>
				<button onclick={clearGeneration} class="btn-clear" title="Clear generated image">
					Clear
				</button>
			</div>
		</div>
	{:else if state.status === 'error'}
		<div class="error-panel">
			<span class="status-badge error">✗ Error</span>
			<p class="error-message">{state.error}</p>
			<button onclick={handleGenerate} class="btn-retry" title="Retry generation">
				🔄 Retry
			</button>
		</div>
	{/if}
</div>

<style>
	.generate-panel {
		padding: 12px 0;
		border-top: 1px solid var(--color-surface-3);
	}

	.btn-generate {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--color-surface-3);
		border-radius: 4px;
		background: var(--color-primary, #007bff);
		color: white;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.btn-generate:hover {
		opacity: 0.9;
	}

	.generating {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
		padding: 12px;
		background: var(--color-surface-1);
		border-radius: 4px;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-surface-3);
		border-top-color: var(--color-primary, #007bff);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: var(--color-surface-3);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary, #007bff);
		transition: width 0.1s;
	}

	.progress-text {
		font-size: 12px;
		color: var(--color-text-secondary);
	}

	.generated {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.generated-thumbnail {
		width: 100%;
		max-height: 200px;
		border-radius: 4px;
		object-fit: cover;
		background: var(--color-surface-1);
	}

	.generated-info {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-content: space-between;
	}

	.status-badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 3px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-badge.done {
		background: rgba(76, 175, 80, 0.1);
		color: #4caf50;
	}

	.status-badge.error {
		background: rgba(244, 67, 54, 0.1);
		color: #f44336;
	}

	.btn-clear,
	.btn-retry {
		padding: 4px 8px;
		border: 1px solid var(--color-surface-3);
		border-radius: 3px;
		background: var(--color-surface-1);
		color: var(--color-text);
		cursor: pointer;
		font-size: 12px;
	}

	.btn-clear:hover,
	.btn-retry:hover {
		background: var(--color-surface-2);
	}

	.error-panel {
		padding: 12px;
		background: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-message {
		margin: 0;
		font-size: 12px;
		color: var(--color-text-secondary);
		word-break: break-word;
	}

	.btn-retry {
		width: 100%;
	}
</style>
