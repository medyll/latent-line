<!-- Timeline.svelte — Horizontal timeline with ruler, events, playhead -->
<script lang="ts">
	import Icon from './Icon.svelte';

	interface TimelineEvent {
		time: number;
		duration: number;
		label: string;
		actors?: number;
		selected?: boolean;
		active?: boolean;
	}

	interface Props {
		events: TimelineEvent[];
		playheadTime?: number;
		zoom?: number;
		fps?: number;
		maxTime?: number;
		selectedTime?: number | null;
		markers?: { time: number; label: string; color?: string }[];
		oneventclick?: (time: number) => void;
		onplayheadseek?: (frame: number) => void;
		onplaytoggle?: () => void;
		onresize?: (time: number, newDuration: number) => void;
	}

	let {
		events,
		playheadTime = $bindable(0),
		zoom = $bindable(1),
		fps = 24,
		maxTime = 600,
		selectedTime = null,
		markers = [],
		oneventclick,
		onplayheadseek,
		onplaytoggle,
		onresize
	}: Props = $props();

	let isPlaying = $state(false);
	let containerEl: HTMLDivElement;

	const pixelsPerFrame = $derived(2 * zoom);
	const totalWidth = $derived(Math.max(600, maxTime * pixelsPerFrame + 80));

	function blockWidth(duration: number) {
		return Math.max(duration * pixelsPerFrame, 32);
	}

	function handleTrackClick(e: MouseEvent) {
		if (!containerEl || dragging) return;
		const rect = containerEl.getBoundingClientRect();
		const frame = Math.round((e.clientX - rect.left + containerEl.scrollLeft) / pixelsPerFrame);
		playheadTime = Math.max(0, frame);
		onplayheadseek?.(playheadTime);
	}

	// Drag
	let dragging = $state<{ startTime: number; startX: number; previewTime: number } | null>(null);

	function startDrag(e: PointerEvent, time: number) {
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragging = { startTime: time, startX: e.clientX, previewTime: time };
	}

	function onDragMove(e: PointerEvent) {
		if (!dragging) return;
		const delta = Math.round((e.clientX - dragging.startX) / pixelsPerFrame);
		dragging = { ...dragging, previewTime: Math.max(0, dragging.startTime + delta) };
	}

	function onDragEnd() {
		dragging = null;
	}

	// ── Resize ────────────────────────────────────────────────────
	let resizing = $state<{
		time: number;
		startX: number;
		startDuration: number;
		previewDuration: number;
		side: 'left' | 'right';
	} | null>(null);

	function startResize(e: PointerEvent, time: number, duration: number, side: 'left' | 'right') {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		resizing = {
			time,
			startX: e.clientX,
			startDuration: duration,
			previewDuration: duration,
			side
		};
	}

	function onResizeMove(e: PointerEvent) {
		if (!resizing) return;
		const deltaPx = e.clientX - resizing.startX;
		const deltaFrames = Math.round(deltaPx / pixelsPerFrame);
		if (resizing.side === 'right') {
			resizing = {
				...resizing,
				previewDuration: Math.max(12, resizing.startDuration + deltaFrames)
			};
		} else {
			resizing = {
				...resizing,
				previewDuration: Math.max(12, resizing.startDuration - deltaFrames)
			};
		}
	}

	function onResizeEnd() {
		if (!resizing) return;
		onresize?.(resizing.time, resizing.previewDuration);
		resizing = null;
	}

	function formatTimecode(frames: number) {
		const totalSeconds = Math.floor(frames / fps);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		const fr = frames % fps;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
	}

	function togglePlay() {
		isPlaying = !isPlaying;
		onplaytoggle?.();
	}

	$effect(() => {
		if (!isPlaying) return;
		let raf = 0;
		let lastTs = 0;
		function tick(ts: number) {
			if (!isPlaying) return;
			if (lastTs === 0) lastTs = ts;
			const elapsed = (ts - lastTs) / 1000;
			lastTs = ts;
			playheadTime = Math.min(playheadTime + elapsed * fps, maxTime);
			raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="timeline" role="application" aria-label="Timeline panel">
	<!-- Controls -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="timeline-controls">
		<button class="tc-btn" onclick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
			<Icon name={isPlaying ? 'pause' : 'play'} size={14} />
		</button>
		<span class="tc-time font-mono">{formatTimecode(Math.floor(playheadTime))}</span>
		<span class="tc-sep">/</span>
		<span class="tc-time font-mono tc-muted">{formatTimecode(maxTime)}</span>

		<div class="tc-zoom">
			<button
				class="tc-btn"
				onclick={() => (zoom = Math.max(0.5, zoom - 0.5))}
				aria-label="Zoom out">−</button
			>
			<input
				type="range"
				min="0.5"
				max="5"
				step="0.5"
				bind:value={zoom}
				class="tc-slider"
				aria-label="Zoom"
			/>
			<button class="tc-btn" onclick={() => (zoom = Math.min(5, zoom + 0.5))} aria-label="Zoom in"
				>+</button
			>
			<span class="tc-zoom-label">{zoom.toFixed(1)}×</span>
		</div>
	</div>

	<!-- Ruler -->
	<div class="timeline-ruler">
		{#each Array.from({ length: Math.floor(maxTime / fps / 5) + 2 }, (_, i) => i * 5 * fps) as tick}
			<span class="ruler-tick" style="left:{tick * pixelsPerFrame}px">
				{Math.floor(tick / fps)}s
			</span>
		{/each}
		{#each markers as mk}
			<span
				class="ruler-marker"
				style="left:{mk.time * pixelsPerFrame}px; background:{mk.color || 'var(--accent2)'}"
				title={mk.label}
			>
				{mk.label}
			</span>
		{/each}
	</div>

	<!-- Track -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="timeline-track"
		bind:this={containerEl}
		onclick={handleTrackClick}
		onkeydown={(e) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				playheadTime = Math.max(0, playheadTime - fps);
				onplayheadseek?.(playheadTime);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				playheadTime = Math.min(maxTime, playheadTime + fps);
				onplayheadseek?.(playheadTime);
			}
		}}
		role="application"
		aria-label="Timeline"
	>
		<div class="track-inner" style="width:{totalWidth}px;">
			<!-- Playhead -->
			<div class="playhead" style="left:{playheadTime * pixelsPerFrame}px" aria-label="Playhead">
				<div class="playhead-cap"></div>
			</div>

			<!-- Marker lines -->
			{#each markers as mk}
				<div
					class="marker-line"
					style="left:{mk.time * pixelsPerFrame}px; background:{mk.color || 'var(--accent2)'}"
				></div>
			{/each}

			<!-- Events -->
			{#each events as ev}
				{@const isDrag = dragging?.startTime === ev.time}
				{@const isResize = resizing?.time === ev.time}
				{@const displayTime = isDrag ? dragging!.previewTime : ev.time}
				{@const displayDuration = isResize ? resizing!.previewDuration : ev.duration}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="event-block"
					class:selected={selectedTime === ev.time || ev.selected}
					class:active={ev.active}
					class:dragging={isDrag}
					class:resizing={isResize}
					style="left:{displayTime * pixelsPerFrame}px; width:{blockWidth(displayDuration)}px"
					onpointerdown={(e) => startDrag(e, ev.time)}
					onpointermove={(e) => {
						onDragMove(e);
						onResizeMove(e);
					}}
					onpointerup={() => {
						onDragEnd();
						onResizeEnd();
					}}
					onpointercancel={() => {
						onDragEnd();
						onResizeEnd();
					}}
					onclick={(e) => {
						e.stopPropagation();
						if (!dragging && !resizing) oneventclick?.(ev.time);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							oneventclick?.(ev.time);
						}
					}}
					role="button"
					tabindex="0"
				>
					<!-- Resize handles -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="resize-handle resize-left"
						onpointerdown={(e) => startResize(e, ev.time, ev.duration, 'left')}
						role="slider"
						aria-label="Resize start of {ev.label}"
						aria-valuemin={0}
						aria-valuemax={ev.time + ev.duration}
						aria-valuenow={ev.time}
						tabindex="0"
					></div>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="resize-handle resize-right"
						onpointerdown={(e) => startResize(e, ev.time, ev.duration, 'right')}
						role="slider"
						aria-label="Resize end of {ev.label}"
						aria-valuemin={ev.time}
						aria-valuemax={maxTime}
						aria-valuenow={ev.time + ev.duration}
						tabindex="0"
					></div>
					<span class="ev-label">{ev.label}</span>
					{#if ev.actors}
						<span class="ev-actors">{ev.actors}A</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}

	.timeline-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface2);
		flex-shrink: 0;
	}

	.tc-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.tc-btn:hover {
		background: var(--surface-hover);
	}

	.tc-time {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}

	.tc-muted {
		color: var(--text-muted);
	}

	.tc-sep {
		color: var(--text-muted);
		font-size: 0.6875rem;
	}

	.tc-zoom {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
	}

	.tc-slider {
		width: 80px;
		height: 4px;
		accent-color: var(--accent2);
	}

	.tc-zoom-label {
		font-size: 0.625rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
		width: 2rem;
		text-align: right;
	}

	.timeline-ruler {
		position: relative;
		height: 20px;
		background: var(--surface2);
		border-bottom: 1px solid var(--border);
		overflow: hidden;
		flex-shrink: 0;
	}

	.ruler-tick {
		position: absolute;
		top: 4px;
		font-size: 0.625rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.ruler-marker {
		position: absolute;
		top: 0;
		height: 100%;
		padding: 0 4px;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #fff;
		border: none;
		border-radius: 0 2px 2px 0;
		white-space: nowrap;
		pointer-events: none;
	}

	.timeline-track {
		position: relative;
		overflow-x: auto;
		overflow-y: hidden;
		height: 64px;
		background: var(--surface);
		cursor: crosshair;
	}

	.track-inner {
		position: relative;
		height: 100%;
	}

	.playhead {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		background: var(--accent);
		z-index: 10;
		pointer-events: none;
	}

	.playhead-cap {
		position: absolute;
		top: -4px;
		left: -3px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
	}

	.marker-line {
		position: absolute;
		top: 0;
		width: 1px;
		height: 100%;
		opacity: 0.4;
		pointer-events: none;
	}

	.event-block {
		position: absolute;
		top: 8px;
		height: 48px;
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: grab;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		font-size: 0.6875rem;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
		user-select: none;
	}

	.event-block:hover {
		border-color: var(--border2);
		background: var(--surface3);
	}

	.event-block.selected {
		border-color: var(--accent2);
		background: color-mix(in oklch, var(--accent2) 8%, var(--surface2));
		box-shadow: 0 0 0 1px oklch(from var(--accent2) h s l / 0.3);
	}

	.event-block.active {
		border-color: var(--accent3);
	}

	.event-block.dragging {
		cursor: grabbing;
		opacity: 0.8;
		z-index: 5;
	}

	.event-block.resizing {
		cursor: col-resize;
		z-index: 5;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 6px;
		cursor: col-resize;
		z-index: 3;
		background: transparent;
		transition: background 0.15s;
	}

	.resize-handle:hover,
	.resize-handle:focus {
		background: oklch(from var(--accent2) h s l / 0.4);
	}

	.resize-left {
		left: 0;
	}

	.resize-right {
		right: 0;
	}

	.ev-label {
		font-weight: 600;
		color: var(--text);
		pointer-events: none;
	}

	.ev-actors {
		font-size: 0.625rem;
		color: var(--text-muted);
		pointer-events: none;
	}
</style>
