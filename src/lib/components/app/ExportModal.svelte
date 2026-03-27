<script lang="ts">
	import { getContext } from 'svelte';
	import { MODEL_STORE_KEY } from '$lib/context/keys';
	import type { Model } from '$lib/model/model-types';
	import { exportToCSV } from '$lib/utils/export-csv';
	import {
		exportToPromptsTxt,
		exportToPromptsJson,
		exportToDeforumFormat
	} from '$lib/utils/export-prompts';
	import { exportAsYAML } from '$lib/utils/export-yaml';
	import { exportAsJSONLD } from '$lib/utils/export-jsonld';
	import { generateStoryboardPDF } from '$lib/utils/export-pdf';
	import { buildZip } from '$lib/utils/export-zip';
	import { serializeModel } from '$lib/utils/export-import';
	import { downloadText, downloadBytes, todayStr } from '$lib/utils/download';
	import { focusTrap } from '$lib/actions/focus-trap';

	let { onclose }: { onclose: () => void } = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	type Format =
		| 'pdf'
		| 'csv'
		| 'prompts-txt'
		| 'prompts-json'
		| 'deforum'
		| 'zip'
		| 'yaml'
		| 'jsonld';
	let activeFormat = $state<Format>('prompts-txt');
	let includeNegative = $state(true);
	let copyFeedback = $state<string | null>(null);

	const slug = $derived(model.project.name.replace(/\s+/g, '_').toLowerCase());
	const date = $derived(todayStr());

	const preview = $derived<string>(() => {
		switch (activeFormat) {
			case 'csv':
				return exportToCSV(model).slice(0, 1200);
			case 'prompts-txt':
				return exportToPromptsTxt(model);
			case 'prompts-json':
				return JSON.stringify(exportToPromptsJson(model, includeNegative), null, 2).slice(0, 1200);
			case 'deforum':
				return exportToDeforumFormat(model);
			case 'yaml':
				return exportAsYAML(model).slice(0, 1200);
			case 'jsonld': {
				const jsonld = exportAsJSONLD(model);
				return JSON.stringify(jsonld, null, 2).slice(0, 1200);
			}
			case 'zip':
				return `ZIP will contain:\n• model.json\n• prompts.txt\n• prompts.json\n• events.csv\n• README.txt`;
			case 'pdf':
				return `Storyboard PDF\n${model.timeline.length} events\n${model.project.name} — ${date}\n\n(Opens browser print dialog)`;
			default:
				return '';
		}
	});

	async function doExport() {
		switch (activeFormat) {
			case 'pdf':
				generateStoryboardPDF(model);
				break;
			case 'csv':
				downloadText(exportToCSV(model), `${slug}-events-${date}.csv`, 'text/csv;charset=utf-8');
				break;
			case 'prompts-txt':
				downloadText(exportToPromptsTxt(model), `${slug}-prompts-${date}.txt`);
				break;
			case 'prompts-json':
				downloadText(
					JSON.stringify(exportToPromptsJson(model, includeNegative), null, 2),
					`${slug}-prompts-${date}.json`,
					'application/json'
				);
				break;
			case 'deforum':
				downloadText(
					exportToDeforumFormat(model),
					`${slug}-deforum-${date}.json`,
					'application/json'
				);
				break;
			case 'yaml':
				downloadText(exportAsYAML(model), `${slug}-${date}.yaml`, 'application/x-yaml');
				break;
			case 'jsonld':
				downloadText(
					JSON.stringify(exportAsJSONLD(model), null, 2),
					`${slug}-${date}.jsonld`,
					'application/ld+json'
				);
				break;
			case 'zip': {
				const modelJson = serializeModel(model);
				const modelStr = modelJson.success ? modelJson.json : JSON.stringify(model, null, 2);
				const readme = [
					`Project: ${model.project.name}`,
					`Date: ${date}`,
					`Events: ${model.timeline.length}`,
					`FPS: ${model.project.fps}`,
					`Resolution: ${model.project.resolution.w}×${model.project.resolution.h}`
				].join('\n');
				const zip = buildZip([
					{ name: 'model.json', content: modelStr },
					{ name: 'prompts.txt', content: exportToPromptsTxt(model) },
					{ name: 'prompts.json', content: JSON.stringify(exportToPromptsJson(model), null, 2) },
					{ name: 'events.csv', content: exportToCSV(model) },
					{ name: 'README.txt', content: readme }
				]);
				downloadBytes(zip, `${slug}-${date}.zip`, 'application/zip');
				break;
			}
		}
		onclose();
	}

	async function copyToClipboard() {
		try {
			let content = '';
			if (activeFormat === 'yaml') {
				content = exportAsYAML(model);
			} else if (activeFormat === 'jsonld') {
				content = JSON.stringify(exportAsJSONLD(model), null, 2);
			} else {
				return; // Only for these formats
			}

			await navigator.clipboard.writeText(content);
			copyFeedback = '✓ Copied!';
			setTimeout(() => {
				copyFeedback = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			copyFeedback = '✗ Failed';
			setTimeout(() => {
				copyFeedback = null;
			}, 2000);
		}
	}

	const FORMATS: { id: Format; label: string }[] = [
		{ id: 'pdf', label: '📄 PDF' },
		{ id: 'csv', label: '📊 CSV' },
		{ id: 'prompts-txt', label: '📝 Prompts TXT' },
		{ id: 'prompts-json', label: '🤖 Prompts JSON' },
		{ id: 'deforum', label: '🎞 Deforum' },
		{ id: 'yaml', label: '📋 YAML' },
		{ id: 'jsonld', label: '🔗 JSON-LD' },
		{ id: 'zip', label: '📦 ZIP' }
	];
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose}>
	<div
		class="modal card"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Export"
		aria-modal="true"
		tabindex="-1"
		use:focusTrap={{ onEscape: onclose }}
	>
		<header class="modal-header">
			<span>Exporter</span>
			<button onclick={onclose} class="close-btn">✕</button>
		</header>

		<div class="modal-body">
			<!-- Format selector -->
			<div class="format-tabs" role="tablist">
				{#each FORMATS as fmt}
					<button
						role="tab"
						aria-selected={activeFormat === fmt.id}
						class="fmt-tab {activeFormat === fmt.id ? 'active' : ''}"
						onclick={() => (activeFormat = fmt.id)}>{fmt.label}</button
					>
				{/each}
			</div>

			<!-- Options -->
			{#if activeFormat === 'prompts-json'}
				<label class="option-row">
					<input type="checkbox" bind:checked={includeNegative} />
					Inclure negative_prompt
				</label>
			{/if}

			<!-- Preview -->
			<div class="preview-box">
				<pre>{preview()}</pre>
			</div>
		</div>

		<footer class="modal-footer">
			<button onclick={onclose} class="btn-secondary">Annuler</button>
			{#if (activeFormat === 'yaml' || activeFormat === 'jsonld') && copyFeedback === null}
				<button onclick={copyToClipboard} class="btn-secondary" title="Copy to clipboard">
					📋 Copy
				</button>
			{/if}
			{#if copyFeedback}
				<span class="copy-feedback">{copyFeedback}</span>
			{/if}
			<button onclick={doExport} class="btn-primary">
				{activeFormat === 'pdf' ? '🖨 Imprimer / PDF' : '⬇ Télécharger'}
			</button>
		</footer>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal {
		width: 560px;
		max-width: 96vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-bottom: var(--border-width) solid var(--color-border);
		font-weight: 600;
		font-size: var(--text-sm);
		flex-shrink: 0;
	}
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
	}
	.modal-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: 0.75rem;
		gap: 0.5rem;
		overflow: hidden;
	}
	.format-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.fmt-tab {
		background: var(--color-surface-2);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 0.2rem 0.5rem;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.fmt-tab.active {
		background: var(--color-surface-3);
		color: var(--color-text);
		border-color: var(--color-accent, #7c3aed);
	}
	.option-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		cursor: pointer;
	}
	.preview-box {
		flex: 1;
		min-height: 0;
		overflow: auto;
		background: var(--color-surface-2);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.5rem;
	}
	.preview-box pre {
		font-family: monospace;
		font-size: var(--text-xs);
		white-space: pre-wrap;
		word-break: break-all;
		color: var(--color-text);
		margin: 0;
	}
	.modal-footer {
		padding: 0.5rem 0.75rem;
		border-top: var(--border-width) solid var(--color-border);
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		flex-shrink: 0;
		align-items: center;
	}
	.copy-feedback {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
</style>
