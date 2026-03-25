<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatFramesToTime } from '$lib/utils/time-format';

	export let playheadTime: number = 0; // frames
	export let totalDuration: number = 0; // frames
	export let fps: number = 24;

	const dispatch = createEventDispatcher();

	function onInput(e: Event) {
		const v = Number((e.target as HTMLInputElement).value);
		playheadTime = v;
		dispatch('scrub', { frame: v });
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.target as HTMLElement).closest('input, textarea, select')) return;
		if (e.key === 'ArrowLeft') {
			playheadTime = Math.max(0, Math.round(playheadTime) - 1);
			dispatch('scrub', { frame: playheadTime });
			e.preventDefault();
		} else if (e.key === 'ArrowRight') {
			playheadTime = Math.min(totalDuration, Math.round(playheadTime) + 1);
			dispatch('scrub', { frame: playheadTime });
			e.preventDefault();
		} else if (e.key === 'Home') {
			playheadTime = 0;
			dispatch('scrub', { frame: playheadTime });
			e.preventDefault();
		} else if (e.key === 'End') {
			playheadTime = totalDuration;
			dispatch('scrub', { frame: playheadTime });
			e.preventDefault();
		}
	}
</script>

<div class="flex items-center gap-2 playback-bar" role="group" aria-label="Playback progress">
	<input
		type="range"
		min="0"
		max={Math.max(0, totalDuration)}
		step="1"
		bind:value={playheadTime}
		on:input={onInput}
		on:keydown={onKeydown}
		aria-label="Playback scrubber"
		class="w-48"
	/>
	<div class="text-xs tabular-nums" aria-live="polite">
		{formatFramesToTime(Math.round(playheadTime), fps)} / {formatFramesToTime(
			Math.round(totalDuration),
			fps
		)}
	</div>
</div>
