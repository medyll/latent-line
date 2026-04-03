<script lang="ts">
	/**
	 * Skeleton.svelte
	 * Loading placeholder with shimmer animation.
	 */

	let {
		variant = 'line',
		width = '100%',
		height = undefined,
		size = undefined
	}: {
		variant?: 'card' | 'line' | 'circle' | 'text';
		width?: string;
		height?: string;
		size?: string;
	} = $props();

	const circleSize = $derived(size ?? '40px');
	const lineHeight = $derived(height ?? '16px');
</script>

{#if variant === 'card'}
	<div class="skeleton-card" aria-busy="true" aria-label="Loading">
		<div class="skeleton-circle"></div>
		<div class="skeleton-line"></div>
		<div class="skeleton-line short"></div>
	</div>
{:else if variant === 'circle'}
	<div
		class="skeleton-circle"
		style="width: {circleSize}; height: {circleSize}"
		aria-busy="true"
		aria-label="Loading"
	></div>
{:else if variant === 'text'}
	<div class="skeleton-text" style="height: {lineHeight}" aria-busy="true" aria-label="Loading"></div>
{:else}
	<div
		class="skeleton-line"
		style="width: {width}; height: {lineHeight}"
		aria-busy="true"
		aria-label="Loading"
	></div>
{/if}

<style>
	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.skeleton-line,
	.skeleton-circle,
	.skeleton-text {
		background: linear-gradient(
			90deg,
			var(--color-surface-3) 25%,
			var(--color-surface-hover) 50%,
			var(--color-surface-3) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
		border-radius: 4px;
	}

	.skeleton-line {
		height: 16px;
		width: 100%;
	}

	.skeleton-line.short {
		width: 60%;
	}

	.skeleton-circle {
		border-radius: 50%;
	}

	.skeleton-text {
		height: 16px;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
	}
</style>
