<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { X, Clock, Trash2, RotateCcw, Settings } from '@lucide/svelte';
	import {
		getHistory,
		restoreVersion,
		deleteVersion,
		clearHistory,
		timeAgo,
		hasRecovery,
		type VersionEntry
	} from '$lib/utils/version-history';
	import type { Model } from '$lib/model/model-types';

	interface Props {
		open?: boolean;
		onClose?: () => void;
		onRestore?: (model: Model) => void;
	}

	let { open = false, onClose, onRestore }: Props = $props();
	const dispatch = createEventDispatcher<{ close: void; restore: Model }>();

	// State
	let history = $state<VersionEntry[]>([]);
	let autoSaveInterval = $state(300); // seconds (5 minutes)

	// Load history on open
	$effect(() => {
		if (open) {
			history = getHistory();
			// Load auto-save interval
			const stored = localStorage.getItem('latent-line:autosave-interval');
			if (stored) {
				autoSaveInterval = parseInt(stored);
			}
		}
	});

	function handleClose() {
		dispatch('close');
		onClose?.();
	}

	function handleRestore(index: number) {
		const model = restoreVersion(index);
		if (model) {
			dispatch('restore', model);
			onRestore?.(model);
			handleClose();
		}
	}

	function handleDelete(index: number) {
		deleteVersion(index);
		history = getHistory();
	}

	function handleClearAll() {
		if (confirm('Clear all version history? This cannot be undone.')) {
			clearHistory();
			history = [];
		}
	}

	function handleIntervalChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		autoSaveInterval = parseInt(value);
		localStorage.setItem('latent-line:autosave-interval', value);
	}
</script>

{#if open}
	<div class="history-overlay" onclick={handleClose}>
		<div class="history-panel" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="panel-header">
				<h3>Version History</h3>
				<button class="icon-btn" onclick={handleClose}>
					<X size={18} />
				</button>
			</div>

			<!-- Auto-Save Settings -->
			<div class="settings-section">
				<div class="setting-row">
					<Settings size={16} />
					<span>Auto-save interval</span>
					<select value={autoSaveInterval} onchange={handleIntervalChange}>
						<option value="30">30 seconds</option>
						<option value="60">1 minute</option>
						<option value="300">5 minutes</option>
						<option value="600">10 minutes</option>
					</select>
				</div>
			</div>

			<!-- Recovery Notice -->
			{#if hasRecovery()}
				<div class="recovery-notice">
					<RotateCcw size={16} />
					<span>{history.length} version{history.length > 1 ? 's' : ''} available for recovery</span>
				</div>
			{/if}

			<!-- Version List -->
			<div class="version-list">
				{#if history.length === 0}
					<div class="empty-state">
						<Clock size={32} />
						<p>No version history yet</p>
						<span class="hint">Versions are saved automatically</span>
					</div>
				{:else}
					{#each history as version, index}
						<div class="version-entry">
							<div class="version-info">
								<div class="version-date">
									{new Date(version.date).toLocaleDateString()}
								</div>
								<div class="version-time">
									{new Date(version.date).toLocaleTimeString()}
								</div>
								<div class="version-ago">
									{timeAgo(version.timestamp)}
								</div>
								{#if version.label}
									<div class="version-label">{version.label}</div>
								{/if}
							</div>
							<div class="version-actions">
								<button
									class="btn btn-sm btn-primary"
									onclick={() => handleRestore(index)}
								>
									Restore
								</button>
								<button
									class="btn btn-sm btn-danger"
									onclick={() => handleDelete(index)}
								>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					{/each}

					<div class="clear-all">
						<button class="btn btn-danger" onclick={handleClearAll}>
							<Trash2 size={16} />
							Clear All History
						</button>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="panel-footer">
				<button class="btn btn-secondary" onclick={handleClose}>Close</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.history-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: grid;
		place-items: center;
		animation: fadeIn 0.2s ease;
	}

	.history-panel {
		background: var(--color-surface);
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 16px;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		color: var(--color-text-muted);
		border-radius: 4px;
	}

	.icon-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.settings-section {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.setting-row {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--color-text-muted);
		font-size: 13px;
	}

	.setting-row select {
		margin-left: auto;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.recovery-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--color-success-alpha);
		color: var(--color-success);
		font-size: 13px;
	}

	.version-list {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		color: var(--color-text-muted);
		text-align: center;
	}

	.empty-state .hint {
		font-size: 12px;
		margin-top: 8px;
	}

	.version-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		margin-bottom: 8px;
		background: var(--color-surface-2);
	}

	.version-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.version-date {
		font-weight: 600;
		font-size: 13px;
	}

	.version-time {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.version-ago {
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.version-label {
		font-size: 11px;
		color: var(--color-primary);
		margin-top: 4px;
	}

	.version-actions {
		display: flex;
		gap: 8px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 12px;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-danger {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}

	.btn-secondary {
		background: var(--color-surface-2);
	}

	.clear-all {
		margin-top: 16px;
		text-align: center;
	}

	.panel-footer {
		display: flex;
		justify-content: flex-end;
		padding: 16px;
		border-top: 1px solid var(--color-border);
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
