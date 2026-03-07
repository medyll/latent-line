<script lang="ts">
	/**
	 * SequenceOrchestrator.svelte
	 *
	 * @component SequenceOrchestrator
	 * @description Displays a synoptic grid (top) and a temporal sequencer (bottom) for timeline events.
	 *              Both views share a selection state exposed via $bindable selectedTime.
	 * @example <SequenceOrchestrator bind:selectedTime />
	 */
	import exampleModel from '$lib/model/model-example';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';

	let { selectedTime = $bindable<number | null>(null) }: { selectedTime?: number | null } =
		$props();

	import { toTimelineArray } from '$lib/model/timeline-utils';

	const timelineStore = $state(toTimelineArray(exampleModel.timeline));

	function selectEvent(time: number) {
		selectedTime = selectedTime === time ? null : time;
	}
</script>

<!--
  SequenceOrchestrator Component
  Synoptic grid (top) and temporal sequencer (bottom) with shared selection state.
-->
<div class="flex h-full w-full flex-col gap-6" aria-label="Sequence Orchestrator">
	<!-- Synoptic View (Top) -->
	<Card>
		<CardHeader>
			<CardTitle>Synoptic View</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="mb-4 flex flex-row flex-wrap gap-2">
				{#if timelineStore.length === 0}
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No timeline events</EmptyTitle>
							<EmptyDescription>Add events to see the sequence here.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				{:else}
					{#each timelineStore.slice(0, 10) as event (event.time)}
						<div
							onclick={() => selectEvent(event.time)}
							onkeydown={(e) => e.key === 'Enter' && selectEvent(event.time)}
							role="button"
							tabindex="0"
							class={`flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded border transition-colors ${selectedTime === event.time ? 'border-blue-500 bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
							aria-label={`Frame ${event.time}`}
							aria-selected={selectedTime === event.time}
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
				{#if timelineStore.length === 0}
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No timeline events</EmptyTitle>
							<EmptyDescription>Add events to see the sequence here.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				{:else}
					{#each timelineStore as event (event.time)}
						<div
							onclick={() => selectEvent(event.time)}
							onkeydown={(e) => e.key === 'Enter' && selectEvent(event.time)}
							role="button"
							tabindex="0"
							class={`flex h-16 w-48 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded border transition-colors ${selectedTime === event.time ? 'border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
							aria-label={`Time ${event.time}`}
							aria-selected={selectedTime === event.time}
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
