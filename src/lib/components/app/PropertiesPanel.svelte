<script lang="ts">
	import type { TimelineFrame } from '$lib/model/model-types';

	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Shows contextual properties for the selected timeline event or asset.
	 *              When an asset is selected, shows asset type/id context.
	 *              When a timeline event is selected, shows frame properties (skipping null sections).
	 * @example <PropertiesPanel {selectedEventId} {timelineEvents} {selectedAssetId} />
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
		fx?: unknown;
		audio?: Array<{ id: string; volume: number }>;
		timelineFrame?: TimelineFrame;
	}

	let {
		selectedEventId = $bindable<string | null>(null),
		timelineEvents = [],
		selectedAssetId = null
	}: {
		selectedEventId: string | null;
		timelineEvents: TimelineEventWithFrame[];
		selectedAssetId?: string | null;
	} = $props();

	const selectedEvent = $derived(
		selectedEventId ? (timelineEvents.find((e) => e.id === selectedEventId) ?? null) : null
	);

	/** Parse type and id from selectedAssetId ("type:id" format) */
	const parsedAsset = $derived.by(() => {
		if (!selectedAssetId) return null;
		const colonIdx = selectedAssetId.indexOf(':');
		if (colonIdx === -1) return null;
		return {
			type: selectedAssetId.slice(0, colonIdx),
			id: selectedAssetId.slice(colonIdx + 1)
		};
	});

	const assetTypeLabel: Record<string, string> = {
		char: 'Character',
		env: 'Environment',
		audio: 'Audio'
	};
</script>

<!--
  PropertiesPanel Component
  Syncs with both timeline event selection and asset selection.
-->
<div class="flex flex-col gap-3 p-2" aria-label="Properties Panel">
	<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">Properties</h2>

	{#if parsedAsset}
		<!-- Asset selected — show context indicator -->
		<div class="rounded border border-blue-200 bg-blue-50 p-3">
			<div class="mb-1 text-xs font-semibold text-blue-600">
				{assetTypeLabel[parsedAsset.type] ?? parsedAsset.type}
			</div>
			<div class="font-mono text-sm font-medium">{parsedAsset.id}</div>
			<div class="mt-2 text-xs text-gray-500">
				Asset details will be available here when the asset store is lifted to parent scope.
			</div>
		</div>
	{:else if selectedEvent}
		<!-- Timeline event selected — show frame properties -->
		<div>
			<div class="mb-3 text-sm font-semibold text-blue-600">{selectedEvent.label}</div>

			{#if selectedEvent.timelineFrame?.camera}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold uppercase text-gray-400">Camera</h3>
					<pre
						aria-label="Camera properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(selectedEvent.timelineFrame.camera, null, 2)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.lighting}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold uppercase text-gray-400">Lighting</h3>
					<pre
						aria-label="Lighting properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(selectedEvent.timelineFrame.lighting, null, 2)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.fx}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold uppercase text-gray-400">FX</h3>
					<pre
						aria-label="FX properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(selectedEvent.timelineFrame.fx, null, 2)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.controlnet}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold uppercase text-gray-400">ControlNet</h3>
					<pre
						aria-label="ControlNet properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(selectedEvent.timelineFrame.controlnet, null, 2)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.audio_tracks?.length}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold uppercase text-gray-400">Audio Tracks</h3>
					<pre
						aria-label="Audio tracks"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(selectedEvent.timelineFrame.audio_tracks, null, 2)}</pre>
				</section>
			{/if}
		</div>
	{:else}
		<!-- Nothing selected -->
		<div class="text-xs text-gray-400" aria-label="No selection">
			Select a timeline event or an asset to view its properties.
		</div>
	{/if}
</div>
