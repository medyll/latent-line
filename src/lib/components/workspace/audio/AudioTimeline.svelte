<script lang="ts">
	/**
	 * AudioTimeline.svelte
	 *
	 * @component AudioTimeline
	 * @description Multi-track audio timeline view for SequenceOrchestrator.
	 *              - ST-024: Displays audio lanes below Temporal Sequencer.
	 *              - Mute/solo controls per lane with state persistence.
	 *              - Waveform placeholders for visual reference.
	 * @example <AudioTimeline {model} {audioAssets} />
	 */
	import { getContext } from 'svelte';
	import type { Model, AudioAsset, AudioLaneConfig } from '$lib/model/model-types';
	import { MODEL_STORE_KEY } from '$lib/context/keys';
	import { Volume2, VolumeX } from '@lucide/svelte';

	interface Props {
		audioAssets: AudioAsset[];
	}

	let { audioAssets = [] }: Props = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	// Initialize audio lanes if not already present
	$effect(() => {
		if (!model.config.audioLanes) {
			model.config.audioLanes = [];
		}
	});

	const audioLanes = $derived(model.config.audioLanes ?? []);

	function toggleMute(laneId: string) {
		const lane = audioLanes.find((l) => l.id === laneId);
		if (lane) {
			lane.muted = !lane.muted;
		}
	}

	function toggleSolo(laneId: string) {
		const lane = audioLanes.find((l) => l.id === laneId);
		if (lane) {
			// Clear other solos when soloing
			if (!lane.soloed) {
				audioLanes.forEach((l) => {
					l.soloed = l.id === laneId;
				});
			} else {
				lane.soloed = false;
			}
		}
	}

	function addAudioLane(asset: AudioAsset) {
		if (!model.config.audioLanes) {
			model.config.audioLanes = [];
		}
		// Check if lane already exists
		if (!model.config.audioLanes.find((l) => l.id === asset.id)) {
			model.config.audioLanes.push({
				id: asset.id,
				name: asset.label || asset.id,
				muted: false,
				soloed: false
			});
		}
	}

	function removeLane(laneId: string) {
		if (model.config.audioLanes) {
			model.config.audioLanes = model.config.audioLanes.filter((l) => l.id !== laneId);
		}
	}
</script>

<!--
  AudioTimeline Component
  Displays multi-track audio lanes with mute/solo controls.
  Integrated below Temporal Sequencer for synchronized scrolling.
-->
<div class="flex flex-col gap-2" aria-label="Audio Timeline">
	<!-- Lane controls (add audio) -->
	<div class="flex items-center gap-2 rounded bg-purple-50 p-2">
		<span class="text-xs font-semibold text-purple-600">Audio Tracks</span>
		{#each audioAssets as asset}
			{@const hasLane = audioLanes.find((l) => l.id === asset.id)}
			<button
				onclick={() => (hasLane ? removeLane(asset.id) : addAudioLane(asset))}
				class={`rounded px-2 py-1 text-xs transition-colors ${
					hasLane
						? 'bg-purple-600 text-white hover:bg-purple-700'
						: 'border border-purple-300 text-purple-600 hover:bg-purple-100'
				}`}
				title={hasLane ? 'Remove track' : 'Add track'}
				aria-label={`${hasLane ? 'Remove' : 'Add'} ${asset.label || asset.id}`}
			>
				{asset.label || asset.id}
			</button>
		{/each}
	</div>

	<!-- Audio lanes -->
	<div class="space-y-2">
		{#each audioLanes as lane (lane.id)}
			<div class="flex items-stretch gap-2 rounded border border-purple-200 bg-purple-50 p-2">
				<!-- ST-024: Mute/Solo controls -->
				<div class="flex shrink-0 items-center gap-1">
					<!-- Mute button -->
					<button
						onclick={() => toggleMute(lane.id)}
						class={`rounded p-1 transition-colors ${
							lane.muted
								? 'bg-red-500 text-white hover:bg-red-600'
								: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
						}`}
						title="Mute track (M)"
						aria-label={`Mute ${lane.name}`}
						aria-pressed={lane.muted}
					>
						{#if lane.muted}
							<VolumeX class="h-3 w-3" />
						{:else}
							<Volume2 class="h-3 w-3" />
						{/if}
					</button>

					<!-- Solo button -->
					<button
						onclick={() => toggleSolo(lane.id)}
						class={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
							lane.soloed
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'border border-gray-300 text-gray-600 hover:bg-gray-100'
						}`}
						title="Solo track (S)"
						aria-label={`Solo ${lane.name}`}
						aria-pressed={lane.soloed}
					>
						S
					</button>

					<!-- Remove button -->
					<button
						onclick={() => removeLane(lane.id)}
						class="rounded px-1 py-1 text-xs text-gray-400 hover:text-red-600"
						title="Remove track"
						aria-label={`Remove ${lane.name}`}
					>
						×
					</button>
				</div>

				<!-- Waveform placeholder (ST-024: visual reference) -->
				<div class="flex-1 rounded bg-white p-2">
					<div
						class="flex h-12 flex-col justify-center rounded bg-gradient-to-b from-purple-100 to-purple-50 px-2"
					>
						<div class="text-xs font-semibold text-purple-700">{lane.name}</div>
						<div class="mt-1 flex items-center gap-1">
							<!-- Waveform placeholder bars -->
							{#each Array.from({ length: 12 }) as _, i}
								<div
									class="flex-1 rounded-sm bg-purple-300"
									style="height: {10 + Math.sin(i * 0.5) * 8}px; opacity: {0.5 +
										Math.cos(i * 0.3) * 0.4};"
									aria-label="Waveform bar"
								></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if audioLanes.length === 0}
		<div class="rounded bg-purple-50 p-3 text-center text-xs text-purple-400">
			Click an audio asset above to add a track.
		</div>
	{/if}
</div>
