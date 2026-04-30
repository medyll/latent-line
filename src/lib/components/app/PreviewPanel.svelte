<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { MODEL_STORE_KEY, PLAYBACK_CONTEXT_KEY } from '$lib/context/keys';
	import type { Model, TimelineEvent } from '$lib/model/model-types';
	import type { PlaybackStore } from '$lib/context/playback-context.svelte';
	import { getMoodColor } from '$lib/model/mood-palette';
	import { generation } from '$lib/stores/generation.svelte';
	import { generatedImages } from '$lib/stores/generated-images.svelte';

	const model = getContext<Model>(MODEL_STORE_KEY);
	const playback = getContext<PlaybackStore>(PLAYBACK_CONTEXT_KEY);

	let isFullscreen = $state(false);

	const DEFAULT_DURATION = 24;

	/** Event whose time window contains the playhead */
	const activeEvent = $derived<TimelineEvent | null>(() => {
		const t = playback.playheadTime;
		// find event that spans playhead
		const active = model.timeline.find(
			(ev) => t >= ev.time && t < ev.time + (ev.duration ?? DEFAULT_DURATION)
		);
		if (active) return active;
		// fallback: closest event before playhead
		const before = [...model.timeline].filter((ev) => ev.time <= t).sort((a, b) => b.time - a.time);
		return before[0] ?? model.timeline[0] ?? null;
	});

	const firstActor = $derived(activeEvent?.frame?.actors?.[0] ?? null);
	const envKey = $derived(Object.keys(model.assets.environments)[0] ?? null);
	const moodColor = $derived(getMoodColor(firstActor?.speech?.mood));

	const characterName = $derived(() => {
		if (!firstActor) return null;
		return model.assets.characters.find((c) => c.id === firstActor.id)?.name ?? firstActor.id;
	});

	let activeImageSrc = $state<string | undefined>();
	let lastLoadedEventId = $state<string | undefined>();

	// Load persisted image when active event changes
	// TimelineEvent uses `time` as key, not `id`
	$effect(() => {
		const ev = activeEvent as any;
		const eventId = ev ? String(ev.time) : undefined;
		if (!eventId || eventId === lastLoadedEventId) return;
		lastLoadedEventId = eventId;
		activeImageSrc = undefined;
		generatedImages.get(eventId).then((saved) => {
			if (saved?.image_base64) {
				activeImageSrc = `data:image/png;base64,${saved.image_base64}`;
			}
		});
	});

	// React to live generation completing for active event
	$effect(() => {
		const ev = activeEvent as any;
		const eventId = ev ? String(ev.time) : undefined;
		if (!eventId) return;
		const unsubscribe = generation.subscribe((map) => {
			const state = map.get(eventId);
			if (state?.status === 'done' && state.image_base64) {
				activeImageSrc = `data:image/png;base64,${state.image_base64}`;
			}
		});
		return unsubscribe;
	});

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'f' || e.key === 'F') toggleFullscreen();
	}}
/>

