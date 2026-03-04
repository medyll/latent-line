<script>
	/**
	 * SequenceOrchestrator.svelte
	 *
	 * @component SequenceOrchestrator
	 * @description Displays a synoptic grid (top) and a temporal sequencer (bottom) for timeline events.
	 * @example <SequenceOrchestrator />
	 */
	import exampleModel from '$lib/model/model-example';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	/**
	 * Timeline store state, as array of events.
	 * @type {Array<any>}
	 */
	// Defensive: timeline is an object, not array
	const timelineStore = $state(exampleModel.timeline ? Object.values(exampleModel.timeline) : []);
</script>

<!--
  SequenceOrchestrator Component
  Shows a synoptic grid (top) and a temporal sequencer (bottom) for timeline events.
-->
<div class="flex h-full w-full flex-col gap-6" aria-label="Sequence Orchestrator">
	<!-- Synoptic View (Top) -->
	<Card>
		<CardHeader>
			<CardTitle>Synoptic View</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="mb-4 flex flex-row flex-wrap gap-2">
				{#if !timelineStore || timelineStore.length === 0}
					<!-- Empty state for synoptic view -->
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No timeline events</EmptyTitle>
							<EmptyDescription>Add events to see the sequence here.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				{:else}
					<!-- List of timeline frames (synoptic) -->
					{#each timelineStore.slice(0, 10) as event (event.time)}
						<div
							class="flex h-24 w-32 flex-col items-center justify-center rounded border bg-gray-50 focus:ring focus:outline"
							aria-label={`Frame ${event.time}`}
						>
							<span class="font-semibold">Frame {event.time}</span>
							<span class="text-xs">Actors: {event.frame.actors?.length || 0}</span>
						</div>
					{/each}
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Temporal Sequencer (Bottom) -->
	<Card>
		<CardHeader>
			<CardTitle>Temporal Sequencer</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex gap-2 overflow-x-auto">
				{#if !timelineStore || timelineStore.length === 0}
					<!-- Empty state for temporal sequencer -->
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No timeline events</EmptyTitle>
							<EmptyDescription>Add events to see the sequence here.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				{:else}
					<!-- List of timeline events (temporal) -->
					{#each timelineStore as event (event.time)}
						<div
							class="flex h-16 w-48 flex-col items-center justify-center rounded border bg-white focus:ring focus:outline"
							aria-label={`Time ${event.time}`}
						>
							<span class="font-semibold">Time {event.time}</span>
							<span class="text-xs">Audio: {event.frame.audio_tracks?.length || 0}</span>
						</div>
					{/each}
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
