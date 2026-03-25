<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { fly, fade } from 'svelte/transition';
</script>

<div class="toast-container" aria-live="polite" aria-label="Notifications">
	{#each toast.items as item (item.id)}
		<div
			class="toast toast-{item.type}"
			role="status"
			in:fly={{ y: 20, duration: 200 }}
			out:fade={{ duration: 150 }}
		>
			<span class="toast-icon">
				{#if item.type === 'success'}✓{:else if item.type === 'error'}✕{:else if item.type === 'warning'}⚠{:else}ℹ{/if}
			</span>
			<span class="toast-message">{item.message}</span>
			<button class="toast-close" onclick={() => toast.remove(item.id)} aria-label="Fermer"
				>✕</button
			>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: var(--z-toast, 600);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		box-shadow: var(--shadow-lg);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-border);
		pointer-events: all;
		max-width: 320px;
	}
	.toast-success {
		border-left: 3px solid var(--color-success);
	}
	.toast-error {
		border-left: 3px solid var(--color-critical);
	}
	.toast-warning {
		border-left: 3px solid var(--color-warning);
	}
	.toast-info {
		border-left: 3px solid var(--color-info);
	}
	.toast-icon {
		font-size: var(--text-xs);
		flex-shrink: 0;
	}
	.toast-message {
		flex: 1;
	}
	.toast-close {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		padding: 0;
		line-height: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		.toast {
			transition: none;
		}
	}
</style>
