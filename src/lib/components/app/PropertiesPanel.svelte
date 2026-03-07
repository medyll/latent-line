<script lang="ts">
	import { getContext } from 'svelte';
	import type {
		TimelineFrame,
		Assets,
		Character,
		EnvironmentAsset,
		AudioAsset,
		LightingType
	} from '$lib/model/model-types';
	import { ASSET_STORE_KEY } from '$lib/context/keys';

	const LIGHTING_TYPES: LightingType[] = ['dusk', 'daylight', 'studio', 'tungsten', 'ambient'];

	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Shows contextual properties for the selected timeline event or asset.
	 *              Reads full asset data from shared Svelte context (ST-006/ST-007).
	 *              Supports inline editing of camera zoom and lighting type (ST-008).
	 * @example <PropertiesPanel {selectedEventId} bind:timelineEvents {selectedAssetId} />
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
		timelineEvents = $bindable<TimelineEventWithFrame[]>([]),
		selectedAssetId = null
	}: {
		selectedEventId?: string | null;
		timelineEvents?: TimelineEventWithFrame[];
		selectedAssetId?: string | null;
	} = $props();

	const assetStore = getContext<Assets>(ASSET_STORE_KEY);

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

	const selectedCharacter = $derived.by((): Character | null => {
		if (!parsedAsset || parsedAsset.type !== 'char' || !assetStore) return null;
		return assetStore.characters.find((c) => c.id === parsedAsset.id) ?? null;
	});

	const selectedEnvironment = $derived.by((): (EnvironmentAsset & { id: string }) | null => {
		if (!parsedAsset || parsedAsset.type !== 'env' || !assetStore) return null;
		const env = assetStore.environments[parsedAsset.id];
		if (!env) return null;
		return { ...env, id: parsedAsset.id };
	});

	const selectedAudio = $derived.by((): AudioAsset | null => {
		if (!parsedAsset || parsedAsset.type !== 'audio' || !assetStore) return null;
		return assetStore.audio?.find((a) => a.id === parsedAsset.id) ?? null;
	});

	function updateEventCamera(eventId: string, zoom: number) {
		const idx = timelineEvents.findIndex((e) => e.id === eventId);
		if (idx === -1) return;
		const ev = timelineEvents[idx];
		timelineEvents[idx] = {
			...ev,
			zoom,
			timelineFrame: ev.timelineFrame
				? { ...ev.timelineFrame, camera: { ...(ev.timelineFrame.camera ?? {}), zoom } }
				: ev.timelineFrame
		};
	}

	function updateEventLighting(eventId: string, type: LightingType) {
		const idx = timelineEvents.findIndex((e) => e.id === eventId);
		if (idx === -1) return;
		const ev = timelineEvents[idx];
		timelineEvents[idx] = {
			...ev,
			timelineFrame: ev.timelineFrame
				? { ...ev.timelineFrame, lighting: { ...(ev.timelineFrame.lighting ?? {}), type } }
				: ev.timelineFrame
		};
	}
</script>

<!--
  PropertiesPanel Component
  Syncs with both timeline event selection and asset selection.
  Shows full asset data from shared context (ST-006/ST-007).
  Supports inline editing of camera/lighting (ST-008).
