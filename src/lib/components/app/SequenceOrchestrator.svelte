<script lang="ts">
	/**
	 * SequenceOrchestrator.svelte
	 *
	 * @component SequenceOrchestrator
	 * @description Synoptic grid (top) + Temporal Sequencer (middle) + Audio Timeline (bottom).
	 *              - ST-016: reads timeline from MODEL_STORE_KEY context.
	 *              - ST-017: Add / Delete (confirm) / Duplicate events.
	 *              - ST-021: Temporal Sequencer with absolute positioning,
	 *                drag-to-change-time (TS-03), zoom slider (TS-04), playhead (TS-05).
	 *              - ST-022: Scroll sync between Synoptic View ↔ Temporal Sequencer.
	 *              - ST-024: Audio Timeline with multi-track lanes and mute/solo controls.
	 * @example <SequenceOrchestrator bind:selectedTime />
	 */
	import { getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Model } from '$lib/model/model-types';
	import { MODEL_STORE_KEY, SCROLL_SYNC_STORE_KEY } from '$lib/context/keys';
	import { Plus, Trash2, Copy } from '@lucide/svelte';
	import { throttle } from '$lib/utils/throttle';
	import { tickFrame, clampFrame, seekFromPixel, computeDuration } from '$lib/utils/playback';
	import AudioTimeline from './AudioTimeline.svelte';

	let { selectedTime = $bindable<number | null>(null) }: { selectedTime?: number | null } =
		$props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	// ST-022: Scroll sync store
	interface ScrollSyncState {
		scrollLeft: number;
		scrollTop: number;
	}

	const scrollSyncStore = writable<ScrollSyncState>({ scrollLeft: 0, scrollTop: 0 });
	const syncedScrollState = $derived.by(() => {
		let state = { scrollLeft: 0, scrollTop: 0 };
		const unsub = scrollSyncStore.subscribe((s) => {
			state = s;
		});
		unsub();
		return state;
	});

	// Refs for scroll containers
	let synopticScrollContainer: HTMLElement;
	let temporalScrollContainer: HTMLElement;

	// Throttled scroll handlers (100ms debounce)
	const handleSynopticScroll = throttle((e: Event) => {
		const target = e.target as HTMLElement;
		scrollSyncStore.set({
			scrollLeft: target.scrollLeft,
			scrollTop: target.scrollTop
		});
	}, 100);

	const handleTemporalScroll = throttle((e: Event) => {
		const target = e.target as HTMLElement;
		scrollSyncStore.set({
			scrollLeft: target.scrollLeft,
			scrollTop: target.scrollTop
		});
	}, 100);

	// Apply synced scroll position from store
	$effect(() => {
		const state = syncedScrollState;
		if (synopticScrollContainer) {
			synopticScrollContainer.scrollLeft = state.scrollLeft;
		}
		if (temporalScrollContainer) {
			temporalScrollContainer.scrollLeft = state.scrollLeft;
		}
	});

	const timeline = $derived([...model.timeline].sort((a, b) => a.time - b.time));

	// ── Zoom & playhead (TS-04, TS-05) ──
	const FRAME_PX = 24; // base pixels per frame unit at zoom 1×
	const EVENT_WIDTH = 56; // fixed event block width in px
	const FPS = 24; // playback frames per second

	let zoomLevel = $state(1);
	let playheadTime = $state(0);
	let isPlaying = $state(false);

	// rAF playback loop
	let rafId = 0;
	let lastTs = 0;

	function startPlayback() {
		isPlaying = true;
		lastTs = 0;
		rafId = requestAnimationFrame(tick);
	}

	function tick(ts: number) {
		if (!isPlaying) return;
		if (lastTs === 0) lastTs = ts;
		const elapsedMs = ts - lastTs;
		lastTs = ts;
		const endTime = computeDuration(model.timeline.map((e) => e.time));
		playheadTime = clampFrame(tickFrame(playheadTime, elapsedMs), endTime);
		if (playheadTime >= endTime) {
			isPlaying = false;
			return;
		}
		rafId = requestAnimationFrame(tick);
	}

	function pausePlayback() {
		isPlaying = false;
		cancelAnimationFrame(rafId);
	}

	function stopPlayback() {
		isPlaying = false;
		cancelAnimationFrame(rafId);
		playheadTime = 0;
	}

	function togglePlay() {
		if (isPlaying) pausePlayback();
		else startPlayback();
	}

	// Keyboard shortcuts: Space = play/pause, Escape/0 = stop
	function handleKeydown(e: KeyboardEvent) {
		if ((e.target as HTMLElement).closest('input, textarea, select')) return;
		if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
		else if (e.code === 'Escape' || e.key === '0') stopPlayback();
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			cancelAnimationFrame(rafId);
		};
	});

	const pixelsPerFrame = $derived(FRAME_PX * zoomLevel);
	const maxTime = $derived(timeline.length ? Math.max(...timeline.map((ev) => ev.time)) : 0);
	const containerWidth = $derived(Math.max(600, (maxTime + 20) * pixelsPerFrame + EVENT_WIDTH + 40));

	// ── Drag state (TS-03) ──
	interface DragState {
		startTime: number; // original event time
		previewTime: number; // time during drag (before release)
		startX: number; // pointer X at drag start
	}

	let dragging = $state<DragState | null>(null);

	function selectEvent(time: number) {
		selectedTime = selectedTime === time ? null : time;
	}

	function startDrag(e: PointerEvent, time: number) {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragging = { startTime: time, previewTime: time, startX: e.clientX };
	}

	function onDragMove(e: PointerEvent) {
		if (!dragging) return;
		const deltaX = e.clientX - dragging.startX;
		const deltaTime = Math.round(deltaX / pixelsPerFrame);
		const newTime = Math.max(0, dragging.startTime + deltaTime);
		dragging = { ...dragging, previewTime: newTime };
	}

	function onDragEnd(e: PointerEvent) {
		if (!dragging) return;
		let resolvedTime = dragging.previewTime;
		// Resolve collision: bump until free (skip own original position)
		while (
			model.timeline.some(
				(ev) => ev.time !== dragging!.startTime && ev.time === resolvedTime
			)
		) {
			resolvedTime++;
		}
		const idx = model.timeline.findIndex((ev) => ev.time === dragging!.startTime);
		if (idx !== -1) {
			model.timeline[idx].time = resolvedTime;
			if (selectedTime === dragging.startTime) selectedTime = resolvedTime;
		}
		dragging = null;
	}

	function onDragCancel() {
		dragging = null;
	}

	/** Click on empty timeline area → set playhead */
	function handleTimelineClick(e: MouseEvent) {
		if (dragging) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		playheadTime = seekFromPixel(x, pixelsPerFrame);
	}

	// ── Event CRUD (ST-017) ──
	function addEvent() {
		const maxT = model.timeline.reduce((max, ev) => Math.max(max, ev.time), -1);
		const newTime = maxT + 10;
		model.timeline.push({ time: newTime, frame: {} });
		selectedTime = newTime;
	}

	function deleteEvent(e: MouseEvent, time: number) {
		e.stopPropagation();
		if (!confirm(`Delete event at frame ${time}?`)) return;
		model.timeline = model.timeline.filter((ev) => ev.time !== time);
		if (selectedTime === time) selectedTime = null;
	}

	function duplicateEvent(e: MouseEvent, time: number) {
		e.stopPropagation();
		const source = model.timeline.find((ev) => ev.time === time);
		if (!source) return;
		let freeTime = time + 1;
		while (model.timeline.some((ev) => ev.time === freeTime)) freeTime++;
		model.timeline.push({ time: freeTime, frame: structuredClone(source.frame) });
		selectedTime = freeTime;
	}
