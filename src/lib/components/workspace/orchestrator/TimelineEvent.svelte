<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { SELECTION_STORE_KEY, PREFS_CONTEXT_KEY } from '$lib/context/keys';
	import { getMoodColor } from '$lib/model/mood-palette';
	import { generation } from '$lib/stores/generation.svelte';
	import { generatedImages } from '$lib/stores/generated-images.svelte';
	import GenerateButton from '$lib/components/workspace/GenerateButton.svelte';
	import type { Writable } from 'svelte/store';

	interface TimelineEventItem {
		id: string;
		label: string;
		start: number;
		end: number;
		speech?: string;
		mood?: string;
		action?: string;
		character?: string;
		prompt?: string;
		zoom?: number;
		fx?: { bloom?: number; motion_blur?: number };
		audio?: Array<{ id: string; volume: number }>;
		timelineFrame?: unknown;
	}

	let {
		item,
		isSelected = false,
		compact = false,
		onselect
	}: {
		item: TimelineEventItem;
		isSelected?: boolean;
		compact?: boolean;
		onselect?: (id: string) => void;
	} = $props();

	const selectionStore = getContext(SELECTION_STORE_KEY) as Writable<string | null> | undefined;
	const prefs = getContext<any>(PREFS_CONTEXT_KEY);

	let selectedLocal = $state(isSelected);
	let isHovered = $state(false);
	let thumbnailSrc = $state<string | undefined>();

	if (selectionStore) {
		selectionStore.subscribe((id) => {
			selectedLocal = id === item.id;
		});
	}

	$effect(() => {
		if (!selectionStore) selectedLocal = isSelected;
	});

	// Load persisted image from IndexedDB on mount
	onMount(async () => {
		const saved = await generatedImages.get(item.id);
		if (saved?.image_base64) {
			thumbnailSrc = `data:image/png;base64,${saved.image_base64}`;
		}
	});

	// React to live generation completing
	$effect(() => {
		const unsubscribe = generation.subscribe((map) => {
			const state = map.get(item.id);
			if (state?.status === 'done' && state.image_base64) {
				thumbnailSrc = `data:image/png;base64,${state.image_base64}`;
			} else if (state?.status === undefined && !thumbnailSrc) {
				// no-op: keep persisted thumbnail
			}
		});
		return unsubscribe;
	});

	let cardEl = $state<HTMLElement | null>(null);

	function toggleSelection(e: MouseEvent) {
		e.stopPropagation();
		if (onselect) {
			onselect(item.id);
		} else if (selectionStore) {
			selectionStore.update((curr) => {
				const next = curr === item.id ? null : item.id;
				selectedLocal = next === item.id;
				return next;
			});
		}
	}

	$effect(() => {
		if (!cardEl) return;
		cardEl.addEventListener('click', toggleSelection);
		return () => cardEl!.removeEventListener('click', toggleSelection);
	});

	const moodColor = $derived(getMoodColor(item.mood));
	const initials = $derived(
		item.character
			? item.character
					.split(' ')
					.map((w) => w[0]?.toUpperCase() ?? '')
					.join('')
					.slice(0, 2)
			: null
	);
	const hasSpeech = $derived(!!item.speech);
	const hasAudio = $derived(!!item.audio?.length);
	const hasFX = $derived(!!(item.fx?.bloom || item.fx?.motion_blur));
	const hasImage = $derived(!!thumbnailSrc);
</script>

