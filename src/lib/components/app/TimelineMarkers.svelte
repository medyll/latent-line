<script lang="ts">
	import type { TimelineMarker } from '$lib/model/marker-types';
	import { MARKER_COLORS, MARKER_LABELS } from '$lib/model/marker-types';

	let {
		markers = [],
		zoom = 1,
		onMarkerClick,
		onMarkerContextMenu
	}: {
		markers?: TimelineMarker[];
		zoom?: number;
		onMarkerClick?: (marker: TimelineMarker) => void;
		onMarkerContextMenu?: (marker: TimelineMarker, event: MouseEvent) => void;
	} = $props();

	function msToPixels(ms: number): number {
		// 10px per second at zoom 1
		return (ms / 1000) * zoom * 10;
	}

	function handleMarkerClick(marker: TimelineMarker, event: MouseEvent) {
		event.stopPropagation();
		onMarkerClick?.(marker);
	}

	function handleContextMenu(marker: TimelineMarker, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		onMarkerContextMenu?.(marker, event);
	}

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
</script>

<div class="timeline-markers" role="list" aria-label="Timeline markers">
	{#each markers as marker (marker.id)}
		<div
			class="marker"
			class:marker-chapter={marker.type === 'chapter'}
			class:marker-beat={marker.type === 'beat'}
			class:marker-note={marker.type === 'note'}
			class:marker-cue={marker.type === 'cue'}
			style="left: {msToPixels(marker.time)}px; border-left-color: {marker.color ?? MARKER_COLORS[marker.type]}"
			role="listitem"
			tabindex="0"
			aria-label="{marker.label} at {formatTime(marker.time)}"
			title="{marker.label} ({MARKER_LABELS[marker.type]}) - {formatTime(marker.time)}"
			onclick={(e) => handleMarkerClick(marker, e)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleMarkerClick(marker, e as unknown as MouseEvent);
				}
			}}
			oncontextmenu={(e) => handleContextMenu(marker, e)}
		>
			<span class="marker-flag" style="background-color: {marker.color ?? MARKER_COLORS[marker.type]}">
				{marker.label}
			</span>
		</div>
	{/each}
</div>

<style>
	.timeline-markers {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 24px;
		pointer-events: none;
	}

	.marker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 0;
		border-left-width: 2px;
		border-left-style: solid;
		cursor: pointer;
		pointer-events: all;
		transition: opacity 150ms ease;
	}

	.marker:hover {
		opacity: 1;
	}

	.marker-flag {
		position: absolute;
		top: 26px;
		left: 4px;
		padding: 2px 6px;
		font-size: 10px;
		font-weight: 500;
		color: white;
		background-color: var(--color-primary);
		border-radius: 3px;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.marker:hover .marker-flag {
		opacity: 1;
	}

	/* Marker type variations */
	.marker-chapter {
		z-index: 10;
	}

	.marker-beat {
		z-index: 9;
	}

	.marker-note {
		z-index: 8;
	}

	.marker-cue {
		z-index: 7;
	}

	/* Focus styles for accessibility */
	.marker:focus {
		outline: none;
	}

	.marker:focus .marker-flag {
		opacity: 1;
	}

	.marker:focus-visible {
		box-shadow: 0 0 0 2px var(--color-focus);
	}
</style>
