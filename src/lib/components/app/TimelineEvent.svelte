<script lang="ts">
	import { MessageCircle, Smile, Activity, ZoomIn, Sparkles, Volume2 } from '@lucide/svelte';
	import { getContext } from 'svelte';
	import { SELECTION_STORE_KEY } from '$lib/context/keys';
	import type { Writable } from 'svelte/store';

	/**
	 * TimeLineEvent.svelte
	 * @component TimeLineEvent
	 * @description Displays a single timeline event card with actor speech, mood, action, camera and FX info.
	 * @example <TimeLineEvent item={event} isSelected={false} />
	 */

	interface TimelineEventItem {
		id: string;
		label: string;
		start: number;
		end: number;
		speech?: string;
		mood?: string;
		action?: string;
		zoom?: number;
		fx?: { bloom?: number; motion_blur?: number };
		audio?: Array<{ id: string; volume: number }>;
		timelineFrame?: unknown;
	}

	let { item, isSelected = false, onselect }: { item: TimelineEventItem; isSelected?: boolean; onselect?: (id: string) => void } = $props();

	const selectionStore = getContext(SELECTION_STORE_KEY) as Writable<string | null> | undefined;

	// Local selected state to make aria-selected reliable for tests even if parent
	// reactivity hasn't propagated yet. Keep in sync with both the prop and the
	// shared selection store.
	let selectedLocal = $state(isSelected);

	if (selectionStore) {
		selectionStore.subscribe((id) => {
			selectedLocal = id === item.id;
		});
	}

	$effect(() => {
		// Sync incoming prop changes only when no shared selection store is available.
		if (!selectionStore) {
			selectedLocal = isSelected;
		}
	});

	let cardEl = $state<HTMLElement | null>(null);

	// Expected behavior:
	// - First click on the card selects the event: selectedLocal becomes true, selectionStore is updated,
	//   and the parent (via onselect callback) sets selectedEventId to this card's id.
	// - Second click on the same card deselects it: selectedLocal becomes false, selectionStore is set to
	//   null, and PropertiesPanel returns to its empty state.
	// - Clicking a different card deselects the current one and selects the new one (mutual exclusion
	//   is handled by the parent through selectionStore).
	//
	// Implementation note:
	// We intentionally use a native addEventListener via $effect (bind:this + cardEl) instead of
	// Svelte 5's onclick={} template syntax. Svelte 5 uses event delegation internally, and the
	// delegated handler was observed to be silently dropped after the component re-renders following
	// the first selection (selectedLocal change triggers a patch). The native listener survives
	// re-renders because $effect re-registers it whenever cardEl is reassigned.
	function toggleSelection(e: MouseEvent) {
		e.stopPropagation();
		if (onselect) {
			// Parent handles the toggle logic
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
</script>

<div
	bind:this={cardEl}
	class={`asset-card shadow-md transition-all ${selectedLocal ? 'selected' : ''}`}
	data-testid={`timeline-event-${item.id}`}
	role="button"
	tabindex="0"
	style="position: relative; z-index: 50;"
	aria-label={`Timeline event ${item.label}`}
	aria-selected={selectedLocal}
	data-selection-available={selectionStore ? 'yes' : 'no'}
	onkeydown={(e) => e.key === 'Enter' && toggleSelection(e as unknown as MouseEvent)}
>
	<div class="card-title">{item.label}</div>
	<img src="thumb.jpg" alt="Preview" class="card-media" />
	<div class="card-meta-primary">
		<div class="meta-left"><span>Start: {item.start}</span></div>
		<div class="meta-right"><span>End: {item.end}</span></div>
	</div>

	<div class="card-meta-details">
		{#if item.speech}
			<div class="meta-line">
				<MessageCircle class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Speech" />
				<span>"{item.speech}"</span>
			</div>
		{/if}
		{#if item.mood}
			<div class="meta-line">
				<Smile class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Mood" />
				<span>Mood: {item.mood}</span>
			</div>
		{/if}
		{#if item.action}
			<div class="meta-line">
				<Activity class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Action" />
				<span>Action: {item.action}</span>
			</div>
		{/if}
		{#if item.zoom}
			<div class="meta-line">
				<ZoomIn class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Zoom" />
				<span>Zoom: {item.zoom}</span>
			</div>
		{/if}
		{#if item.fx && item.fx.bloom}
			<div class="meta-line">
				<Sparkles class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Bloom" />
				<span>Bloom: {item.fx.bloom}</span>
			</div>
		{/if}
		{#if item.audio && item.audio.length > 0}
			<div class="meta-line">
				<Volume2 class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Audio" />
				<div>
					<span>Audio:</span>
					<span class="flex flex-wrap gap-2">
						{#each item.audio as track}
							<span class="mr-2">{track.id} ({track.volume})</span>
						{/each}
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>
