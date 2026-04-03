<script lang="ts">
	/**
	 * UsageBadge.svelte
	 * Displays asset usage count on asset cards.
	 */

	let {
		count = 0,
		isUnused = false
	}: {
		count?: number;
		isUnused?: boolean;
	} = $props();
</script>

<span
	class="usage-badge"
	class:unused={isUnused}
	aria-label="{count} usage{count !== 1 ? 's' : ''}"
>
	{#if isUnused}
		<span class="badge-icon">○</span>
		<span class="badge-text">Unused</span>
	{:else if count > 0}
		<span class="badge-icon">●</span>
		<span class="badge-text">{count}</span>
	{/if}
</span>

<style>
	.usage-badge {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 6px;
		font-size: 10px;
		font-weight: 500;
		border-radius: 10px;
		background-color: var(--color-surface-3);
		color: var(--color-text-muted);
		transition: all 150ms ease;
	}

	.badge-icon {
		font-size: 8px;
		line-height: 1;
	}

	.badge-text {
		line-height: 1;
	}

	.usage-badge:not(.unused) {
		background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
		color: var(--color-primary);
	}

	.usage-badge.unused {
		background-color: color-mix(in srgb, var(--color-text-muted) 10%, transparent);
		color: var(--color-text-muted);
		opacity: 0.7;
	}
</style>
