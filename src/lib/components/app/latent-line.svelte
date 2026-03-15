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

	// Keep local selectedEventId in sync with selectionStore (handles clicks from child components)
	let __debugSelection = '';
	let __debugEvents = '';
	selectionStore.subscribe((id) => {
		selectedEventId = id;
		console.log('[bmad-debug] selectionStore ->', id);
		if (typeof window !== 'undefined') {
			(window as any).__selectionStoreValue = id;
			__debugSelection = JSON.stringify(id);
			// mirror recent event log if present
			// @ts-ignore
			if ((window as any).__eventLog && Array.isArray((window as any).__eventLog)) {
				// @ts-ignore
				__debugEvents = JSON.stringify((window as any).__eventLog.slice(-20));
			} else {
				__debugEvents = '[]';
			}
		}
	});

	// Capture clicks at the document level to robustly handle selection across
	// nested elements and overlays. This runs in capture phase so it fires before
	// other bubble-phase handlers and stabilizes aria-selected immediately.
	if (typeof window !== 'undefined') {
		const __win = window as any;
		__win.__eventLog = __win.__eventLog || [];

		const logEvent = (e: Event) => {
			try {
				const ev: any = e as any;
				const target = ev.target as HTMLElement | null;
				const closest = target?.closest
					? (target.closest('[data-testid^="timeline-event-"]') as HTMLElement | null)
					: null;
				__win.__eventLog.push({
					type: e.type,
					time: Date.now(),
					targetTag: target?.tagName,
					targetDataset: target?.dataset ? { ...target.dataset } : {},
					closestTestId: closest?.getAttribute('data-testid') || null,
					clientX: ev.clientX ?? null,
					clientY: ev.clientY ?? null
				});
			} catch (err) {
				// best-effort logging; swallow errors
			}
		};

		const onCapturePointerDown = (e: PointerEvent) => {
			logEvent(e);
			const target = e.target as HTMLElement | null;
			if (!target) return;
			let el = target.closest('[data-testid^="timeline-event-"]') as HTMLElement | null;
			let id = '';
			if (el) {
				const tid = el.getAttribute('data-testid') || '';
				id = tid.replace('timeline-event-', '');
			} else {
				// Fallback: elements that use aria-label="Timeline event ..."
				const closestWithAria = target.closest('[aria-label]') as HTMLElement | null;
				if (closestWithAria) {
					const aria = closestWithAria.getAttribute('aria-label') || '';
					if (aria.startsWith('Timeline event')) {
						el = closestWithAria;
						id = aria.replace('Timeline event ', '');
					}
				}
			}
			if (!el) return;
			selectedEventId = selectedEventId === id ? null : id;
			selectionStore.set(selectedEventId);
			// Immediate DOM update for test stability: update both data-testid and aria-label-based elements
			const allByTestId = Array.from(
				document.querySelectorAll('[data-testid^="timeline-event-"]')
			) as HTMLElement[];
			allByTestId.forEach((n) => n.setAttribute('aria-selected', 'false'));
			const allByAria = Array.from(
				document.querySelectorAll('[aria-label^="Timeline event"]')
			) as HTMLElement[];
			allByAria.forEach((n) => n.setAttribute('aria-selected', 'false'));
			el.setAttribute('aria-selected', selectedEventId === id ? 'true' : 'false');
			// Mark this element so other handlers know we've processed selection already
			el.dataset.__selectionHandled = '1';
			// Stop propagation to avoid duplicate toggles from bubble-phase handlers
			e.stopPropagation();
		};

		// Generic logging for pointerdown/pointerup/click/mousedown in capture phase
		document.addEventListener('pointerdown', logEvent, true);
		document.addEventListener('pointerup', logEvent, true);
		document.addEventListener('click', logEvent, true);
		document.addEventListener('mousedown', logEvent, true);
		// Use pointerdown/mousedown to perform selection (covers environments where pointer events may not fire)
		document.addEventListener('pointerdown', onCapturePointerDown, true);
		document.addEventListener('mousedown', onCapturePointerDown, true);

		// Clean up on module unload / HMR
		onDestroy(() => {
			document.removeEventListener('pointerdown', logEvent, true);
			document.removeEventListener('pointerup', logEvent, true);
			document.removeEventListener('click', logEvent, true);
			document.removeEventListener('pointerdown', onCapturePointerDown, true);
		});
	}
</script>

<div class="app-shell">
	<header class="shell-header">Latent Line</header>
	<aside class="shell-sidebar">
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
				class="w-[200px]"
			 />
			<span>{zoom}%</span>
		</nav>

		<div class="workspace-view">
			<section class="asset-grid">
				{#if timelineEvents.length === 0} 
					<div class="empty-state"><p>No timeline items</p><small>Add clips to the timeline.</small></div>
				{:else}
					<!-- Timeline clips en vignettes -->
					{#each timelineEvents as item (item.id)}
						<!-- <div
									onclick={() => selectEvent(item.id)}
									onkeydown={(e) => e.key === 'Enter' && selectEvent(item.id)}
									role="button"
									tabindex="0"
									class={`asset-card z-50 ${selectedEventId === item.id ? 'ring-2 ring-blue-500' : ''}`}
								> -->
						<TimeLineEvent {item} isSelected={selectedEventId === item.id} />
						<!-- </div> -->
					{/each}
				{/if}
			</section>
			<section class="timeline-panel">
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
									style=" width: {(item.end - item.start) * pxPerFrame}px;"
									title={item.label}
								>
									{item.label}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</section>
		</div>

			<PropertiesPanel 
				bind:selectedEventId
				{selectedAssetId}
			/>
		<footer class="status-bar">
		</footer>
	</main>
</div>