<div class="preview-panel {isFullscreen ? 'fullscreen' : ''}">
	<header class="preview-header">
		<span class="preview-title">Preview</span>
		<div class="preview-controls">
			<button
				onclick={() => {
					playback.isPlaying = !playback.isPlaying;
				}}
				title={playback.isPlaying ? 'Pause' : 'Play'}
				class="ctrl-btn">{playback.isPlaying ? '⏸' : '▶'}</button
			>
			<button
				onclick={() => {
					playback.isPlaying = false;
					playback.playheadTime = 0;
				}}
				title="Stop"
				class="ctrl-btn">■</button
			>
			<span class="frame-counter">{Math.floor(playback.playheadTime)}f</span>
			<button onclick={toggleFullscreen} title="Toggle fullscreen (F)" class="ctrl-btn">
				{isFullscreen ? '⊡' : '⊞'}
			</button>
		</div>
	</header>

	<div
		class="preview-stage"
		style={moodColor
			? `background: ${moodColor.bg}; border-left: 3px solid ${moodColor.border};`
			: ''}
	>
		{#if !activeEvent}
			<div class="preview-empty">No event at playhead</div>
		{:else}
			<div class="preview-event">
				{#if activeImageSrc}
					<div class="preview-generated-frame">
						<img src={activeImageSrc} alt="Generated frame" class="preview-frame-img" />
						<span class="preview-ai-badge">✦ AI</span>
					</div>
				{:else if moodColor}
					<div class="preview-frame-placeholder" style="background:{moodColor.bg};border:1px solid {moodColor.border};">
						<span style="color:{moodColor.text};opacity:0.5;font-size:1.5rem;">🎬</span>
					</div>
				{/if}
				<div class="preview-frame-label">Frame {activeEvent.time}</div>

				{#if characterName()}
					<div class="preview-character">👤 {characterName()}</div>
				{/if}

				{#if firstActor?.speech?.mood}
					<div class="preview-mood" style={moodColor ? `color:${moodColor.text}` : ''}>
						🎭 {firstActor.speech.mood}
					</div>
				{/if}

				{#if firstActor?.action}
					<div class="preview-action">⚡ {firstActor.action}</div>
				{/if}

				{#if firstActor?.speech?.text}
					<div class="preview-speech">
						<span class="speech-bubble">"{firstActor.speech.text}"</span>
					</div>
				{/if}

				{#if envKey}
					<div class="preview-env">🌍 {envKey}</div>
				{/if}

				{#if activeEvent.frame.camera}
					<div class="preview-camera">📷 zoom {activeEvent.frame.camera.zoom ?? 1}×</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.preview-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-surface);
		font-size: var(--text-xs);
	}
	.preview-panel.fullscreen {
		position: fixed;
		inset: 0;
		z-index: 250;
		background: var(--color-surface);
	}
	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		border-bottom: var(--border-width) solid var(--color-border);
		flex-shrink: 0;
		height: 28px;
	}
	.preview-title {
		font-weight: 600;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}
	.preview-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.ctrl-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
		padding: 0 0.15rem;
	}
	.ctrl-btn:hover {
		color: var(--color-text);
	}
	.frame-counter {
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		min-width: 2.5rem;
	}
	.preview-stage {
		flex: 1;
		padding: 0.75rem;
		overflow-y: auto;
		transition:
			background 0.15s,
			border-left-color 0.15s;
	}
	.preview-empty {
		color: var(--color-text-muted);
		text-align: center;
		padding: 1rem 0;
	}
	.preview-event {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.preview-frame-label {
		font-weight: 700;
		font-size: var(--text-sm);
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}
	.preview-character {
		color: var(--color-text);
	}
	.preview-mood {
		font-weight: 600;
	}
	.preview-action {
		color: var(--color-text-muted);
	}
	.preview-speech {
		margin-top: 0.25rem;
	}
	.speech-bubble {
		display: block;
		background: var(--color-surface-2);
		border-radius: var(--radius-sm);
		padding: 0.35rem 0.5rem;
		font-style: italic;
		color: var(--color-text);
		line-height: 1.4;
	}
	.preview-env,
	.preview-camera {
		color: var(--color-text-muted);
	}
	.preview-generated-frame {
		position: relative;
		width: 100%;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.5rem;
		box-shadow: 0 0 0 1px oklch(0.65 0.25 280 / 0.4), 0 0 12px oklch(0.65 0.25 280 / 0.15);
	}
	.preview-frame-img {
		width: 100%;
		display: block;
		object-fit: cover;
		max-height: 160px;
	}
	.preview-ai-badge {
		position: absolute;
		bottom: 6px;
		right: 6px;
		font-size: 0.65rem;
		font-weight: 700;
		background: oklch(0.65 0.25 280 / 0.85);
		color: #fff;
		padding: 2px 6px;
		border-radius: 3px;
	}
	.preview-frame-placeholder {
		width: 100%;
		height: 80px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.5rem;
	}
</style>
