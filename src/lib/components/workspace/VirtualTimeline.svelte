<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimelineEvent } from '$lib/model/model-types';
	import TimelineEventCard from './TimelineEvent.svelte';
	import { SELECTION_STORE_KEY } from '$lib/context/keys';

	interface Props {
		events: TimelineEvent[];
		estimateHeight?: number;
		overscan?: number;
	}

	let {
		events = [],
		estimateHeight = 80,
		overscan = 5
	}: Props = $props();

	const selectionStore = getContext<Set<number> | null>(SELECTION_STORE_KEY);

	let scrollContainer: HTMLDivElement;
	let scrollOffset = $state(0);
	let scrollHeight = $state(0);
	let containerHeight = $state(0);

	// Calculate total size
	const totalSize = $derived(events.length * estimateHeight);

	// Calculate visible range
	const visibleRange = $derived(() => {
		const startIndex = Math.max(
			0,
			Math.floor(scrollOffset / estimateHeight) - overscan
		);
		const visibleCount = Math.ceil(containerHeight / estimateHeight);
		const endIndex = Math.min(
			events.length,
			startIndex + visibleCount + overscan * 2
		);

		return { startIndex, endIndex };
	});

	// Virtual items to render
	const virtualItems = $derived(() => {
		const { startIndex, endIndex } = visibleRange;
		return events.slice(startIndex, endIndex).map((event, idx) => ({
			event,
			index: startIndex + idx,
			top: (startIndex + idx) * estimateHeight
		}));
	});

	function handleScroll(e: Event) {
		const target = e.target as HTMLDivElement;
		scrollOffset = target.scrollTop;
		containerHeight = target.clientHeight;
	}

	onMount(() => {
		if (scrollContainer) {
			scrollHeight = scrollContainer.clientHeight;
			containerHeight = scrollContainer.clientHeight;
		}
	});

	function isSelected(time: number): boolean {
		return selectionStore?.has(time) ?? false;
	}
</script>

<div
	bind:this={scrollContainer}
	class="virtual-timeline"
	on:scroll={handleScroll}
>
	<!-- Spacer to maintain scroll height -->
	<div class="virtual-spacer" style="height: {totalSize}px" />

	<!-- Virtual items -->
	<div class="virtual-items" style="transform: translateY(0)">
		{#each virtualItems as { event, index, top } (event.time)}
			<div
				class="virtual-item"
				style="transform: translateY({top}px)"
			>
				<TimelineEventCard
					{event}
					selected={isSelected(event.time)}
					compact
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.virtual-timeline {
		position: relative;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		will-change: scroll-position;
	}

	.virtual-spacer {
		width: 1px;
		pointer-events: none;
	}

	.virtual-items {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.virtual-item {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: auto;
		will-change: transform;
	}
</style>
