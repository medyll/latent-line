<script lang="ts">
	/**
	 * SystemFooter.svelte
	 *
	 * @component SystemFooter
	 * @description Technical configuration controls and model import/export.
	 *              Reads and mutates model.config via MODEL_STORE_KEY context.
	 *              Export validates via modelSchema.safeParse() before download.
	 *              Import reads a .json file, validates, and replaces the model in-place.
	 * @example <SystemFooter />
	 */
	import { getContext } from 'svelte';
	import type { Model } from '$lib/model/model-types';
	import { MODEL_STORE_KEY } from '$lib/context/keys';
	import { serializeModel, deserializeModel } from '$lib/utils/export-import';

	const themeCtx = getContext<{ current: 'light' | 'dark'; toggle: () => void }>('theme');

	const SAMPLERS = ['Euler', 'DPM++', 'DDIM', 'PLMS', 'UniPC'];
	const TTS_ENGINES = ['Coqui', 'Google', 'ElevenLabs', 'Bark'];

	const model = getContext<Model>(MODEL_STORE_KEY);

	import { createModelParam } from '$lib/utils/share';

	let exportErrors = $state<string[]>([]);
	let importErrors = $state<string[]>([]);
	let fileInput: HTMLInputElement | undefined = $state();
	let shareMessage: string = $state('');

	/**
	 * Validates model via Zod then downloads as model.json.
	 * Shows inline errors if validation fails.
	 */
	function exportModel() {
		exportErrors = [];
		const result = serializeModel(model);
		if (!result.success) {
			exportErrors = result.errors;
			return;
		}
		const blob = new Blob([result.json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'model.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Loads a model.json file, validates, and replaces the current model in-place.
	 */
	async function handleImport(e: Event) {
		importErrors = [];
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const text = await file.text();
		const result = deserializeModel(text);
		if (!result.success) {
			importErrors = result.errors;
		} else {
			const imported = result.data;
			// Mutate in-place so existing context references remain valid
			Object.assign(model.project, imported.project);
			model.assets.characters = imported.assets.characters;
			model.assets.environments = imported.assets.environments;
			model.assets.audio = imported.assets.audio;
			model.timeline = imported.timeline;
			model.config = imported.config;
		}
		// Reset file input so the same file can be re-imported
		if (fileInput) fileInput.value = '';
	}

	function randomSeed() {
		model.config.seed = Math.floor(Math.random() * 1_000_000);
	}
</script>

<!--
  SystemFooter Component
  Config controls (checkpoint, sampler, seed, TTS) wired to model.config.
  Export validates model via Zod. Import loads and validates model.json.
-->
<div class="flex flex-col gap-1 border-t bg-white px-4 py-2" aria-label="System Footer">
	<div class="flex flex-wrap items-center gap-4">
		<!-- Checkpoint -->
		<div class="flex items-center gap-2">
			<label for="checkpoint-select" class="text-xs">Checkpoint</label>
			<input
				id="checkpoint-select"
				type="text"
				value={model.config.checkpoint ?? ''}
				oninput={(e) =>
					(model.config.checkpoint = (e.target as HTMLInputElement).value || undefined)}
				placeholder="e.g. v1-5-pruned"
				class="w-36 rounded border border-gray-200 px-2 py-0.5 text-xs"
				aria-label="AI checkpoint"
			/>
		</div>

		<!-- Sampler -->
		<div class="flex items-center gap-2">
			<label for="sampler-select" class="text-xs">Sampler</label>
			<select
				id="sampler-select"
				value={model.config.sampler ?? ''}
				onchange={(e) =>
					(model.config.sampler = (e.target as HTMLSelectElement).value || undefined)}
				class="rounded border border-gray-200 px-2 py-0.5 text-xs"
				aria-label="Sampler"
			>
				<option value="">— none —</option>
				{#each SAMPLERS as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>

		<!-- Seed -->
		<div class="flex items-center gap-2">
			<label for="seed-input" class="text-xs">Seed</label>
			<input
				id="seed-input"
				type="number"
				min="0"
				max="999999"
				value={model.config.seed ?? ''}
				oninput={(e) => {
					const v = parseInt((e.target as HTMLInputElement).value, 10);
					model.config.seed = isNaN(v) ? undefined : v;
				}}
				placeholder="random"
				class="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs"
				aria-label="Seed"
			/>
			<button
				onclick={randomSeed}
				title="Random seed"
				aria-label="Randomize seed"
				class="h-6 px-2 text-xs"
			>
				⟳
			</button>
		</div>

		<!-- TTS Engine -->
		<div class="flex items-center gap-2">
			<label for="tts-select" class="text-xs">TTS</label>
			<select
				id="tts-select"
				value={model.config.tts_engine ?? ''}
				onchange={(e) =>
					(model.config.tts_engine = (e.target as HTMLSelectElement).value || undefined)}
				class="rounded border border-gray-200 px-2 py-0.5 text-xs"
				aria-label="TTS engine"
			>
				<option value="">— none —</option>
				{#each TTS_ENGINES as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</div>

		<div class="ml-auto flex items-center gap-2">
			<!-- Theme toggle -->
			<button
				onclick={() => themeCtx?.toggle()}
				title="Toggle theme"
				aria-label="Toggle light/dark theme"
				class="text-xs">{themeCtx?.current === 'dark' ? '☀ Light' : '☾ Dark'}</button
			>
			<!-- Import -->
			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				onchange={handleImport}
				class="hidden"
				id="import-file"
				aria-label="Import model JSON"
			/>
			<button onclick={() => fileInput?.click()} class="text-xs"> Import JSON </button>

			<!-- Export -->
			<button onclick={exportModel} aria-label="Export JSON" class="text-xs"> Export JSON </button>

			<!-- Share (permalink) -->
			<button
				onclick={async () => {
					shareMessage = '';
					const res = createModelParam(model);
					if (!res.success) {
						shareMessage = res.errors.join('; ');
						return;
					}
					const url = new URL(window.location.href);
					url.searchParams.set('m', res.param);
					try {
						await navigator.clipboard.writeText(url.toString());
						shareMessage = 'Copied link to clipboard';
						setTimeout(() => (shareMessage = ''), 3000);
					} catch (e) {
						// fallback: open prompt
						shareMessage = url.toString();
					}
				}}
				aria-label="Share permalink"
				class="text-xs"
			>
				Share
			</button>
		</div>

		{#if shareMessage}
			<div class="ml-2 text-xs text-gray-600">{shareMessage}</div>
		{/if}
	</div>

	<!-- Validation errors -->
	{#if exportErrors.length > 0}
		<div class="rounded bg-red-50 p-2 text-xs text-red-700" role="alert" aria-live="polite">
			<strong>Export blocked — validation errors:</strong>
			<ul class="mt-1 list-disc pl-4">
				{#each exportErrors as err}
					<li>{err}</li>
				{/each}
			</ul>
		</div>
	{/if}
	{#if importErrors.length > 0}
		<div class="rounded bg-red-50 p-2 text-xs text-red-700" role="alert" aria-live="polite">
			<strong>Import failed — validation errors:</strong>
			<ul class="mt-1 list-disc pl-4">
				{#each importErrors as err}
					<li>{err}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
