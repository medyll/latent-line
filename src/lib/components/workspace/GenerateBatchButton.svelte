<script lang="ts">
	import { type Model } from '$lib/model/model-types';
	import type { Preferences } from '$lib/stores/preferences.svelte';
	import { isGenerating, generationStats } from '$lib/stores/generation.svelte';
	import { batchGenerate } from '$lib/utils/batch-generate';
	import { toast } from '$lib/stores/toast.svelte';

	interface Props {
		model: Model;
		prefs: Preferences;
	}

	let { model, prefs }: Props = $props();

	let isBatching = $state(false);

	let stats = $derived.by(() => {
		let s = { total: 0, done: 0, error: 0, generating: 0 };
		generationStats.subscribe((value) => {
			s = value;
		})();
		return s;
	});

	async function handleBatchGenerate() {
		if (!prefs.comfyui?.enabled || !prefs.comfyui?.url) {
			toast.error('❌ ComfyUI not configured. Go to settings.');
			return;
		}

		const eventsWithPrompts = model.timeline.filter((e) => e.frame.prompt?.trim());
		if (eventsWithPrompts.length === 0) {
			toast.error('❌ No events with prompts to generate');
			return;
		}

		isBatching = true;
		try {
			await batchGenerate(eventsWithPrompts, prefs, { rateLimit: 2000 });
			toast.success(`✓ Batch generation started (${eventsWithPrompts.length} events)`);
		} catch (err) {
			const error = err instanceof Error ? err.message : String(err);
			toast.error(`❌ Batch generation failed: ${error}`);
		} finally {
			isBatching = false;
		}
	}
</script>

<div class="batch-controls">
	<button
		onclick={handleBatchGenerate}
		disabled={isBatching || $isGenerating || !prefs.comfyui?.enabled}
		class="btn-batch-generate"
		title="Generate all events with prompts sequentially with rate limiting"
	>
		{isBatching ? '⏳ Generating...' : '🚀 Generate All'}
	</button>

	{#if stats.total > 0}
		<div class="stats">
			<span title="Total events">📊 {stats.done}/{stats.total}</span>
			{#if stats.error > 0}
				<span title="Failed generations" class="error">❌ {stats.error}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.batch-controls {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.btn-batch-generate {
		padding: 6px 12px;
		border: 1px solid var(--color-primary, #007bff);
		border-radius: 4px;
		background: var(--color-primary, #007bff);
		color: white;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		transition: opacity 0.2s;
		white-space: nowrap;
	}

	.btn-batch-generate:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-batch-generate:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.stats {
		display: flex;
		gap: 8px;
		font-size: 12px;
		color: var(--color-text-secondary);
	}

	.stats .error {
		color: #f44336;
	}
</style>
