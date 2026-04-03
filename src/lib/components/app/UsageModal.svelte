<script lang="ts">
	/**
	 * UsageModal.svelte
	 * Shows where an asset is used in the timeline.
	 */

	import type { UsageLocation } from '$lib/utils/asset-usage';

	let {
		assetName,
		assetType,
		usageLocations,
		onNavigate,
		onClose
	}: {
		assetName: string;
		assetType: 'character' | 'environment' | 'audio';
		usageLocations: UsageLocation[];
		onNavigate: (time: number) => void;
		onClose: () => void;
	} = $props();

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function getContextLabel(context: string): string {
		switch (context) {
			case 'actor':
				return 'Actor';
			case 'background':
				return 'Background';
			case 'audio_track':
				return 'Audio Track';
			case 'reference':
				return 'Reference';
			default:
				return context;
		}
	}
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="usage-modal-title">
	<div class="modal-content">
		<h2 id="usage-modal-title">Usage: {assetName}</h2>
		<p class="modal-subtitle">
			{usageLocations.length} usage{usageLocations.length !== 1 ? 's' : ''} in timeline
		</p>

		{#if usageLocations.length === 0}
			<div class="empty-usage">
				<p>This asset is not used in any timeline event.</p>
			</div>
		{:else}
			<ul class="usage-list" role="list">
				{#each usageLocations as location (location.eventTime)}
					<li class="usage-item" role="listitem">
						<button
							class="usage-time"
							onclick={() => onNavigate(location.eventTime)}
							aria-label="Navigate to {formatTime(location.eventTime)}"
						>
							{formatTime(location.eventTime)}
						</button>
						<span class="usage-context">{getContextLabel(location.context)}</span>
						{#if location.detail}
							<span class="usage-detail">({location.detail})</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		<div class="modal-actions">
			<button onclick={onClose}>Close</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 150ms ease;
	}

	.modal-content {
		background-color: var(--color-surface-2);
		border-radius: 8px;
		padding: 24px;
		width: 100%;
		max-width: 480px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
		animation: slideUp 200ms ease;
	}

	h2 {
		margin: 0 0 8px;
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
	}

	.modal-subtitle {
		margin: 0 0 16px;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.empty-usage {
		padding: 24px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	.usage-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.usage-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background-color: var(--color-surface-3);
		border-radius: 4px;
		font-size: 13px;
	}

	.usage-time {
		padding: 4px 8px;
		font-size: 12px;
		font-weight: 500;
		font-family: monospace;
		background-color: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
		color: var(--color-primary);
		transition: background-color 150ms ease;
	}

	.usage-time:hover {
		background-color: var(--color-surface-hover);
	}

	.usage-context {
		font-weight: 500;
		color: var(--color-text);
	}

	.usage-detail {
		color: var(--color-text-muted);
		font-size: 12px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 20px;
	}

	button {
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background-color: var(--color-surface-2);
		color: var(--color-text);
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	button:hover {
		background-color: var(--color-surface-3);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
