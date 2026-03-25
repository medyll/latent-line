<script lang="ts">
	let { status }: { status: 'saved' | 'unsaved' | 'saving' } = $props();
</script>

<span class="save-indicator" aria-live="polite" aria-label="Save status">
	{#if status === 'saved'}
		<span class="saved" title="All changes saved">✓ Saved</span>
	{:else if status === 'saving'}
		<span class="saving" title="Saving…">● Saving…</span>
	{:else}
		<span class="unsaved" title="Unsaved changes">● Unsaved</span>
	{/if}
</span>

<style>
	.save-indicator {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.saved {
		color: var(--color-success);
	}
	.saving {
		color: var(--color-warning);
	}
	.unsaved {
		color: var(--color-warning);
	}
</style>