-->
<div class="flex flex-col gap-3 p-2" aria-label="Properties Panel">
	<h2 class="text-sm font-bold tracking-wide text-gray-500 uppercase">Properties</h2>

	{#if selectedCharacter}
		<!-- Character asset selected -->
		<div class="rounded border border-blue-200 bg-blue-50 p-3">
			<div class="mb-2 text-xs font-semibold text-blue-600 uppercase">Character</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedCharacter.id}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">Name</dt>
					<dd class="font-medium">{selectedCharacter.name}</dd>
				</div>
				{#if selectedCharacter.voice_id}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Voice</dt>
						<dd class="font-mono">{selectedCharacter.voice_id}</dd>
					</div>
				{/if}
				{#if selectedCharacter.outfits && Object.keys(selectedCharacter.outfits).length}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Outfits</dt>
						<dd class="flex flex-wrap gap-1">
							{#each Object.keys(selectedCharacter.outfits) as outfit}
								<span class="rounded bg-blue-100 px-1 py-0.5 font-mono text-blue-700">{outfit}</span
								>
							{/each}
						</dd>
					</div>
				{/if}
				{#if selectedCharacter.references?.length}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">References</dt>
						<dd>
							{selectedCharacter.references.length} ref{selectedCharacter.references.length > 1
								? 's'
								: ''}
						</dd>
					</div>
				{/if}
			</dl>
		</div>
	{:else if selectedEnvironment}
		<!-- Environment asset selected -->
		<div class="rounded border border-green-200 bg-green-50 p-3">
			<div class="mb-2 text-xs font-semibold text-green-600 uppercase">Environment</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedEnvironment.id}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">Prompt</dt>
					<dd class="leading-relaxed">{selectedEnvironment.prompt}</dd>
				</div>
				{#if selectedEnvironment.ref}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Ref</dt>
						<dd class="font-mono">{selectedEnvironment.ref}</dd>
					</div>
				{/if}
			</dl>
		</div>
	{:else if selectedAudio}
		<!-- Audio asset selected -->
		<div class="rounded border border-purple-200 bg-purple-50 p-3">
			<div class="mb-2 text-xs font-semibold text-purple-600 uppercase">Audio</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedAudio.id}</dd>
				</div>
				{#if selectedAudio.label}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Label</dt>
						<dd>{selectedAudio.label}</dd>
					</div>
				{/if}
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">URL</dt>
					<dd class="truncate font-mono text-gray-600">{selectedAudio.url || '—'}</dd>
				</div>
			</dl>
		</div>
	{:else if selectedEvent}
		<!-- Timeline event selected — show editable frame properties -->
		<div>
			<div class="mb-3 text-sm font-semibold text-blue-600">{selectedEvent.label}</div>

			{#if selectedEvent.timelineFrame?.camera}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Camera</h3>
					<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
						<label for="zoom-{selectedEvent.id}" class="w-12 shrink-0 text-xs text-gray-400"
							>Zoom</label
						>
						<input
							id="zoom-{selectedEvent.id}"
							type="range"
							min="0.1"
							max="5.0"
							step="0.1"
							value={selectedEvent.timelineFrame.camera.zoom ?? 1}
							oninput={(e) =>
								updateEventCamera(
									selectedEvent!.id,
									parseFloat((e.target as HTMLInputElement).value)
								)}
							class="flex-1"
							aria-label="Camera zoom"
						/>
						<span class="w-8 text-right text-xs tabular-nums">
							{(selectedEvent.timelineFrame.camera.zoom ?? 1).toFixed(1)}
						</span>
					</div>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.lighting}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Lighting</h3>
					<div class="flex items-center gap-2 rounded bg-gray-50 p-2">
						<label for="lighting-{selectedEvent.id}" class="w-12 shrink-0 text-xs text-gray-400"
							>Type</label
						>
						<select
							id="lighting-{selectedEvent.id}"
							value={selectedEvent.timelineFrame.lighting.type ?? ''}
							onchange={(e) =>
								updateEventLighting(
									selectedEvent!.id,
									(e.target as HTMLSelectElement).value as LightingType
								)}
							class="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
							aria-label="Lighting type"
						>
							<option value="">— none —</option>
							{#each LIGHTING_TYPES as lt}
								<option value={lt}>{lt}</option>
							{/each}
						</select>
					</div>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.fx}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">FX</h3>
					<pre
						aria-label="FX properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(
							selectedEvent.timelineFrame.fx,
							null,
							2
						)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.controlnet}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">ControlNet</h3>
					<pre
						aria-label="ControlNet properties"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(
							selectedEvent.timelineFrame.controlnet,
							null,
							2
						)}</pre>
				</section>
			{/if}

			{#if selectedEvent.timelineFrame?.audio_tracks?.length}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Audio Tracks</h3>
					<pre
						aria-label="Audio tracks"
						class="overflow-auto rounded bg-gray-100 p-2 text-xs">{JSON.stringify(
							selectedEvent.timelineFrame.audio_tracks,
							null,
							2
						)}</pre>
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
