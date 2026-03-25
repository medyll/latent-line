<script lang="ts">
	let {
		icon = '📭',
		title,
		description,
		action,
		onaction
	}: {
		icon?: string;
		title: string;
		description?: string;
		action?: string;
		onaction?: () => void;
	} = $props();
</script>

<div class="empty-state-container" aria-label={title}>
	<span class="empty-icon" aria-hidden="true">{icon}</span>
	<p class="empty-title">{title}</p>
	{#if description}
		<p class="empty-description">{description}</p>
	{/if}
	{#if action && onaction}
		<button class="empty-action" onclick={onaction}>{action} →</button>
	{/if}
</div>

<style>
	.empty-state-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 1.5rem 1rem;
		text-align: center;
		color: var(--color-text-muted);
	}
	.empty-icon {
		font-size: 1.75rem;
		line-height: 1;
	}
	.empty-title {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text);
		margin: 0;
	}
	.empty-description {
		font-size: var(--text-xs);
		margin: 0;
	}
	.empty-action {
		font-size: var(--text-xs);
		color: var(--color-primary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		text-decoration: underline;
	}
	.empty-action:hover {
		opacity: 0.8;
	}
</style>