<div
	bind:this={cardEl}
	class="asset-card shadow-md transition-all {selectedLocal ? 'selected' : ''} {hasImage ? 'ai-generated' : ''}"
	data-testid={`timeline-event-${item.id}`}
	data-ai-generated={hasImage ? 'true' : undefined}
	role="button"
	tabindex="0"
	style="position: relative; z-index: 50;
		{moodColor ? `border-left: 3px solid ${moodColor.border}; background: ${moodColor.bg};` : ''}"
	aria-label={`Timeline event ${item.label}`}
	aria-selected={selectedLocal}
	data-selection-available={selectionStore ? 'yes' : 'no'}
	onkeydown={(e) => e.key === 'Enter' && toggleSelection(e as unknown as MouseEvent)}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if thumbnailSrc}
		<div class="card-thumbnail">
			<img src={thumbnailSrc} alt="Generated frame" class="thumbnail-img" />
			<span class="ai-badge" title="AI generated">✦</span>
		</div>
	{/if}

	<div
		class="card-title"
		style="display:flex;align-items:center;justify-content:space-between;gap:0.25rem;"
	>
		<span>{item.label}</span>
		{#if initials}
			<span
				class="char-badge"
				title={item.character}
				style={moodColor ? `background:${moodColor.border};color:#fff;` : ''}>{initials}</span
			>
		{/if}
	</div>

	{#if !compact}
		<div class="card-meta-primary">
			<div class="meta-left"><span>Start: {item.start}</span></div>
			<div class="meta-right"><span>End: {item.end}</span></div>
		</div>

		<div class="card-meta-details">
			{#if item.speech}
				<div class="meta-line">
					<span aria-label="Speech">💬</span>
					<span>"{item.speech}"</span>
				</div>
			{/if}
			{#if item.mood}
				<div class="meta-line">
					<span aria-label="Mood">🎭</span>
					<span style={moodColor ? `color:${moodColor.text}` : ''}>{item.mood}</span>
				</div>
			{/if}
			{#if item.action}
				<div class="meta-line">
					<span aria-label="Action">⚡</span>
					<span>{item.action}</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Indicator icons row -->
	<div class="card-indicators">
		{#if hasSpeech}<span title="Speech" class="indicator">💬</span>{/if}
		{#if hasAudio}<span title="Audio" class="indicator">🎵</span>{/if}
		{#if hasFX}<span title="FX" class="indicator">✨</span>{/if}
		{#if hasImage}<span title="AI generated" class="indicator ai-indicator">✦</span>{/if}
	</div>

	<!-- Inline generate overlay on hover -->
	{#if isHovered && item.prompt && prefs}
		<div class="inline-generate" onclick={(e) => e.stopPropagation()} role="presentation">
			<GenerateButton eventId={item.id} prompt={item.prompt} {prefs} />
		</div>
	{/if}
</div>

<style>
	.char-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: var(--color-surface-3);
		color: var(--color-text-muted);
		font-size: 0.6rem;
		font-weight: 700;
		flex-shrink: 0;
	}
	.card-indicators {
		display: flex;
		gap: 0.2rem;
		margin-top: 0.2rem;
		font-size: 0.65rem;
		line-height: 1;
	}
	.indicator {
		opacity: 0.7;
	}
	.ai-indicator {
		color: oklch(0.72 0.18 195);
		opacity: 1;
	}

	/* Thumbnail */
	.card-thumbnail {
		position: relative;
		width: 100%;
		height: 80px;
		margin-bottom: 0.4rem;
		border-radius: 4px;
		overflow: hidden;
	}
	.thumbnail-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.ai-badge {
		position: absolute;
		top: 4px;
		right: 4px;
		font-size: 0.6rem;
		background: oklch(0.65 0.25 280 / 0.85);
		color: #fff;
		border-radius: 3px;
		padding: 1px 4px;
		line-height: 1.4;
		font-weight: 700;
	}

	/* AI glow on card */
	.asset-card.ai-generated {
		box-shadow:
			0 0 0 1px oklch(0.65 0.25 280 / 0.5),
			0 0 10px oklch(0.65 0.25 280 / 0.2);
	}

	/* Inline generate overlay */
	.inline-generate {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: oklch(0.12 0.02 265 / 0.92);
		border-top: 1px solid oklch(0.65 0.25 280 / 0.3);
		border-radius: 0 0 4px 4px;
		padding: 0 4px 4px;
		z-index: 10;
	}
</style>
