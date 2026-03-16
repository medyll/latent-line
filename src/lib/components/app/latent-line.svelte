<script lang="ts">
	import { setContext } from 'svelte';
	import AssetManager from './AssetManager.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import TimeLineEvent from './TimelineEvent.svelte';
	import exampleModel from '$lib/model/model-story-example';
	import { onDestroy } from 'svelte';
	import type { Assets } from '$lib/model/model-types';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY, SELECTION_STORE_KEY } from '$lib/context/keys';

	const assetStore = $state<Assets>(structuredClone(exampleModel.assets));
	const model = $state(structuredClone(exampleModel));
	import { toTimelineArray } from '$lib/model/timeline-utils';
	setContext(ASSET_STORE_KEY, assetStore);
	setContext(MODEL_STORE_KEY, model);
	// Expose selection store so child components can update selection directly (robust to overlaying elements)
	import { writable } from 'svelte/store';
	function createSelectionStore(initial: string | null = null) {
		const internal = writable<string | null>(initial);
		let last: string | null = initial;
		let lastTime = 0;
		return {
			subscribe: internal.subscribe,
			set(val: string | null) {
				const now = Date.now();
				// Deliver all selection updates; avoid debouncing to prevent dropped toggles during tests
				// Tests and user interactions should handle rapid events appropriately.
				// (Removing debounce improves determinism for E2E where simulated clicks may be fast.)
				last = val;
				lastTime = now;
				internal.set(val);
			},
			update(fn: (curr: string | null) => string | null) {
				const next = fn(last);
				(this as any).set(next);
			}
		};
	}
	const selectionStore = createSelectionStore(null);
	setContext(SELECTION_STORE_KEY, selectionStore);
	// Expose selectionStore for integration tests / debug helpers
	if (typeof window !== 'undefined') {
		(window as any).__selectionStore = selectionStore;
	}

	let zoom = $state(100);
	let selectedEventId = $state<string | null>(null);
	let selectedAssetId = $state<string | null>(null);

	// Test-only immediate marker to reflect selection synchronously for E2E
	let selectionImmediate = $state(false);
	$effect(() => {
		selectionImmediate = !!selectedEventId || !!selectedAssetId;
	});

	// Base scale: 1 pixel per frame at zoom 100
	const BASE_PX_PER_FRAME = 1;

	// Timeline events as reactive state so edits from PropertiesPanel propagate
	let timelineEvents = $state(
		toTimelineArray(exampleModel.timeline).map((event, idx) => {
			const nextTime =
				idx < exampleModel.timeline.length - 1
					? exampleModel.timeline[idx + 1].time
					: event.time + 120;
			const actor = event.frame.actors && event.frame.actors[0];
			return {
				id: `event_${idx}`,
				label: `Event ${idx + 1}`,
				start: event.time,
				end: nextTime,
				speech: actor && actor.speech ? actor.speech.text : '',
				mood: actor && actor.speech ? actor.speech.mood : '',
				action: actor && actor.action ? actor.action : '',
				zoom: event.frame.camera && event.frame.camera.zoom,
				fx: event.frame.fx,
				audio: (event.frame.audio_tracks || []).map((track) => ({
					id: track.id,
					volume: track.volume ?? 0
				})),
				timelineFrame: event.frame
			};
		})
	);

	const totalDuration = $derived(
		timelineEvents.length > 0 ? timelineEvents[timelineEvents.length - 1].end : 0
	);

	const pxPerFrame = $derived(BASE_PX_PER_FRAME * (zoom / 100));

	function selectEvent(eventId: string) {
		const id = String(eventId);
		selectedEventId = selectedEventId === id ? null : id;
		selectionStore.set(selectedEventId);
	}

	// When an asset is selected via the store, clear event selection (mutual exclusion).
	// Event IDs and null are handled directly by selectEvent — don't touch selectedEventId here.
	selectionStore.subscribe((id) => {
		if (id && !id.startsWith('event_')) {
			selectedEventId = null;
		}
	});

</script>

<div class="app-shell">
	<header class="shell-header">Latent Line</header>
	<aside class="shell-sidebar" aria-label="Asset Manager">
		<header class="sidebar-header">
			<h1 class="header-title">Dashboard</h1>
			<i class="icon-header-action" aria-hidden="true"></i>
		</header>
		<AssetManager bind:selectedAssetId />
	</aside>
	<main class="shell-main">
		<nav class="command-bar">
			<!-- Zoom slider -->
			<label for="zoom-slider">Zoom</label>
			<input type="range"
				id="zoom-slider"
				bind:value={zoom}
				min={10}
				max={400}
				step={1}
				style="width:200px"
			 />
			<span>{zoom}%</span>
		</nav>

		<div style="flex:1;display:flex;overflow:hidden;min-height:0;">
			<div class="workspace-view" style="flex:1;">
				<div class="asset-grid">
					{#if timelineEvents.length === 0}
						<div class="empty-state"><p>No timeline items</p><small>Add clips to the timeline.</small></div>
					{:else}
						{#each timelineEvents as item (item.id)}
							<TimeLineEvent {item} isSelected={selectedEventId === item.id} onselect={selectEvent} />
						{/each}
					{/if}
				</div>
				<div class="timeline-panel">
					<div class="timeline-toolbar">red</div>
					<div class="timeline-container">
						<div class="timeline-labels">
							<div class="label-item">Video </div>
						</div>
						<div class="timeline-canvas">
							<div class="timeline-track">
								{#each timelineEvents as item (item.id)}
									<div
										onclick={() => selectEvent(item.id)}
										onkeydown={(e) => e.key === 'Enter' && selectEvent(item.id)}
										role="button"
										tabindex="0"
										class={`time-segment transition-colors ${selectedEventId === item.id ? 'selected' : ''}`}
										style="width:{(item.end - item.start) * pxPerFrame}px;"
										title={item.label}
									>
										{item.label}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<PropertiesPanel
				bind:selectedEventId
				{selectedAssetId}
			/>
		</div>
		<footer class="status-bar"></footer>
	</main>
</div>