</script>

<div class="flex h-full w-full flex-col gap-4" aria-label="Sequence Orchestrator">
	<!-- ── Synoptic View (Top) ── -->
	<section>
		<header class="card-header">
			<h3 class="card-title flex items-center justify-between">
				<span>Synoptic View</span>
				<button onclick={addEvent} title="Add event" aria-label="Add timeline event">
					<Plus class="h-4 w-4" />
				</button>
			</h3>
		</header>
		<div class="card-content p-0">
			<!-- ST-022: Scrollable container with scroll sync -->
			<div
				bind:this={synopticScrollContainer}
				class="overflow-x-auto"
				onscroll={handleSynopticScroll}
				aria-label="Synoptic view scroll container"
			>
				<div class="flex flex-row flex-wrap gap-2 p-4">
					{#if timeline.length === 0}
						<div class="empty-state"><p>No timeline events</p><small>Click + to add your first event.</small></div>
					{:else}
						{#each timeline as event (event.time)}
							{@const moodActor = event.frame.actors?.find((a) => a.speech?.mood)}
							<div
								onclick={() => selectEvent(event.time)}
								onkeydown={(e) => e.key === 'Enter' && selectEvent(event.time)}
								role="button"
							tabindex="0"
							class={`group relative flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded border transition-colors ${selectedTime === event.time ? 'border-blue-500 bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
							aria-label={`Frame ${event.time}`}
							aria-selected={selectedTime === event.time}
						>
							<span class="text-xs font-semibold">Frame {event.time}</span>
							<span class="text-xs text-gray-500">Actors: {event.frame.actors?.length || 0}</span>
							{#if moodActor}
								<span class="rounded bg-purple-100 px-1 py-0.5 text-xs font-medium text-purple-700" aria-label="mood">
									{moodActor.speech?.mood}
								</span>
							{/if}
							<div class="absolute right-0.5 top-0.5 hidden gap-0.5 group-hover:flex">
								<button onclick={(e) => duplicateEvent(e, event.time)} title="Duplicate" aria-label={`Duplicate frame ${event.time}`} class="rounded bg-white p-0.5 text-gray-400 shadow hover:text-blue-600">
									<Copy class="h-3 w-3" />
								</button>
								<button onclick={(e) => deleteEvent(e, event.time)} title="Delete" aria-label={`Delete frame ${event.time}`} class="rounded bg-white p-0.5 text-gray-400 shadow hover:text-red-600">
									<Trash2 class="h-3 w-3" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ── Temporal Sequencer (Bottom) ── -->
	<section>
		<header class="card-header">
			<h3 class="card-title flex items-center justify-between">
				<span>Temporal Sequencer</span>
				<div class="flex items-center gap-3">
					<!-- Playback controls (S10-01) -->
					<div class="flex items-center gap-1" role="group" aria-label="Playback controls">
						<button
							onclick={togglePlay}
							title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
							aria-label={isPlaying ? 'Pause' : 'Play'}
							class="text-xs"
						>{isPlaying ? '⏸' : '▶'}</button>
						<button
							onclick={stopPlayback}
							title="Stop (Esc)"
							aria-label="Stop"
							class="text-xs"
						>■</button>
						<span class="tabular-nums text-xs" aria-label="Playhead position">{Math.floor(playheadTime)}</span>
					</div>
					<!-- Zoom slider (TS-04) -->
					<div class="flex items-center gap-2">
						<span class="text-xs text-gray-400">Zoom</span>
						<input
							type="range"
							min="1"
							max="8"
							step="0.5"
							bind:value={zoomLevel}
							class="w-24"
							aria-label="Timeline zoom"
						/>
						<span class="w-6 text-right text-xs tabular-nums text-gray-500">{zoomLevel}×</span>
					</div>
				</div>
			</h3>
		</header>
		<div class="card-content p-0">
			{#if timeline.length === 0}
				<div class="p-4">
					<div class="empty-state"><p>No timeline events</p><small>Add events to see the sequence here.</small></div>
				</div>
			{:else}
				<!-- ST-022: Scrollable track with scroll sync (TS-05 playhead click) -->
				<div
					bind:this={temporalScrollContainer}
					class="relative overflow-x-auto"
					style="height: 72px;"
					onclick={handleTimelineClick}
					onscroll={handleTemporalScroll}
					aria-label="Timeline track"
					role="presentation"
				>
					<!-- Inner container with computed width -->
					<div class="relative h-full" style="width: {containerWidth}px;">

						<!-- Playhead (TS-05) -->
						<div
							class="pointer-events-none absolute top-0 z-10 h-full w-px bg-red-500"
							style="left: {playheadTime * pixelsPerFrame}px;"
							aria-label={`Playhead at frame ${playheadTime}`}
						>
							<div class="h-2 w-2 -translate-x-[3px] rounded-full bg-red-500"></div>
						</div>

						<!-- Time grid marks (every 10 frames) -->
						{#each Array.from({ length: Math.floor(maxTime / 10) + 2 }, (_, i) => i * 10) as tick}
							<div
								class="pointer-events-none absolute top-0 h-2 w-px bg-gray-200"
								style="left: {tick * pixelsPerFrame}px;"
							>
								<span class="absolute top-2 -translate-x-1/2 text-[9px] text-gray-300">{tick}</span>
							</div>
						{/each}

						<!-- Event blocks (TS-03 drag) -->
						{#each timeline as event (event.time)}
							{@const isDragging = dragging?.startTime === event.time}
							{@const displayTime = isDragging ? dragging!.previewTime : event.time}
							<div
								onpointerdown={(e) => startDrag(e, event.time)}
								onpointermove={onDragMove}
								onpointerup={onDragEnd}
								onpointercancel={onDragCancel}
								onclick={(e) => {
									e.stopPropagation();
									if (!isDragging) selectEvent(event.time);
								}}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && selectEvent(event.time)}
								class={`absolute top-4 flex cursor-grab flex-col items-center justify-center rounded border text-xs transition-colors ${isDragging ? 'cursor-grabbing opacity-80 shadow-lg' : ''} ${selectedTime === event.time ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
								style="left: {displayTime * pixelsPerFrame}px; width: {EVENT_WIDTH}px; height: 48px;"
								aria-label={`Time ${event.time}`}
								aria-selected={selectedTime === event.time}
							>
								<span class="font-semibold">{event.time}</span>
								<span class="text-gray-400">{event.frame.actors?.length ?? 0}A</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- ST-024: Audio Timeline -->
	<section>
		<header class="card-header">
			<h3 class="card-title">Audio Timeline</h3>
		</header>
		<div class="card-content">
			<AudioTimeline audioAssets={model.assets.audio} />
		</div>
	</section>
</div>
