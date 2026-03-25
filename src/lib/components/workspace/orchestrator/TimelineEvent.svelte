<script lang="ts">
	import { getContext } from 'svelte';
	import { SELECTION_STORE_KEY } from '$lib/context/keys';
	import { getMoodColor } from '$lib/model/mood-palette';
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

	let selectedLocal = $state(isSelected);

	if (selectionStore) {
		selectionStore.subscribe((id) => {
			selectedLocal = id === item.id;
		});
	}

	$effect(() => {
		if (!selectionStore) selectedLocal = isSelected;
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
</script>

<div
	bind:this={cardEl}
	class="asset-card shadow-md transition-all {selectedLocal ? 'selected' : ''}"
	data-testid={`timeline-event-${item.id}`}
	role="button"
	tabindex="0"
	style="position: relative; z-index: 50;
		{moodColor ? `border-left: 3px solid ${moodColor.border}; background: ${moodColor.bg};` : ''}"
	aria-label={`Timeline event ${item.label}`}
	aria-selected={selectedLocal}
	data-selection-available={selectionStore ? 'yes' : 'no'}
	onkeydown={(e) => e.key === 'Enter' && toggleSelection(e as unknown as MouseEvent)}
>
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
	</div>
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
</style>
