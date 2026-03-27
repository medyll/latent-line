<script lang="ts">
	import type { Model, TimelineEvent } from '$lib/model/model-types';
	import {
		getEventDurationMs,
		handlePresentationKeydown,
		getNextEventIndex,
		formatEventForPresentation
	} from '$lib/utils/presentation';

	interface Props {
		model: Model;
		initialIndex?: number;
		onExit?: () => void;
	}

	let { model, initialIndex = 0, onExit }: Props = $props();

	// State
	let state = $state({
		currentIndex: initialIndex,
		isPlaying: false,
		progress: 0 // 0-1
	});

	let container: HTMLElement | undefined;
	let animationFrameId: number | null = null;
	let playbackStartTime: number | null = null;

	// Derived values
	let currentEvent = $derived(model.timeline[state.currentIndex] || null);
	let eventDurationMs = $derived(getEventDurationMs(currentEvent, model.project.fps));
	let totalEvents = $derived(model.timeline.length);
	let formattedEvent = $derived(formatEventForPresentation(currentEvent));

	// Auto-advance effect
	$effect(() => {
		if (!state.isPlaying) {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			playbackStartTime = null;
			return;
		}

		playbackStartTime = Date.now();

		function updatePlayback() {
			if (!playbackStartTime) return;

			const elapsed = Date.now() - playbackStartTime;
			const progress = Math.min(elapsed / eventDurationMs, 1);

			state.progress = progress;

			if (progress >= 1) {
				// Auto-advance to next event
				const nextIndex = getNextEventIndex(state.currentIndex, totalEvents, true);
				if (nextIndex === state.currentIndex) {
					// At last event, stop playback
					state.isPlaying = false;
					state.progress = 1;
					return;
				}

				state.currentIndex = nextIndex;
				state.progress = 0;
				playbackStartTime = Date.now();
			}

			animationFrameId = requestAnimationFrame(updatePlayback);
		}

		animationFrameId = requestAnimationFrame(updatePlayback);

		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Keyboard handler
	function handleKeydown(e: KeyboardEvent) {
		const key = e.key;

		if (key === 'Escape') {
			e.preventDefault();
			onExit?.();
			return;
		}

		if (key === 'f' || key === 'F') {
			e.preventDefault();
			toggleFullscreen();
			return;
		}

		const nextState = handlePresentationKeydown(key, state, totalEvents);

		if (nextState.currentIndex !== undefined) {
			state.currentIndex = nextState.currentIndex;
			state.progress = 0;
		}

		if (nextState.isPlaying !== undefined) {
			state.isPlaying = nextState.isPlaying;
			playbackStartTime = null;
		}

		// Prevent default behavior for arrow keys in presentation mode
		if (key === 'ArrowLeft' || key === 'ArrowRight' || key === ' ') {
			e.preventDefault();
		}
	}

	async function toggleFullscreen() {
		if (!container) return;

		try {
			if (!document.fullscreenElement) {
				await container.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (err) {
			console.warn('Fullscreen API not available:', err);
		}
	}

	function getCharacterName(characterId: string | null): string {
		if (!characterId) return '';
		const char = model.assets.characters.find((c) => c.id === characterId);
		return char?.name || '';
	}
</script>

<div
	bind:this={container}
	class="presentation-container"
	role="application"
	aria-label="Presentation Mode"
>
	<!-- Event Display -->
	<div class="event-viewport">
		<div class="event-content">
			{#if formattedEvent.action}
				<div class="event-text">
					<h1 class="action">{formattedEvent.action}</h1>

					{#if formattedEvent.character}
						<p class="character">{getCharacterName(formattedEvent.character)}</p>
					{/if}

					{#if formattedEvent.speech}
						<p class="speech">"{formattedEvent.speech}"</p>
					{/if}

					{#if formattedEvent.mood}
						<p class="mood">{formattedEvent.mood}</p>
					{/if}

					{#if formattedEvent.notes}
						<p class="notes">{formattedEvent.notes}</p>
					{/if}
				</div>
			{/if}

			<!-- Event counter -->
			<div class="event-info">
				<span>{state.currentIndex + 1} / {totalEvents}</span>
			</div>
		</div>
	</div>

	<!-- Progress bar -->
	<div class="progress-bar">
		<div class="progress-fill" style="width: {state.progress * 100}%"></div>
	</div>

	<!-- Controls hint -->
	<div class="controls-hint">
		<span> ← → to navigate • P to play • F for fullscreen • ESC to exit </span>
	</div>
</div>

<svelte:document onkeydown={handleKeydown} />

<style>
	.presentation-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(
			135deg,
			var(--color-surface-0, #1a1a1a),
			var(--color-surface-1, #2a2a2a)
		);
		color: var(--color-foreground, #ffffff);
		font-family: var(--font-family-serif, 'Georgia', serif);
		overflow: hidden;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
	}

	.event-viewport {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 60px 40px;
		overflow: hidden;
	}

	.event-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.event-text {
		text-align: center;
		max-width: 90%;
		animation: fadeIn 0.6s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.action {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 700;
		margin: 0 0 20px;
		letter-spacing: -1px;
		line-height: 1.1;
	}

	.character {
		font-size: clamp(1.5rem, 4vw, 2.5rem);
		font-weight: 600;
		margin: 0 0 15px;
		color: var(--color-foreground-secondary, #aaaaaa);
		opacity: 0.8;
	}

	.speech {
		font-size: clamp(1rem, 3vw, 1.5rem);
		margin: 20px 0 10px;
		font-style: italic;
		line-height: 1.6;
		max-width: 800px;
	}

	.mood {
		font-size: clamp(0.875rem, 2vw, 1.25rem);
		margin: 10px 0;
		text-transform: capitalize;
		color: var(--color-foreground-secondary, #aaaaaa);
		opacity: 0.7;
	}

	.notes {
		font-size: clamp(0.875rem, 2vw, 1rem);
		margin: 15px 0 0;
		color: var(--color-foreground-secondary, #aaaaaa);
		opacity: 0.6;
		max-width: 600px;
	}

	.event-info {
		position: absolute;
		bottom: 40px;
		right: 40px;
		font-size: 0.875rem;
		color: var(--color-foreground-secondary, #aaaaaa);
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}

	.progress-bar {
		height: 4px;
		background: var(--color-surface-2, #3a3a3a);
		position: relative;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--color-accent, #7c3aed),
			var(--color-accent-dark, #6d28d9)
		);
		transition: width 50ms linear;
		box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
	}

	.controls-hint {
		padding: 16px 24px;
		font-size: 0.75rem;
		color: var(--color-foreground-secondary, #aaaaaa);
		background: rgba(0, 0, 0, 0.3);
		border-top: 1px solid var(--color-surface-1, #2a2a2a);
		text-align: center;
		opacity: 0.7;
		transition: opacity 0.3s;
	}

	.controls-hint:hover {
		opacity: 1;
	}

	/* Fullscreen styles */
	:global(.presentation-container:fullscreen) {
		border: none;
	}

	/* Accessibility: focus visible */
	:focus-visible {
		outline: 2px solid var(--color-accent, #7c3aed);
		outline-offset: 2px;
	}

	/* Mobile/tablet adjustments */
	@media (max-width: 768px) {
		.event-viewport {
			padding: 40px 24px;
		}

		.controls-hint {
			font-size: 0.65rem;
			padding: 12px 16px;
		}

		.event-info {
			bottom: 24px;
			right: 24px;
		}
	}
</style>
