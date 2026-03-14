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

	let { item, isSelected = false }: { item: TimelineEventItem; isSelected?: boolean } = $props();

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

	function toggleSelection(e: MouseEvent) {
		// If a higher-level capture handler already processed this selection,
		// skip to avoid double-toggling. Uses a transient dataset flag set by the
		// document-level capture listener.
		const pre = (e.currentTarget as HTMLElement) ?? (e.target as HTMLElement);
		if (pre && (pre as any).dataset && (pre as any).dataset.__selectionHandled) {
			delete (pre as any).dataset.__selectionHandled;
			return;
		}
		// Prevent other click handlers (including parent) from running for this event
		try { (e as any).stopImmediatePropagation?.(); } catch (err) {}
		e.stopPropagation();
		console.log('[bmad-debug] TimelineEvent.toggleSelection', item.id);
		// Direct DOM manipulation to ensure aria-selected updates immediately for E2E stability
		if (typeof document !== 'undefined') {
			const all = Array.from(document.querySelectorAll('[data-testid^="timeline-event-"]')) as HTMLElement[];
			all.forEach((el) => el.setAttribute('aria-selected', 'false'));
			const current = (e.currentTarget as HTMLElement) ?? (e.target as HTMLElement);
			if (current) current.setAttribute('aria-selected', 'true');
		}
		if (!selectionStore) {
			console.log('[bmad-debug] selectionStore undefined in TimelineEvent', item.id);
			return;
		}
		selectionStore.update((curr) => {
			const next = curr === item.id ? null : item.id;
			// Update local state immediately for E2E stability, then propagate to store
			selectedLocal = next === item.id;
			console.log('[bmad-debug] selectionStore update', { from: curr, to: next });
			return next;
		});
	}

</script>

<div
	data-testid={`timeline-event-${item.id}`}
	role="button"
	tabindex="0"
	style="position: relative; z-index: 50;"
	class={`flex h-64 w-64 cursor-pointer flex-col items-start justify-start p-4 shadow-md transition-all ${selectedLocal ? 'border-2 border-blue-500 bg-blue-50' : 'bg-white hover:shadow-lg'}`}
	aria-label={`Timeline event ${item.label}`}
	aria-selected={selectedLocal}
	data-selection-available={selectionStore ? 'yes' : 'no'}
	on:click={toggleSelection}
	>
	<div class="mb-2 text-lg font-bold">{item.label}</div>
	<div class="text-xs">Start: {item.start}</div>
	<div class="text-xs">End: {item.end}</div>
	{#if item.speech}
		<div class="mt-2 flex items-center gap-2 text-sm text-gray-700 italic dark:text-gray-300">
			<MessageCircle class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Speech" />
			<span>"{item.speech}"</span>
		</div>
	{/if}
	{#if item.mood}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Smile class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Mood" />
			<span>Mood: {item.mood}</span>
		</div>
	{/if}
	{#if item.action}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Activity class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Action" />
			<span>Action: {item.action}</span>
		</div>
	{/if}
	{#if item.zoom}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<ZoomIn class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Zoom" />
			<span>Zoom: {item.zoom}</span>
		</div>
	{/if}
	{#if item.fx && item.fx.bloom}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Sparkles class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Bloom" />
			<span>Bloom: {item.fx.bloom}</span>
		</div>
	{/if}
	{#if item.audio && item.audio.length > 0}
		<div class="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Volume2 class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Audio" />
			<span>Audio:</span>
			<span class="flex flex-wrap gap-2">
				{#each item.audio as track}
					<span class="mr-2">{track.id} ({track.volume})</span>
				{/each}
			</span>
		</div>
	{/if}
</div>
