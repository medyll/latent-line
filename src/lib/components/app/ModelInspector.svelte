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
				import exampleModel from '$lib/model/model-example';
	import { modelTemplate, modelSchema } from '$lib/model/model-template';
	import type { Model } from '$lib/model/model-types';

	interface ValidationResult {
		ok: boolean;
		message: string;
		issues: string[];
	}

	let selected = $state<Model>(exampleModel);
	let validation = $state<ValidationResult | null>(null);

	function validate(m: Model) {
		const r = modelSchema.safeParse(m);
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

	function useExample() {
		selected = exampleModel;
		validation = null;
	}

	function useTemplate() {
		selected = modelTemplate;
		validation = null;
	}
</script>

<!--
  ModelInspector Component
  Switch between example/template models, validate with Zod, and inspect model structure.
-->
<div class="flex max-w-2xl flex-col gap-6" style="color:var(--color-foreground)">
	<!-- Controls -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Model Inspector</h3>
		</header>
		<div class="card-content">
			<div class="mb-4 flex gap-2">
				<button onclick={useExample}>Use example model</button>
				<button onclick={useTemplate}>Use template model</button>
				<button onclick={() => validate(selected)} class="ml-auto">Validate</button>
			</div>

			{#if validation}
				<div
					class={`mb-2 rounded-md p-3 text-sm ${validation.ok ? 'bg-lime-100 text-lime-800' : 'bg-red-100 text-red-800'}`}
					aria-live="polite"
				>
					<strong>{validation.ok ? 'OK' : 'INVALID'}</strong>: {validation.message}
					{#if !validation.ok && validation.issues.length > 0}
						<ul class="mt-2 list-disc pl-5 text-xs">
							{#each validation.issues as issue}
								<li>{issue}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>
	</section>

	<!-- Project Info -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Project</h3>
		</header>
		<div class="card-content">
			<div class="text-sm">
				<div><strong>Name:</strong> {selected.project.name}</div>
				<div><strong>FPS:</strong> {selected.project.fps}</div>
				<div>
					<strong>Resolution:</strong>
					{selected.project.resolution.w}×{selected.project.resolution.h}
				</div>
			</div>
		</div>
	</section>

	<!-- Assets Info -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Assets</h3>
		</header>
		<div class="card-content">
			<div class="text-sm">
				<div><strong>Characters:</strong> {selected.assets.characters.length}</div>
				<div>
					<strong>Environments:</strong>
					{Object.keys(selected.assets.environments).join(', ')}
				</div>
				<div><strong>Audio tracks:</strong> {selected.assets.audio.length}</div>
			</div>
		</div>
	</section>

	<!-- Timeline Info -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Timeline</h3>
		</header>
		<div class="card-content">
			<div class="text-sm">
				<div><strong>Events:</strong> {selected.timeline.length}</div>
				{#if selected.timeline.length > 0}
					<ul class="mt-2 list-disc pl-5">
						{#each selected.timeline as ev (ev.time)}
							<li>time: {ev.time} — actors: {ev.frame.actors ? ev.frame.actors.length : 0}</li>
						{/each}
					</ul>
				{:else}
					<div class="empty-state"><p>No events</p><small>The timeline is empty.</small></div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Raw JSON View -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Raw JSON</h3>
		</header>
		<div class="card-content">
			<pre class="max-h-60 overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(
					selected,
					null,
					2
				)}</pre>
		</div>
	</section>
</div>
