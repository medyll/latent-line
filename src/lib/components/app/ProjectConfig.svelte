<script lang="ts">
	import { getContext } from 'svelte';
	import { MODEL_STORE_KEY } from '$lib/context/keys';
	import type { Model } from '$lib/model/model-types';
	import { focusTrap } from '$lib/actions/focus-trap';

	let { onclose }: { onclose: () => void } = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	const RESOLUTION_PRESETS: Record<string, { w: number; h: number }> = {
		'720p': { w: 1280, h: 720 },
		'1080p': { w: 1920, h: 1080 },
		Square: { w: 1024, h: 1024 },
		'4K': { w: 3840, h: 2160 },
		Custom: { w: 0, h: 0 }
	};

	function resolutionLabel(): string {
		for (const [label, res] of Object.entries(RESOLUTION_PRESETS)) {
			if (
				label !== 'Custom' &&
				res.w === model.project.resolution.w &&
				res.h === model.project.resolution.h
			) {
				return label;
			}
		}
		return 'Custom';
	}

	let selectedPreset = $state(resolutionLabel());

	function applyPreset(label: string) {
		selectedPreset = label;
		if (label !== 'Custom') {
			const res = RESOLUTION_PRESETS[label];
			model.project.resolution.w = res.w;
			model.project.resolution.h = res.h;
		}
	}

	let fpsError = $derived(
		model.project.fps < 1 || model.project.fps > 120 ? 'FPS doit être entre 1 et 120' : ''
	);
	let resError = $derived(
		model.project.resolution.w <= 0 || model.project.resolution.h <= 0
			? 'Résolution doit être > 0'
			: ''
	);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose}>
	<div
		class="panel card"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Configuration projet"
		aria-modal="true"
		tabindex="-1"
		use:focusTrap={{ onEscape: onclose }}
	>
		<header class="panel-header">
			<span>Configuration projet</span>
			<button onclick={onclose} title="Fermer" class="close-btn">✕</button>
		</header>

		<div class="panel-body">
			<label class="field">
				<span class="label">Nom du projet</span>
				<input type="text" bind:value={model.project.name} />
			</label>

			<label class="field">
				<span class="label">FPS</span>
				<div class="input-group">
					<input
						type="number"
						min="1"
						max="120"
						bind:value={model.project.fps}
						class:error={!!fpsError}
					/>
					{#if fpsError}<span class="error-msg">{fpsError}</span>{/if}
				</div>
			</label>

			<label class="field">
				<span class="label">Résolution</span>
				<select
					onchange={(e) => applyPreset((e.target as HTMLSelectElement).value)}
					value={selectedPreset}
				>
					{#each Object.keys(RESOLUTION_PRESETS) as label}
						<option value={label}>{label}</option>
					{/each}
				</select>
			</label>

			{#if selectedPreset === 'Custom'}
				<div class="field">
					<span class="label">Largeur × Hauteur</span>
					<div class="res-inputs">
						<input
							type="number"
							min="1"
							bind:value={model.project.resolution.w}
							class:error={!!resError}
							placeholder="w"
						/>
						<span>×</span>
						<input
							type="number"
							min="1"
							bind:value={model.project.resolution.h}
							class:error={!!resError}
							placeholder="h"
						/>
					</div>
				</div>
				{#if resError}<span class="error-msg full">{resError}</span>{/if}
			{/if}

			<div class="field info">
				<span class="label">Durée totale</span>
				<span>{model.timeline.length} événement(s)</span>
			</div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.panel {
		width: 360px;
		max-width: 95vw;
		display: flex;
		flex-direction: column;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-bottom: var(--border-width) solid var(--color-border);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.panel-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
	}
	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: var(--text-xs);
	}
	.label {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}
	.res-inputs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.res-inputs input {
		width: 64px;
	}
	input.error,
	select.error {
		border-color: var(--color-danger, red);
	}
	.error-msg {
		color: var(--color-danger, red);
		font-size: var(--text-xs);
	}
	.error-msg.full {
		padding: 0 0.75rem;
	}
	.info span:last-child {
		color: var(--color-text-muted);
	}
	.input-group {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
	}
</style>
