<script lang="ts">
	/**
	 * SequenceOrchestrator.svelte
	 * Synoptic grid + Temporal Sequencer + Audio Timeline.
	 * S17: markers, multi-selection, synoptic drag reorder, templates save.
	 */
	import { getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Model, Marker } from '$lib/model/model-types';
	import { MODEL_STORE_KEY, PLAYBACK_CONTEXT_KEY, TEMPLATES_CONTEXT_KEY } from '$lib/context/keys';
	import type { PlaybackStore } from '$lib/context/playback-context.svelte';
	import type { TemplatesStore } from '$lib/stores/templates.svelte';
	import { Plus, Trash2, Copy } from '@lucide/svelte';
	import TimelineEvent from './TimelineEvent.svelte';
	import { throttle } from '$lib/utils/throttle';
	import { tickFrame, clampFrame, seekFromPixel, computeDuration } from '$lib/utils/playback';
	import AudioTimeline from '$lib/components/workspace/audio/AudioTimeline.svelte';
	import PlaybackBar from './playback-bar.svelte';
	import { deleteEventFromModel } from '$lib/utils/event-helpers';
	import EventTooltip from '$lib/components/app/EventTooltip.svelte';
	import SelectionToolbar from '$lib/components/ui/SelectionToolbar.svelte';

	let { selectedTime = $bindable<number | null>(null) }: { selectedTime?: number | null } =
		$props();

	const model = getContext<Model>(MODEL_STORE_KEY);
	const playback = getContext<PlaybackStore>(PLAYBACK_CONTEXT_KEY);
	const { templates, saveTemplate } = getContext<TemplatesStore>(TEMPLATES_CONTEXT_KEY);

	// ── Scroll sync ──
	const scrollSyncStore = writable({ scrollLeft: 0, scrollTop: 0 });
	const syncedScrollState = $derived.by(() => {
		let state = { scrollLeft: 0, scrollTop: 0 };
		const unsub = scrollSyncStore.subscribe((s) => {
			state = s;
		});
		unsub();
		return state;
	});
	let synopticScrollContainer: HTMLElement;
	let temporalScrollContainer: HTMLElement;

	$effect(() => {
		if (!synopticScrollContainer) return;
		const ro = new ResizeObserver(([entry]) => {
			synopticContainerWidth = entry.contentRect.width;
		});
		ro.observe(synopticScrollContainer);
		synopticContainerWidth = synopticScrollContainer.clientWidth;
		return () => ro.disconnect();
	});

	const handleSynopticScroll = throttle((...args: unknown[]) => {
		const e = args[0] as Event;
		const t = e.target as HTMLElement;
		scrollSyncStore.set({ scrollLeft: t.scrollLeft, scrollTop: t.scrollTop });
	}, 100);
	const handleTemporalScroll = throttle((...args: unknown[]) => {
		const e = args[0] as Event;
		const t = e.target as HTMLElement;
		scrollSyncStore.set({ scrollLeft: t.scrollLeft, scrollTop: t.scrollTop });
	}, 100);

	$effect(() => {
		const state = syncedScrollState;
		if (synopticScrollContainer) synopticScrollContainer.scrollLeft = state.scrollLeft;
		if (temporalScrollContainer) temporalScrollContainer.scrollLeft = state.scrollLeft;
	});

	const timeline = $derived([...model.timeline].sort((a, b) => a.time - b.time));

	// ── Constants ──
	const FRAME_PX = 2;
	const MIN_EVENT_WIDTH = 32;
	const DEFAULT_DURATION = 24;
	const FPS = 24;

	let zoomLevel = $state(1);
	let compactMode = $state(false);

	// ── Synoptic virtualisation (horizontal windowing) ──
	let synopticContainerWidth = $state(800);
	const SYN_CARD_W = $derived(compactMode ? 56 : 120);
	const SYN_OVERSCAN = 3;
	const synScrollLeft = $derived(syncedScrollState.scrollLeft);
	const synStartIdx = $derived(Math.max(0, Math.floor(synScrollLeft / SYN_CARD_W) - SYN_OVERSCAN));
	const synEndIdx = $derived(
		Math.min(
			timeline.length - 1,
			Math.ceil((synScrollLeft + synopticContainerWidth) / SYN_CARD_W) + SYN_OVERSCAN
		)
	);
	const visibleTimeline = $derived(
		timeline.length > 40 ? timeline.slice(synStartIdx, synEndIdx + 1) : timeline
	);
	const synLeftSpacer = $derived(timeline.length > 40 ? synStartIdx * SYN_CARD_W : 0);
	const synRightSpacer = $derived(
		timeline.length > 40 ? (timeline.length - synEndIdx - 1) * SYN_CARD_W : 0
	);

	// ── Playback (uses shared context) ──
	let rafId = 0;
	let lastTs = 0;

	function startPlayback() {
		playback.isPlaying = true;
		lastTs = 0;
		rafId = requestAnimationFrame(tick);
	}
	function tick(ts: number) {
		if (!playback.isPlaying) return;
		if (lastTs === 0) lastTs = ts;
		const elapsedMs = ts - lastTs;
		lastTs = ts;
		const endTime = computeDuration(model.timeline.map((e) => e.time));
		playback.playheadTime = clampFrame(tickFrame(playback.playheadTime, elapsedMs), endTime);
		if (playback.playheadTime >= endTime) {
			playback.isPlaying = false;
			return;
		}
		rafId = requestAnimationFrame(tick);
	}
	function pausePlayback() {
		playback.isPlaying = false;
		cancelAnimationFrame(rafId);
	}
	function stopPlayback() {
		playback.isPlaying = false;
		cancelAnimationFrame(rafId);
		playback.playheadTime = 0;
	}
	function togglePlay() {
		if (playback.isPlaying) pausePlayback();
		else startPlayback();
	}

	$effect(() => {
		if (playback.isPlaying && rafId === 0) {
			lastTs = 0;
			rafId = requestAnimationFrame(tick);
		} else if (!playback.isPlaying) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	});

	// ── Derived layout ──
	const pixelsPerFrame = $derived(FRAME_PX * zoomLevel);
	const maxTime = $derived(timeline.length ? Math.max(...timeline.map((ev) => ev.time)) : 0);
	const lastEvent = $derived(timeline.length ? timeline[timeline.length - 1] : null);
	const totalDuration = $derived(
		lastEvent ? lastEvent.time + (lastEvent.duration ?? DEFAULT_DURATION) : 0
	);
	const containerWidth = $derived(Math.max(600, totalDuration * pixelsPerFrame + 80));
	const activeEventTime = $derived(
		model.timeline.find(
			(ev) =>
				playback.playheadTime >= ev.time &&
				playback.playheadTime < ev.time + (ev.duration ?? DEFAULT_DURATION)
		)?.time ?? null
	);

	function blockWidth(event: { duration?: number }): number {
		return Math.max((event.duration ?? DEFAULT_DURATION) * pixelsPerFrame, MIN_EVENT_WIDTH);
	}

	// ── Single selection ──
	function selectEvent(time: number) {
		selectedTime = selectedTime === time ? null : time;
		multiSelectedTimes = new SvelteSet();
	}

	// ── Multi-selection (S17-02) ──
	let multiSelectedTimes = $state<Set<number>>(new SvelteSet());

	function handleSynopticClick(e: MouseEvent, time: number) {
		if (e.ctrlKey || e.metaKey) {
			const s = new SvelteSet(multiSelectedTimes);
			if (s.has(time)) s.delete(time);
			else s.add(time);
			multiSelectedTimes = s;
			selectedTime = null;
		} else if (e.shiftKey && selectedTime !== null) {
			const times = timeline.map((ev) => ev.time).sort((a, b) => a - b);
			const from = Math.min(selectedTime, time);
			const to = Math.max(selectedTime, time);
			multiSelectedTimes = new SvelteSet(times.filter((t) => t >= from && t <= to));
			selectedTime = null;
		} else {
			multiSelectedTimes = new SvelteSet();
			selectEvent(time);
		}
	}

	function deleteSelected() {
		for (const t of multiSelectedTimes) {
			deleteEventFromModel(model, t);
			if (selectedTime === t) selectedTime = null;
		}
		multiSelectedTimes = new SvelteSet();
	}

	function duplicateSelected() {
		const sorted = [...multiSelectedTimes].sort((a, b) => a - b);
		for (const t of sorted) {
			const src = model.timeline.find((ev) => ev.time === t);
			if (!src) continue;
			let free = t + 1;
			while (model.timeline.some((ev) => ev.time === free)) free++;
			model.timeline.push({
				time: free,
				duration: src.duration ?? DEFAULT_DURATION,
				frame: structuredClone(src.frame)
			});
		}
		multiSelectedTimes = new SvelteSet();
	}

	function shiftSelected(delta: number) {
		const sorted = [...multiSelectedTimes].sort((a, b) => (delta > 0 ? b - a : a - b));
		for (const t of sorted) {
			const idx = model.timeline.findIndex((ev) => ev.time === t);
			if (idx !== -1) model.timeline[idx].time = Math.max(0, t + delta);
		}
		multiSelectedTimes = new SvelteSet([...multiSelectedTimes].map((t) => Math.max(0, t + delta)));
		if (selectedTime !== null) selectedTime = Math.max(0, selectedTime + delta);
	}

	// ── Temporal drag (existing, TS-03) ──
	interface DragState {
		startTime: number;
		previewTime: number;
		startX: number;
	}
	let dragging = $state<DragState | null>(null);

	function startDrag(e: PointerEvent, time: number) {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragging = { startTime: time, previewTime: time, startX: e.clientX };
	}
	function onDragMove(e: PointerEvent) {
		if (!dragging) return;
		const deltaTime = Math.round((e.clientX - dragging.startX) / pixelsPerFrame);
		dragging = { ...dragging, previewTime: Math.max(0, dragging.startTime + deltaTime) };
	}
	function onDragEnd() {
		if (!dragging) return;
		let resolved = dragging.previewTime;
		while (model.timeline.some((ev) => ev.time !== dragging!.startTime && ev.time === resolved))
			resolved++;
		const idx = model.timeline.findIndex((ev) => ev.time === dragging!.startTime);
		if (idx !== -1) {
			model.timeline[idx].time = resolved;
			if (selectedTime === dragging.startTime) selectedTime = resolved;
		}
		dragging = null;
	}
	function onDragCancel() {
		dragging = null;
	}

	// ── Synoptic drag reorder (S17-03) ──
	let synDragTime = $state<number | null>(null);
	let synDropTarget = $state<number | null>(null);

	function startSynDrag(e: PointerEvent, time: number) {
		if ((e.target as HTMLElement).closest('button')) return; // don't drag from action buttons
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		synDragTime = time;
	}
	function onSynPointerEnter(time: number) {
		if (synDragTime !== null && synDragTime !== time) synDropTarget = time;
	}
	function onSynPointerUp() {
		if (synDragTime !== null && synDropTarget !== null && synDragTime !== synDropTarget) {
			const srcIdx = model.timeline.findIndex((ev) => ev.time === synDragTime);
			const dstIdx = model.timeline.findIndex((ev) => ev.time === synDropTarget);
			if (srcIdx !== -1 && dstIdx !== -1) {
				const tmp = model.timeline[srcIdx].time;
				model.timeline[srcIdx].time = model.timeline[dstIdx].time;
				model.timeline[dstIdx].time = tmp;
				if (selectedTime === synDragTime) selectedTime = model.timeline[srcIdx].time;
			}
		}
		synDragTime = null;
		synDropTarget = null;
	}

	function handleTimelineClick(e: MouseEvent) {
		if (dragging) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		playback.playheadTime = seekFromPixel(e.clientX - rect.left, pixelsPerFrame);
	}

	// ── Event CRUD ──
	function addEvent() {
		const maxT = model.timeline.reduce((max, ev) => Math.max(max, ev.time), -1);
		model.timeline.push({ time: maxT + 10, duration: DEFAULT_DURATION, frame: {} });
		selectedTime = maxT + 10;
	}
	function deleteEvent(e: MouseEvent, time: number) {
		e.stopPropagation();
		if (deleteEventFromModel(model, time) && selectedTime === time) selectedTime = null;
	}
	function duplicateEvent(e: MouseEvent, time: number) {
		e.stopPropagation();
		const src = model.timeline.find((ev) => ev.time === time);
		if (!src) return;
		let free = time + 1;
		while (model.timeline.some((ev) => ev.time === free)) free++;
		model.timeline.push({
			time: free,
			duration: src.duration ?? DEFAULT_DURATION,
			frame: structuredClone(src.frame)
		});
		selectedTime = free;
	}

	// ── Templates save (S17-04) ──
	let saveTemplateFor = $state<number | null>(null);
	let templateNameInput = $state('');

	function openSaveTemplate(e: MouseEvent, time: number) {
		e.stopPropagation();
		saveTemplateFor = time;
		const ev = model.timeline.find((ev) => ev.time === time);
		templateNameInput = ev?.frame.actors?.[0]?.id ? `Frame ${time}` : `Frame ${time}`;
	}
	function confirmSaveTemplate() {
		if (saveTemplateFor === null) return;
		const ev = model.timeline.find((ev) => ev.time === saveTemplateFor);
		if (ev) saveTemplate(templateNameInput, ev.frame);
		saveTemplateFor = null;
		templateNameInput = '';
	}

	// ── Markers (S17-01) ──
	const markers = $derived<Marker[]>(model.markers ?? []);

	function createMarker(frame: number) {
		if (!model.markers) model.markers = [];
		model.markers.push({
			id: `mk_${Date.now()}`,
			time: Math.round(frame),
			label: 'Marker',
			color: '#f59e0b'
		});
	}
	function deleteMarker(id: string) {
		if (!model.markers) return;
		model.markers = model.markers.filter((m) => m.id !== id);
		markerMenu = null;
	}
	function renameMarker(id: string, label: string) {
		if (!model.markers) return;
		const idx = model.markers.findIndex((m) => m.id === id);
		if (idx !== -1) model.markers[idx].label = label;
	}

	interface MarkerMenu {
		id: string;
		x: number;
		y: number;
	}
	let markerMenu = $state<MarkerMenu | null>(null);
	let markerEditLabel = $state('');

	function openMarkerMenu(e: MouseEvent, marker: Marker) {
		e.preventDefault();
		e.stopPropagation();
		markerMenu = { id: marker.id, x: e.clientX, y: e.clientY };
		markerEditLabel = marker.label;
	}

	function handleRulerDblClick(e: MouseEvent) {
		e.stopPropagation();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const scrollLeft = temporalScrollContainer?.scrollLeft ?? 0;
		createMarker((e.clientX - rect.left + scrollLeft) / pixelsPerFrame);
	}

	// ── Keyboard ──
	function handleKeydown(e: KeyboardEvent) {
		if ((e.target as HTMLElement).closest('input, textarea, select')) return;
		if (e.code === 'Space') {
			e.preventDefault();
			togglePlay();
		} else if (e.code === 'Escape' || e.key === '0') {
			stopPlayback();
			multiSelectedTimes = new SvelteSet();
			markerMenu = null;
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			multiSelectedTimes = new SvelteSet(timeline.map((ev) => ev.time));
			selectedTime = null;
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedTime !== null) {
			e.preventDefault();
			duplicateEvent(e as unknown as MouseEvent, selectedTime);
		}
		// Ctrl+Alt+Arrow: navigate markers
		else if (e.ctrlKey && e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
			e.preventDefault();
			const sorted = [...markers].sort((a, b) => a.time - b.time);
			const cur = playback.playheadTime;
			if (e.key === 'ArrowRight') {
				const next = sorted.find((m) => m.time > cur);
				if (next) playback.playheadTime = next.time;
			} else {
				const prev = [...sorted].reverse().find((m) => m.time < cur);
				if (prev) playback.playheadTime = prev.time;
			}
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			cancelAnimationFrame(rafId);
		};
	});

	// ── Tooltip (S16-01) ──
	interface TooltipState {
		visible: boolean;
		x: number;
		y: number;
		label: string;
		character?: string;
		mood?: string;
		action?: string;
		hasSpeech: boolean;
		hasAudio: boolean;
		hasFX: boolean;
	}
	let tooltip = $state<TooltipState>({
		visible: false,
		x: 0,
		y: 0,
		label: '',
		hasSpeech: false,
		hasAudio: false,
		hasFX: false
	});
	let tooltipTimer = 0;

	function showTooltip(e: MouseEvent, ev: (typeof timeline)[0]) {
		clearTimeout(tooltipTimer);
		const firstActor = ev.frame.actors?.[0];
		const charName = firstActor
			? (model.assets.characters.find((c) => c.id === firstActor.id)?.name ?? firstActor.id)
			: undefined;
		tooltipTimer = window.setTimeout(() => {
			tooltip = {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				label: `Frame ${ev.time}`,
				character: charName,
				mood: firstActor?.speech?.mood,
				action: firstActor?.action,
				hasSpeech: !!firstActor?.speech?.text,
				hasAudio: !!ev.frame.audio_tracks?.length,
				hasFX: !!(ev.frame.fx?.bloom || ev.frame.fx?.motion_blur)
			};
		}, 300);
	}
	function hideTooltip() {
		clearTimeout(tooltipTimer);
		tooltip = { ...tooltip, visible: false };
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="flex h-full w-full flex-col gap-4"
	aria-label="Sequence Orchestrator"
	onclick={() => {
		markerMenu = null;
	}}
>
	<!-- ── Synoptic View ── -->
	<section>
		<header class="card-header">
			<h3 class="card-title flex items-center justify-between">
				<span>Synoptic View</span>
				<div style="display:flex;gap:0.25rem;align-items:center;">
					<button
						onclick={() => (compactMode = !compactMode)}
						title="Compact mode"
						style="font-size:var(--text-xs);background:none;border:none;cursor:pointer;color:var(--color-text-muted);"
						>{compactMode ? '⊞' : '⊟'}</button
					>
					<button onclick={addEvent} title="Add event" aria-label="Add timeline event"
						><Plus class="h-4 w-4" /></button
					>
				</div>
			</h3>
		</header>
		<div class="card-content p-0">
			<div
				bind:this={synopticScrollContainer}
				class="overflow-x-auto"
				onscroll={handleSynopticScroll}
				aria-label="Synoptic view scroll container"
			>
				<div class="asset-grid">
					{#if timeline.length === 0}
						<div class="empty-state">
							<p>No timeline events</p>
							<small>Click + to add your first event.</small>
						</div>
					{:else}
						{#if synLeftSpacer > 0}<div
								style="width:{synLeftSpacer}px;flex-shrink:0;"
								aria-hidden="true"
							></div>{/if}
						{#each visibleTimeline as event (event.time)}
							{@const firstActor = event.frame.actors?.[0]}
							{@const charName = firstActor
								? (model.assets.characters.find((c) => c.id === firstActor.id)?.name ??
									firstActor.id)
								: undefined}
							{@const isMultiSelected = multiSelectedTimes.has(event.time)}
							{@const isSynDropTarget = synDropTarget === event.time}
							<div
								class="group relative"
								style={isSynDropTarget ? 'outline: 2px solid #3b82f6; border-radius: 4px;' : ''}
								onmouseenter={(e) => {
									showTooltip(e, event);
									onSynPointerEnter(event.time);
								}}
								onmouseleave={hideTooltip}
								onpointerdown={(e) => startSynDrag(e, event.time)}
								onpointerup={onSynPointerUp}
								role="presentation"
							>
								<TimelineEvent
									item={{
										id: String(event.time),
										label: `Frame ${event.time}`,
										start: event.time,
										end: event.time + (event.duration ?? DEFAULT_DURATION),
										speech: firstActor?.speech?.text,
										mood: firstActor?.speech?.mood,
										action: firstActor?.action,
										character: charName,
										zoom: event.frame.camera?.zoom,
										fx: event.frame.fx,
										audio: event.frame.audio_tracks?.map((t) => ({
											id: t.id,
											volume: t.volume ?? 0
										}))
									}}
									isSelected={selectedTime === event.time || isMultiSelected}
									compact={compactMode}
									onselect={(id) => handleSynopticClick(event as unknown as MouseEvent, event.time)}
								/>
								{#if activeEventTime === event.time}
									<div class="active-indicator" aria-label="Active event"></div>
								{/if}
								<div
									class="absolute right-0.5 top-0.5 hidden gap-0.5 group-hover:flex"
									style="z-index:60;"
								>
									<button
										onclick={(e) => duplicateEvent(e, event.time)}
										title="Duplicate (Ctrl+D)"
										aria-label={`Duplicate frame ${event.time}`}
										class="rounded bg-white p-0.5 text-gray-400 shadow hover:text-blue-600"
										><Copy class="h-3 w-3" /></button
									>
									<button
										onclick={(e) => openSaveTemplate(e, event.time)}
										title="Save as template"
										aria-label={`Save frame ${event.time} as template`}
										class="rounded bg-white p-0.5 text-gray-400 shadow hover:text-purple-600"
										>⊕</button
									>
									<button
										onclick={(e) => deleteEvent(e, event.time)}
										title="Delete"
										aria-label={`Delete frame ${event.time}`}
										class="rounded bg-white p-0.5 text-gray-400 shadow hover:text-red-600"
										><Trash2 class="h-3 w-3" /></button
									>
								</div>
							</div>
						{/each}
						{#if synRightSpacer > 0}<div
								style="width:{synRightSpacer}px;flex-shrink:0;"
								aria-hidden="true"
							></div>{/if}
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ── Temporal Sequencer ── -->
	<section>
		<header class="card-header">
			<h3 class="card-title flex items-center justify-between">
				<span>Temporal Sequencer</span>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-1" role="group" aria-label="Playback controls">
						<button
							onclick={togglePlay}
							title={playback.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
							aria-label={playback.isPlaying ? 'Pause' : 'Play'}
							class="text-xs">{playback.isPlaying ? '⏸' : '▶'}</button
						>
						<button onclick={stopPlayback} title="Stop (Esc)" aria-label="Stop" class="text-xs"
							>■</button
						>
						<span class="tabular-nums text-xs" aria-label="Playhead position"
							>{Math.floor(playback.playheadTime)}</span
						>
					</div>
					<PlaybackBar
						bind:playheadTime={playback.playheadTime}
						{totalDuration}
						fps={FPS}
						on:scrub={(e) => {
							playback.playheadTime = e.detail.frame;
						}}
					/>
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
					<div class="empty-state">
						<p>No timeline events</p>
						<small>Add events to see the sequence here.</small>
					</div>
				</div>
			{:else}
				<!-- Ruler (dblclick = create marker) -->
				<div
					class="ruler"
					ondblclick={handleRulerDblClick}
					title="Double-clic pour créer un marker"
					role="presentation"
				>
					{#each Array.from({ length: Math.floor(maxTime / 10) + 2 }, (_, i) => i * 10) as tick}
						<span class="ruler-tick" style="left:{tick * pixelsPerFrame}px">{tick}</span>
					{/each}
					<!-- Marker flags on ruler -->
					{#each markers as mk (mk.id)}
						<button
							class="marker-flag"
							style="left:{mk.time * pixelsPerFrame}px; background:{mk.color};"
							oncontextmenu={(e) => openMarkerMenu(e, mk)}
							title={mk.label}
							aria-label={`Marker: ${mk.label}`}>{mk.label.slice(0, 6)}</button
						>
					{/each}
				</div>

				<div
					bind:this={temporalScrollContainer}
					class="relative overflow-x-auto"
					style="height: 72px;"
					onclick={handleTimelineClick}
					onscroll={handleTemporalScroll}
					aria-label="Timeline track"
					role="presentation"
				>
					<div class="relative h-full" style="width: {containerWidth}px;">
						<!-- Playhead -->
						<div
							class="pointer-events-none absolute top-0 z-10 h-full w-px bg-red-500"
							style="left: {playback.playheadTime * pixelsPerFrame}px;"
							aria-label={`Playhead at frame ${playback.playheadTime}`}
						>
							<div class="h-2 w-2 -translate-x-[3px] rounded-full bg-red-500"></div>
						</div>

						<!-- Marker lines in track -->
						{#each markers as mk (mk.id)}
							<div
								class="pointer-events-none absolute top-0 h-full w-px opacity-60"
								style="left:{mk.time * pixelsPerFrame}px; background:{mk.color};"
							></div>
						{/each}

						<!-- Event blocks -->
						{#each timeline as event (event.time)}
							{@const isDragging = dragging?.startTime === event.time}
							{@const displayTime = isDragging ? dragging!.previewTime : event.time}
							{@const isActive = activeEventTime === event.time}
							{@const isMulti = multiSelectedTimes.has(event.time)}
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
								class={`absolute top-4 flex cursor-grab flex-col items-center justify-center rounded border text-xs transition-colors ${isDragging ? 'cursor-grabbing opacity-80 shadow-lg' : ''} ${isActive ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : isMulti ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : selectedTime === event.time ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
								style="left: {displayTime * pixelsPerFrame}px; width: {blockWidth(
									event
								)}px; height: 48px;"
								aria-label={`Time ${event.time}`}
								aria-selected={selectedTime === event.time || isMulti}
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
		<header class="card-header"><h3 class="card-title">Audio Timeline</h3></header>
		<div class="card-content"><AudioTimeline audioAssets={model.assets.audio} /></div>
	</section>
</div>

<!-- S16-01: Tooltip -->
{#if tooltip.visible}
	<EventTooltip
		label={tooltip.label}
		character={tooltip.character}
		mood={tooltip.mood}
		action={tooltip.action}
		hasSpeech={tooltip.hasSpeech}
		hasAudio={tooltip.hasAudio}
		hasFX={tooltip.hasFX}
		x={tooltip.x}
		y={tooltip.y}
	/>
{/if}

<!-- S17-02: Multi-selection toolbar -->
{#if multiSelectedTimes.size >= 2}
	<SelectionToolbar
		count={multiSelectedTimes.size}
		ondelete={deleteSelected}
		onduplicate={duplicateSelected}
		onshift={shiftSelected}
		onclear={() => {
			multiSelectedTimes = new Set();
		}}
	/>
{/if}

<!-- S17-01: Marker context menu -->
{#if markerMenu}
	{@const mk = markers.find((m) => m.id === markerMenu!.id)}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="marker-menu card"
		style="left:{markerMenu.x}px;top:{markerMenu.y}px;"
		onclick={(e) => e.stopPropagation()}
		role="menu"
	>
		{#if mk}
			<input
				type="text"
				bind:value={markerEditLabel}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						renameMarker(mk.id, markerEditLabel);
						markerMenu = null;
					}
				}}
				style="width:100%;font-size:var(--text-xs);margin-bottom:0.25rem;"
				aria-label="Marker label"
			/>
			<button
				onclick={() => {
					renameMarker(mk.id, markerEditLabel);
					markerMenu = null;
				}}
				class="marker-menu-btn">Renommer</button
			>
			<input
				type="color"
				bind:value={mk.color}
				style="width:100%;height:1.4rem;cursor:pointer;margin:0.2rem 0;"
				title="Couleur"
			/>
			<button onclick={() => deleteMarker(mk.id)} class="marker-menu-btn marker-menu-btn-danger"
				>Supprimer</button
			>
		{/if}
	</div>
{/if}

<!-- S17-04: Save template dialog -->
{#if saveTemplateFor !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="overlay-dim" onclick={() => (saveTemplateFor = null)}>
		<div class="card template-dialog" onclick={(e) => e.stopPropagation()} role="dialog">
			<div style="font-size:var(--text-sm);font-weight:600;margin-bottom:0.5rem;">
				Sauvegarder comme template
			</div>
			<input
				type="text"
				bind:value={templateNameInput}
				placeholder="Nom du template"
				style="width:100%;margin-bottom:0.5rem;"
				aria-label="Template name"
			/>
			<div style="display:flex;gap:0.5rem;justify-content:flex-end;">
				<button onclick={() => (saveTemplateFor = null)} class="btn-secondary">Annuler</button>
				<button onclick={confirmSaveTemplate} class="btn-primary">Sauvegarder</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.active-indicator {
		position: absolute;
		inset: 0;
		border: 2px solid #facc15;
		border-radius: var(--radius-sm, 4px);
		pointer-events: none;
		z-index: 55;
	}
	.ruler {
		position: relative;
		height: 18px;
		background: var(--color-surface-2);
		border-bottom: var(--border-width) solid var(--color-border);
		overflow: hidden;
		cursor: crosshair;
	}
	.ruler-tick {
		position: absolute;
		top: 4px;
		font-size: 9px;
		color: var(--color-text-muted);
		transform: translateX(-50%);
		pointer-events: none;
		user-select: none;
	}
	.marker-flag {
		position: absolute;
		top: 0;
		height: 100%;
		padding: 0 3px;
		font-size: 8px;
		font-weight: 700;
		color: #fff;
		border: none;
		cursor: context-menu;
		white-space: nowrap;
		overflow: hidden;
		max-width: 48px;
		border-radius: 0 2px 2px 0;
		z-index: 5;
	}
	.marker-menu {
		position: fixed;
		z-index: 400;
		min-width: 140px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: var(--text-xs);
	}
	.marker-menu-btn {
		background: var(--color-surface-2);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		font-size: var(--text-xs);
		text-align: left;
	}
	.marker-menu-btn-danger {
		color: var(--color-danger, #f38ba8);
	}
	.overlay-dim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.template-dialog {
		width: 280px;
		padding: 1rem;
	}
</style>
