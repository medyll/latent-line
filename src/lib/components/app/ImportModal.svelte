<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { parseImportFile, validateImportFile, mergeModels, getModelSummary } from '$lib/utils/import-parser';
	import type { Model } from '$lib/model/model-types';
	import { X, Upload, AlertCircle, CheckCircle, FileJson, Replace, GitMerge } from '@lucide/svelte';

	interface Props {
		open: boolean;
		currentModel?: Model;
	}

	let { open = false, currentModel }: Props = $props();
	const dispatch = createEventDispatcher<{
		close: void;
		import: { model: Model; mode: 'replace' | 'merge' };
	}>();

	let fileContent = $state('');
	let fileName = $state('');
	let parseResult = $state<{ success: boolean; model?: Model; error?: string; details?: string[] } | null>(null);
	let importMode = $state<'replace' | 'merge'>('replace');
	let isDragging = $state(false);

	// Reset state when modal opens/closes
	$effect(() => {
		if (!open) {
			fileContent = '';
			fileName = '';
			parseResult = null;
			importMode = 'replace';
		}
	});

	function handleClose() {
		dispatch('close');
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			readFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) {
			readFile(file);
		}
	}

	function readFile(file: File) {
		fileName = file.name;
		const fileType = file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? 'yaml' : 'json';
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			fileContent = content;
			parseImport(content, fileType);
		};
		reader.readAsText(file);
	}

	function parseImport(content: string, fileType: 'json' | 'yaml') {
		// For now, only support JSON (YAML parsing needs proper library)
		if (fileType === 'yaml') {
			parseResult = {
				success: false,
				error: 'YAML import not yet supported',
				details: ['Please use JSON format for importing']
			};
			return;
		}

		try {
			const raw = JSON.parse(content);
			const result = parseImportFile(content, 'json');
			
			if (result.success) {
				parseResult = {
					success: true,
					model: result.model
				};
			} else {
				parseResult = {
					success: false,
					error: result.error,
					details: result.details
				};
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Invalid JSON syntax';
			parseResult = {
				success: false,
				error: 'Invalid JSON syntax',
				details: [message]
			};
		}
	}

	function handleImport() {
		if (!parseResult?.success || !parseResult.model) return;

		let finalModel = parseResult.model;

		if (importMode === 'merge' && currentModel) {
			finalModel = mergeModels(currentModel, parseResult.model);
		}

		dispatch('import', { model: finalModel, mode: importMode });
		handleClose();
	}

	function getSummary() {
		if (!parseResult?.model) return null;
		return getModelSummary(parseResult.model);
	}
</script>

{#if open}
	<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="import-modal-title" class="modal-title">Import Timeline</h2>
				<button class="modal-close" onclick={handleClose} aria-label="Close">
					<X size={20} />
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<!-- File Upload -->
				<div
					class="file-dropzone {isDragging ? 'dragging' : ''}"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<Upload size={48} class="dropzone-icon" />
					<p class="dropzone-text">
						Drag and drop a JSON file here, or
						<label class="file-link">
							browse
							<input
								type="file"
								accept=".json,.yaml,.yml"
								hidden
								onchange={handleFileSelect}
							/>
						</label>
					</p>
					<p class="dropzone-hint">Supports .json files (YAML coming soon)</p>
				</div>

				{#if fileName}
					<div class="file-info">
						<FileJson size={16} />
						<span>{fileName}</span>
					</div>
				{/if}

				<!-- Parse Results -->
				{#if parseResult}
					<div class="parse-result {parseResult.success ? 'success' : 'error'}">
						{#if parseResult.success}
							<CheckCircle size={20} class="result-icon" />
							<span>File parsed successfully</span>
						{:else}
							<AlertCircle size={20} class="result-icon" />
							<span>{parseResult.error}</span>
						{/if}
					</div>

					{#if parseResult.details}
						<ul class="error-list">
							{#each parseResult.details as detail}
								<li>{detail}</li>
							{/each}
						</ul>
					{/if}
				{/if}

				<!-- Preview -->
				{#if parseResult?.success}
					{@const summary = getSummary()}
					<div class="preview-panel">
						<h3 class="preview-title">Import Preview</h3>
						<dl class="preview-grid">
							<dt>Project</dt>
							<dd>{summary?.projectName}</dd>

							<dt>Resolution</dt>
							<dd>{summary?.resolution} @ {summary?.fps}fps</dd>

							<dt>Assets</dt>
							<dd>
								{summary?.characterCount} characters,
								{summary?.environmentCount} environments,
								{summary?.audioCount} audio
							</dd>

							<dt>Timeline</dt>
							<dd>{summary?.eventCount} events ({Math.round((summary?.totalDuration || 0) / 1000)}s)</dd>
						</dl>
					</div>

					<!-- Import Mode -->
					{#if currentModel}
						<div class="import-mode">
							<h3 class="mode-title">Import Mode</h3>
							
							<label class="mode-option">
								<input
									type="radio"
									name="import-mode"
									value="replace"
									bind:group={importMode}
								/>
								<div class="mode-card">
									<Replace size={20} />
									<div class="mode-info">
										<span class="mode-name">Replace</span>
										<span class="mode-desc">Clear current timeline, load imported file</span>
									</div>
								</div>
							</label>

							<label class="mode-option">
								<input
									type="radio"
									name="import-mode"
									value="merge"
									bind:group={importMode}
								/>
								<div class="mode-card">
									<GitMerge size={20} />
									<div class="mode-info">
										<span class="mode-name">Merge</span>
										<span class="mode-desc">Append events, merge assets (auto-rename duplicates)</span>
									</div>
								</div>
							</label>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={handleClose}>
					Cancel
				</button>
				<button
					class="btn btn-primary"
					disabled={!parseResult?.success}
					onclick={handleImport}
				>
					{importMode === 'replace' ? 'Import (Replace)' : 'Import (Merge)'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: grid;
		place-items: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	.modal-content {
		background: var(--color-surface);
		border-radius: 12px;
		width: 90%;
		max-width: 560px;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid var(--color-border);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		color: var(--color-text);
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.modal-close:hover {
		opacity: 1;
		background: var(--color-surface-2);
	}

	.modal-body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.file-dropzone {
		border: 2px dashed var(--color-border);
		border-radius: 12px;
		padding: 40px 24px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.file-dropzone.dragging {
		border-color: var(--color-primary);
		background: var(--color-primary-alpha);
	}

	.dropzone-icon {
		color: var(--color-text-muted);
		margin-bottom: 12px;
	}

	.dropzone-text {
		margin: 0 0 8px;
		color: var(--color-text);
	}

	.file-link {
		color: var(--color-primary);
		cursor: pointer;
		text-decoration: underline;
	}

	.dropzone-hint {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		background: var(--color-surface-2);
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.parse-result {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.parse-result.success {
		background: var(--color-success-alpha);
		color: var(--color-success);
	}

	.parse-result.error {
		background: var(--color-error-alpha);
		color: var(--color-error);
	}

	.result-icon {
		flex-shrink: 0;
	}

	.error-list {
		margin: 0;
		padding-left: 24px;
		font-size: 0.875rem;
		color: var(--color-error);
	}

	.preview-panel {
		background: var(--color-surface-2);
		border-radius: 8px;
		padding: 16px;
	}

	.preview-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.preview-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 8px 16px;
		margin: 0;
		font-size: 0.875rem;
	}

	.preview-grid dt {
		color: var(--color-text-muted);
	}

	.preview-grid dd {
		margin: 0;
	}

	.import-mode {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mode-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.mode-option {
		display: block;
		cursor: pointer;
	}

	.mode-option input[type="radio"] {
		display: none;
	}

	.mode-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border: 2px solid var(--color-border);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.mode-option:has(input:checked) .mode-card {
		border-color: var(--color-primary);
		background: var(--color-primary-alpha);
	}

	.mode-card :global(svg) {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.mode-option:has(input:checked) .mode-card :global(svg) {
		color: var(--color-primary);
	}

	.mode-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.mode-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.mode-desc {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px 24px;
		border-top: 1px solid var(--color-border);
	}

	.btn {
		padding: 10px 20px;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: var(--color-surface-3);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-dark);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
