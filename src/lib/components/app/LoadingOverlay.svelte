<script lang="ts">
	/**
	 * LoadingOverlay.svelte
	 * Full-screen or container-relative loading overlay with spinner.
	 */

	let {
		message = 'Loading...',
		progress = undefined
	}: {
		message?: string;
		progress?: number;
	} = $props();

	let visible = $state(true);
</script>

{#if visible}
	<div class="loading-overlay" role="status" aria-live="polite" aria-label={message}>
		<div class="spinner" aria-hidden="true"></div>
		<p class="loading-message">{message}</p>
		{#if progress !== undefined}
			<div class="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<span class="progress-text">{Math.round(progress)}%</span>
		{/if}
	</div>
{/if}

<style>
	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background-color: rgba(255, 255, 255, 0.8);
		z-index: 100;
		animation: fadeIn 200ms ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-message {
		font-size: 14px;
		color: var(--color-text-muted);
		margin: 0;
	}

	.progress-bar {
		width: 200px;
		height: 6px;
		background-color: var(--color-surface-3);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: var(--color-primary);
		transition: width 300ms ease;
	}

	.progress-text {
		font-size: 12px;
		color: var(--color-text-muted);
	}
</style>
