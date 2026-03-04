<script lang="ts">
	import type { TimelineEvent, TimelineFrame } from '$lib/model/model-types';

	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Displays contextual properties for the selected timeline event (camera, lighting, fx, controlnet).
	 * @example <PropertiesPanel selectedEventId="event_0" {timelineEvents} />
	 */

	interface TimelineEventWithFrame {
		id: string;
		label: string;
		start: number;
		end: number;
		speech?: string;
		mood?: string;
		action?: string;
		zoom?: number;
		fx?: any;
		audio?: Array<{ id: string; volume: number }>;
		timelineFrame?: TimelineFrame;
	}

	let {
		selectedEventId = $bindable<string | null>(null),
		timelineEvents = []
	}: { selectedEventId: string | null; timelineEvents: TimelineEventWithFrame[] } = $props();

	/**
	 * Extracts properties from the selected event for display.
	 * @param eventId - The ID of the selected timeline event
	 * @returns An object containing camera, lighting, fx, and controlnet properties
	 */
	function getSelectedEvent(): TimelineEventWithFrame | null {
		if (!selectedEventId) return null;
		return timelineEvents.find((e) => e.id === selectedEventId) || null;
	}

	const selectedEvent = $derived.by(() => getSelectedEvent());
</script>

<!--
  PropertiesPanel Component
  Shows contextual properties for the currently selected timeline event.
-->
<div class="flex flex-col gap-4" aria-label="Properties Panel">
	<h2 class="text-lg font-bold">Properties</h2>
	{#if selectedEvent}
		<div>
			<h3 class="mb-2 font-semibold text-blue-600">{selectedEvent.label}</h3>
			<!-- Camera properties -->
			<h3 class="mt-4 font-semibold">Camera</h3>
			<pre
				aria-label="Camera properties"
				class="overflow-auto bg-gray-100 p-2 text-xs">{JSON.stringify(
					selectedEvent.timelineFrame?.camera,
					null,
					2
				)}</pre>
			<!-- Lighting properties -->
			<h3 class="mt-4 font-semibold">Lighting</h3>
			<pre
				aria-label="Lighting properties"
				class="overflow-auto bg-gray-100 p-2 text-xs">{JSON.stringify(
					selectedEvent.timelineFrame?.lighting,
					null,
					2
				)}</pre>
			<!-- FX properties -->
			<h3 class="mt-4 font-semibold">FX</h3>
			<pre aria-label="FX properties" class="overflow-auto bg-gray-100 p-2 text-xs">{JSON.stringify(
					selectedEvent.timelineFrame?.fx,
					null,
					2
				)}</pre>
			<!-- ControlNet properties -->
			<h3 class="mt-4 font-semibold">ControlNet</h3>
			<pre
				aria-label="ControlNet properties"
				class="overflow-auto bg-gray-100 p-2 text-xs">{JSON.stringify(
					selectedEvent.timelineFrame?.controlnet,
					null,
					2
				)}</pre>
		</div>
	{:else}
		<!-- No element selected state -->
		<div class="text-gray-500" aria-label="No element selected">
			No event selected. Click a timeline event to view its properties.
		</div>
	{/if}
</div>
