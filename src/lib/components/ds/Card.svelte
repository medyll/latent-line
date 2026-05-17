<!-- Card.svelte — Shot/storyboard card with rich metadata -->
<script lang="ts">
	import Badge from './Badge.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		frame: number;
		start: number;
		end: number;
		character?: { initials: string; name: string; color: string };
		dialogue?: string;
		mood?: { label: string; icon: string; color: string };
		action?: string;
		aiGenerated?: boolean;
		selected?: boolean;
		imageUrl?: string;
		onselect?: () => void;
		onedit?: () => void;
	}

	let {
		frame,
		start,
		end,
		character,
		dialogue,
		mood,
		action,
		aiGenerated = false,
		selected = false,
		imageUrl,
		onselect,
		onedit
	}: Props = $props();

	const _duration = $derived(end - start);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="shot-card"
	class:selected
	onclick={onselect}
	ondblclick={onedit}
	role="button"
	tabindex="0"
>
	<!-- AI glow strip -->
	{#if aiGenerated}
		<div class="ai-strip"></div>
	{/if}

	<!-- Header: frame number + AI badge -->
	<div class="shot-header">
		<span class="frame-number">Frame {frame}</span>
		{#if aiGenerated}
			<Badge variant="ai" label="AI" />
		{/if}
	</div>

	<!-- Image or placeholder -->
	<div class="shot-image">
		{#if imageUrl}
			<img src={imageUrl} alt="Frame {frame}" loading="lazy" />
		{:else}
			<div class="shot-placeholder">
				<Icon name="image" size={24} />
				<span class="ratio-label">16:9</span>
			</div>
		{/if}
	</div>

	<!-- Meta strip -->
	<div class="shot-meta">
		{#if character}
			<Badge
				variant="character"
				label={character.initials}
				color={character.color}
				title={character.name}
			/>
		{/if}
		{#if mood}
			<Badge variant="mood" label={mood.label} icon={mood.icon} color={mood.color} />
		{/if}
	</div>

	<!-- Content -->
	{#if dialogue}
		<p class="shot-dialogue">"{dialogue}"</p>
	{/if}
	{#if action}
		<p class="shot-action">{action}</p>
	{/if}
</div>

<style>
	.shot-card {
		position: relative;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		animation: cardEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
	}

	@keyframes cardEnter {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.shot-card:hover {
		border-color: var(--border2);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px oklch(from var(--fg) h s l / 0.08);
	}

	.shot-card.selected {
		border-color: var(--accent2);
		box-shadow:
			0 0 0 1px var(--accent2),
			0 0 12px oklch(from var(--accent2) h s l / 0.2);
		transform: translateY(-1px);
	}

	.ai-strip {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 0 1px oklch(from var(--accent2) h s l / 0.5),
			inset 0 0 20px oklch(from var(--accent2) h s l / 0.08);
		z-index: 1;
	}

	.shot-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.375rem 0.5rem;
		gap: 0.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface2);
	}

	.frame-number {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.shot-image {
		aspect-ratio: 16 / 9;
		background: var(--surface2);
		overflow: hidden;
		flex-shrink: 0;
	}

	.shot-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.shot-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		color: var(--text-muted);
		opacity: 0.6;
	}

	.ratio-label {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		color: var(--text-muted);
	}

	.shot-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-top: 1px solid var(--border);
		background: var(--surface2);
		flex-wrap: wrap;
	}

	.shot-dialogue {
		margin: 0;
		padding: 0.5rem;
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--text);
		font-style: italic;
		border-top: 1px solid var(--border);
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.shot-action {
		margin: 0;
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		line-height: 1.4;
		color: var(--text-dim);
		border-top: 1px solid var(--border);
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
