<script lang="ts">
	/**
	 * ModelInspector.svelte
	 *
	 * @component ModelInspector
	 * @description Allows inspection, validation, and switching between example/template models.
	 *              Shows project, assets, timeline, and raw JSON.
	 *              Validation displays per-field Zod issues in a readable list.
	 * @example <ModelInspector />
	 */
				import { getContext } from 'svelte';
	import { modelSchema } from '$lib/model/model-template';
	import type { Model } from '$lib/model/model-types';
	import { MODEL_STORE_KEY } from '$lib/context/keys';

	let { onclose }: { onclose?: () => void } = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	interface ValidationResult {
		ok: boolean;
		message: string;
		issues: string[];
	}

	let validation = $state<ValidationResult | null>(null);

	function validate() {
		const r = modelSchema.safeParse(model);
		if (r.success) {
			validation = { ok: true, message: 'Valid model.', issues: [] };
		} else {
			validation = {
				ok: false,
				message: `${r.error.issues.length} validation error(s)`,
				issues: r.error.issues
					.slice(0, 10)
					.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`)
			};
		}
	}
</script>

<!--
  ModelInspector Component
  Switch between example/template models, validate with Zod, and inspect model structure.
-->
<!-- Inspector overlay -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="inspector-overlay"
	role="dialog"
	aria-label="Model Inspector"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && onclose?.()}
>
	<div class="inspector-panel">
		<header class="card-header">
			<h3 class="card-title">Model Inspector</h3>
			<div class="flex items-center gap-2">
				<button onclick={validate} class="text-xs">Validate</button>
				{#if onclose}
					<button onclick={onclose} aria-label="Close inspector" class="text-xs">✕</button>
				{/if}
			</div>
		</header>

		<div class="inspector-body">
			<!-- Validation result -->
			{#if validation}
				<div
					class="validation-result {validation.ok ? 'ok' : 'fail'}"
					aria-live="polite"
				>
					<strong>{validation.ok ? '✓ Valid' : '✗ Invalid'}</strong>: {validation.message}
					{#if !validation.ok && validation.issues.length > 0}
						<ul class="list-disc pl-5 text-xs mt-1">
							{#each validation.issues as issue}
								<li>{issue}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			<!-- Project -->
			<section>
				<header class="card-header"><h4 class="card-title">Project</h4></header>
				<div class="p-2 text-xs">
					<div><strong>Name:</strong> {model.project.name}</div>
					<div><strong>FPS:</strong> {model.project.fps}</div>
					<div><strong>Resolution:</strong> {model.project.resolution.w}×{model.project.resolution.h}</div>
				</div>
			</section>

			<!-- Assets -->
			<section>
				<header class="card-header"><h4 class="card-title">Assets</h4></header>
				<div class="p-2 text-xs">
					<div><strong>Characters:</strong> {model.assets.characters.length}</div>
					<div><strong>Environments:</strong> {Object.keys(model.assets.environments).join(', ') || '—'}</div>
					<div><strong>Audio tracks:</strong> {model.assets.audio.length}</div>
				</div>
			</section>

			<!-- Timeline -->
			<section>
				<header class="card-header"><h4 class="card-title">Timeline ({model.timeline.length} events)</h4></header>
				<div class="p-2 text-xs">
					{#if model.timeline.length > 0}
						<ul class="list-disc pl-4">
							{#each [...model.timeline].sort((a,b) => a.time - b.time) as ev (ev.time)}
								<li>frame {ev.time} — {ev.frame.actors?.length ?? 0} actor(s)</li>
							{/each}
						</ul>
					{:else}
						<span class="text-gray-400">No events</span>
					{/if}
				</div>
			</section>

			<!-- Raw JSON -->
			<section>
				<header class="card-header"><h4 class="card-title">Raw JSON</h4></header>
				<div class="p-2">
					<pre class="inspector-json">{JSON.stringify(model, null, 2)}</pre>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.inspector-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: color-mix(in srgb, var(--color-text) 30%, transparent);
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 0.5rem;
	}
	.inspector-panel {
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-md);
		width: clamp(320px, 35vw, 520px);
		height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
	}
	.inspector-body {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.validation-result {
		margin: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
	}
	.validation-result.ok   { background: color-mix(in srgb, #10b981 12%, transparent); color: #065f46; }
	.validation-result.fail { background: color-mix(in srgb, var(--color-critical) 10%, transparent); color: var(--color-critical); }
	.inspector-json {
		font-family: var(--font-mono);
		font-size: 10px;
		overflow: auto;
		max-height: 220px;
		background: var(--color-surface-2);
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		white-space: pre;
	}
</style>
