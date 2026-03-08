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
	import { modelSchema } from '$lib/model/model-template';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	const SAMPLERS = ['Euler', 'DPM++', 'DDIM', 'PLMS', 'UniPC'];
	const TTS_ENGINES = ['Coqui', 'Google', 'ElevenLabs', 'Bark'];

	const model = getContext<Model>(MODEL_STORE_KEY);

	let exportErrors = $state<string[]>([]);
	let importErrors = $state<string[]>([]);
	let fileInput: HTMLInputElement | undefined = $state();

	/**
	 * Validates model via Zod then downloads as model.json.
	 * Shows inline errors if validation fails.
	 */
	function exportModel() {
		exportErrors = [];
		const result = modelSchema.safeParse(model);
		if (!result.success) {
			exportErrors = result.error.issues
				.slice(0, 8)
				.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`);
			return;
		}
		const data = JSON.stringify(result.data, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
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
		try {
			const text = await file.text();
			const raw = JSON.parse(text);
			const result = modelSchema.safeParse(raw);
			if (!result.success) {
				importErrors = result.error.issues
					.slice(0, 8)
					.map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`);
				return;
			}
			const imported = result.data;
			// Mutate in-place so existing context references remain valid
			Object.assign(model.project, imported.project);
			model.assets.characters = imported.assets.characters;
			model.assets.environments = imported.assets.environments;
			model.assets.audio = imported.assets.audio;
			model.timeline = imported.timeline;
			model.config = imported.config;
		} catch {
			importErrors = ['Invalid JSON file.'];
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
			<Label for="checkpoint-select" class="text-xs">Checkpoint</Label>
			<input
				id="checkpoint-select"
				type="text"
				value={model.config.checkpoint ?? ''}
				oninput={(e) => (model.config.checkpoint = (e.target as HTMLInputElement).value || undefined)}
				placeholder="e.g. v1-5-pruned"
				class="w-36 rounded border border-gray-200 px-2 py-0.5 text-xs"
				aria-label="AI checkpoint"
			/>
		</div>

		<!-- Sampler -->
		<div class="flex items-center gap-2">
			<Label for="sampler-select" class="text-xs">Sampler</Label>
			<select
				id="sampler-select"
				value={model.config.sampler ?? ''}
				onchange={(e) => (model.config.sampler = (e.target as HTMLSelectElement).value || undefined)}
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
			<Label for="seed-input" class="text-xs">Seed</Label>
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
			<Button variant="ghost" size="sm" onclick={randomSeed} title="Random seed" aria-label="Randomize seed" class="h-6 px-2 text-xs">
				⟳
			</Button>
		</div>

		<!-- TTS Engine -->
		<div class="flex items-center gap-2">
			<Label for="tts-select" class="text-xs">TTS</Label>
			<select
				id="tts-select"
				value={model.config.tts_engine ?? ''}
				onchange={(e) => (model.config.tts_engine = (e.target as HTMLSelectElement).value || undefined)}
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
			<Button variant="outline" size="sm" onclick={() => fileInput?.click()} class="text-xs">
				Import JSON
			</Button>

			<!-- Export -->
			<Button onclick={exportModel} size="sm" aria-label="Export JSON" class="text-xs">
				Export JSON
			</Button>
		</div>
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
