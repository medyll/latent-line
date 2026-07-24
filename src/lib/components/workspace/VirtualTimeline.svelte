<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimelineEvent } from '$lib/model/model-types';
	import TimelineEventCard from './orchestrator/TimelineEvent.svelte';

	interface Props {
		events: TimelineEvent[];
		estimateHeight?: number;
		overscan?: number;
	}

	let { events = [], estimateHeight = 80, overscan = 5 }: Props = $props();

	let scrollContainer: HTMLDivElement;
	let scrollOffset = $state(0);
	let containerHeight = $state(0);

	// Calculate total size
	const totalSize = $derived(events.length * estimateHeight);

	// Calculate visible range
	const visibleRange = $derived.by(() => {
		const startIndex = Math.max(0, Math.floor(scrollOffset / estimateHeight) - overscan);
		const visibleCount = Math.ceil(containerHeight / estimateHeight);
		const endIndex = Math.min(events.length, startIndex + visibleCount + overscan * 2);

		return { startIndex, endIndex };
	});

	// Virtual items to render
	const virtualItems = $derived.by(() => {
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
			containerHeight = scrollContainer.clientHeight;
		}
	});

	function toTimelineItem(event: TimelineEvent, index: number) {
		const actor = event.frame.actors?.[0];
		return {
			id: String(event.time),
			label: event.notes || `Event ${index + 1}`,
			start: event.time,
			end: event.time + (event.duration ?? 1),
			speech: actor?.speech?.text,
			mood: actor?.speech?.mood,
			action: actor?.action,
			character: actor?.id,
			zoom: event.frame.camera?.zoom,
			fx: event.frame.fx,
			audio: event.frame.audio_tracks,
			timelineFrame: event.frame
		};
	}
</script>

<div bind:this={scrollContainer} class="virtual-timeline" onscroll={handleScroll}>
	<!-- Spacer to maintain scroll height -->
	<div class="virtual-spacer" style="height: {totalSize}px"></div>

	<!-- Virtual items -->
	<div class="virtual-items" style="transform: translateY(0)">
		{#each virtualItems as { event, index, top } (event.time)}
			<div class="virtual-item" style="transform: translateY({top}px)">
				<TimelineEventCard item={toTimelineItem(event, index)} isSelected={false} compact />
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
