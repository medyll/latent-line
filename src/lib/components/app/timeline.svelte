<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Label } from '$lib/components/ui/label';
	import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';
	import AssetManager from './AssetManager.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import SystemFooter from './SystemFooter.svelte';
	import TimeLineEvent from './TimelineEvent.svelte';

	// Demo asset list for sidebar
	let assets = [
		{ id: 'asset_1', name: 'Asset One', details: 'On testnet' },
		{ id: 'asset_2', name: 'Asset Two', details: 'On mainnet' }
	];
	let selected = $state(assets[0]);

	let zoom = $state(100);
	let selectedEventId = $state<string | null>(null);
	import exampleModel from '$lib/model/model-story-example';

	// Timeline is now already an array
	const timelineEvents = exampleModel.timeline.map((event, idx) => {
		// Extract main actor speech and action for MVP info
		const actor = event.frame.actors && event.frame.actors[0];
		return {
			id: `event_${idx}`,
			label: `Event ${idx + 1}`,
			start: event.time,
			end: event.time + 10,
			speech: actor && actor.speech ? actor.speech.text : '',
			mood: actor && actor.speech ? actor.speech.mood : '',
			action: actor && actor.action ? actor.action : '',
			zoom: event.frame.camera && event.frame.camera.zoom,
			fx: event.frame.fx,
			audio: (event.frame.audio_tracks || []).map((track) => ({
				id: track.id,
				volume: track.volume ?? 0
			})),
			timelineFrame: event.frame
		};
	});

	function selectEvent(eventId: string) {
		selectedEventId = selectedEventId === eventId ? null : eventId;
	}
</script>

<!-- Timeline with sidebar layout -->
<div class="conteiner flex h-full flex-row">
	<!-- Sidebar -->
	<aside class="flex h-full min-h-0 w-64 max-w-48 min-w-48 flex-col border-r bg-zinc-50">
		<div class="mb-4 text-lg font-bold">Assets</div>
		<div class="flex flex-1 flex-col gap-2">
			<!-- AssetManager stylé -->
			<div class="bg-zinc-100 p-2">
				<AssetManager />
			</div>
		</div>
	</aside>

	<!-- Main timeline area : SynopticGrid  -->
	<div class="flex min-w-0 flex-1 flex-col">
		<Resizable.PaneGroup direction="vertical" class="h-[400px] w-full ">
			<Resizable.Pane defaultSize={80}>
				<div class="flex h-full flex-col">
					<div>
						<div>Timeline</div>
					</div>
					<div class="flex flex-1 flex-col p-0">
						<div class="flex items-center gap-4 border-b p-2">
							<!-- Zoom slider -->
							<Label for="zoom-slider">Zoom</Label>
							<Slider
								id="zoom-slider"
								type="single"
								bind:value={zoom}
								min={10}
								max={400}
								step={1}
								class="w-[200px]"
							/>
							<span>{zoom}%</span>
						</div>
						<ScrollArea orientation="vertical" class="w-full flex-1 overflow-y-auto">
							<div class="flex h-[100%] w-full max-w-full items-start">
								{#if timelineEvents.length === 0}
									<!-- Empty state for timeline -->
									<Empty>
										<EmptyHeader>
											<EmptyTitle>No timeline items</EmptyTitle>
											<EmptyDescription>Add clips to the timeline.</EmptyDescription>
										</EmptyHeader>
									</Empty>
								{:else}
									<!-- Timeline clips en vignettes -->
									<div class="flex w-full flex-row flex-wrap gap-2 px-2">
										{#each timelineEvents as item (item.id)}
											<div
												onclick={() => selectEvent(item.id)}
												onkeydown={(e) => e.key === 'Enter' && selectEvent(item.id)}
												role="button"
												tabindex="0"
												class={selectedEventId === item.id ? 'ring-2 ring-blue-500' : ''}
											>
												<TimeLineEvent {item} isSelected={selectedEventId === item.id} />
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</ScrollArea>
					</div>
				</div>
			</Resizable.Pane>
			<Resizable.Handle />
			<Resizable.Pane defaultSize={20}>
				<div class="container">
					<ScrollArea orientation="horizontal" class="w-full flex-1 overflow-x-auto">
						<div class="  flex w-full max-w-full items-center p-2">
							<!-- Timeline controls or details placeholder -->
							{#each timelineEvents as item (item.id)}
								<div
									class="h-32 w-32 cursor-pointer border-r"
									style="left:calc({item.start * zoom}px); width:calc(({item.end -
										item.start} * zoom)px);"
								>
									{item.label}
								</div>
							{/each}
						</div>
					</ScrollArea>
				</div>
			</Resizable.Pane>
		</Resizable.PaneGroup>
		<!-- PropertiesPanel intégré sous la timeline -->
		<div class="mt-4">
			<PropertiesPanel {selectedEventId} {timelineEvents} />
		</div>
		<!-- SystemFooter intégré en bas -->
		<!-- <div class="mt-2">
			<SystemFooter />
		</div> -->
	</div>
</div>
