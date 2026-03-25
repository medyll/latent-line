<script lang="ts">
	let {
		label,
		character,
		mood,
		action,
		hasSpeech,
		hasAudio,
		hasFX,
		x,
		y
	}: {
		label: string;
		character?: string;
		mood?: string;
		action?: string;
		hasSpeech?: boolean;
		hasAudio?: boolean;
		hasFX?: boolean;
		x: number;
		y: number;
	} = $props();

	// Clamp to viewport
	const LEFT_OFFSET = 12;
	const TOP_OFFSET = -8;
</script>

<div
	class="event-tooltip"
	role="tooltip"
	style="left: {x + LEFT_OFFSET}px; top: {y + TOP_OFFSET}px;"
>
	<div class="tooltip-title">{label}</div>
	{#if character}<div class="tooltip-row">👤 {character}</div>{/if}
	{#if mood}<div class="tooltip-row">🎭 {mood}</div>{/if}
	{#if action}<div class="tooltip-row">
			⚡ {action.slice(0, 80)}{action.length > 80 ? '…' : ''}
		</div>{/if}
	<div class="tooltip-icons">
		{#if hasSpeech}<span title="Speech">💬</span>{/if}
		{#if hasAudio}<span title="Audio">🎵</span>{/if}
		{#if hasFX}<span title="FX">✨</span>{/if}
	</div>
</div>

<style>
	.event-tooltip {
		position: fixed;
		z-index: 999;
		background: var(--color-surface-3, #1e1e2e);
		color: var(--color-text, #cdd6f4);
		border: var(--border-width, 1px) solid var(--color-border, #45475a);
		border-radius: var(--radius-sm, 4px);
		padding: 0.4rem 0.6rem;
		font-size: var(--text-xs, 11px);
		pointer-events: none;
		white-space: nowrap;
		box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
		max-width: 240px;
	}
	.tooltip-title {
		font-weight: 600;
		margin-bottom: 0.2rem;
		color: var(--color-text-accent, #cba6f7);
	}
	.tooltip-row {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 220px;
		opacity: 0.85;
	}
	.tooltip-icons {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.2rem;
	}
</style>
