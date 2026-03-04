<script lang="ts">
	import { MessageCircle, Smile, Activity, ZoomIn, Sparkles, Volume2 } from '@lucide/svelte';
	/**
	 * TimeLineEvent.svelte
	 * @component TimeLineEvent
	 * @description Affiche un événement de la timeline.
	 * @example <TimeLineEvent item={event} />
	 */
	export let item: {
		id: string;
		label: string;
		start: number;
		end: number;
		speech?: string;
		mood?: string;
		action?: string;
		zoom?: number;
		fx?: any;
		audio?: Array<{ id: string; volume: number }>;
	};
</script>

<div
	class="flex h-64 w-64 cursor-pointer flex-col items-start justify-start p-4 shadow-md"
	aria-label={`Timeline event ${item.label}`}
>
	<div class="mb-2 text-lg font-bold">{item.label}</div>
	<div class="text-xs">Début: {item.start}</div>
	<div class="text-xs">Fin: {item.end}</div>
	{#if item.speech}
		<div class="mt-2 flex items-center gap-2 text-sm text-gray-700 italic dark:text-gray-300">
			<MessageCircle class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Speech" />
			<span>"{item.speech}"</span>
		</div>
	{/if}
	{#if item.mood}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Smile class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Mood" />
			<span>Mood: {item.mood}</span>
		</div>
	{/if}
	{#if item.action}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Activity class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Action" />
			<span>Action: {item.action}</span>
		</div>
	{/if}
	{#if item.zoom}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<ZoomIn class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Zoom" />
			<span>Zoom: {item.zoom}</span>
		</div>
	{/if}
	{#if item.fx && item.fx.bloom}
		<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Sparkles class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Bloom" />
			<span>Bloom: {item.fx.bloom}</span>
		</div>
	{/if}
	{#if item.audio && item.audio.length > 0}
		<div class="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
			<Volume2 class="h-4 w-4 text-gray-400" stroke-width="1.5" aria-label="Audio" />
			<span>Audio:</span>
			<span class="flex flex-wrap gap-2">
				{#each item.audio as track}
					<span class="mr-2">{track.id} ({track.volume})</span>
				{/each}
			</span>
		</div>
	{/if}
</div>
