<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Model, AudioAsset } from '$lib/model/model-types';
	import { MODEL_STORE_KEY } from '$lib/context/keys';
	import { Volume2, VolumeX } from '@lucide/svelte';

	interface Props {
		audioAssets: AudioAsset[];
	}

	let { audioAssets = [] }: Props = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);

	$effect(() => {
		if (!model.config.audioLanes) {
			model.config.audioLanes = [];
		}
	});

	const audioLanes = $derived(model.config.audioLanes ?? []);

	// Waveform cache: laneId → SVG path points
	let waveforms = $state<Record<string, number[]>>({});

	function toggleMute(laneId: string) {
		const lane = audioLanes.find((l) => l.id === laneId);
		if (lane) lane.muted = !lane.muted;
	}

	function toggleSolo(laneId: string) {
		const lane = audioLanes.find((l) => l.id === laneId);
		if (lane) {
			if (!lane.soloed) {
				audioLanes.forEach((l) => { l.soloed = l.id === laneId; });
			} else {
				lane.soloed = false;
			}
		}
	}

	function addAudioLane(asset: AudioAsset) {
		if (!model.config.audioLanes) model.config.audioLanes = [];
		if (!model.config.audioLanes.find((l) => l.id === asset.id)) {
			model.config.audioLanes.push({ id: asset.id, name: asset.label || asset.id, muted: false, soloed: false });
			loadWaveform(asset);
		}
	}

	function removeLane(laneId: string) {
		if (model.config.audioLanes) {
			model.config.audioLanes = model.config.audioLanes.filter((l) => l.id !== laneId);
		}
	}

	// Seeded pseudo-random waveform fallback (no audio decode needed)
	function seedRandom(seed: string): () => number {
		let h = 0;
		for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
		return () => {
			h ^= h >>> 16;
			h = Math.imul(h, 0x45d9f3b);
			h ^= h >>> 16;
			return ((h >>> 0) / 0xffffffff);
		};
	}

	function generateFallbackWaveform(id: string, count = 60): number[] {
		const rand = seedRandom(id);
		const raw = Array.from({ length: count }, () => rand());
		// smooth
		return raw.map((v, i) => {
			const prev = raw[i - 1] ?? v;
			const next = raw[i + 1] ?? v;
			return (prev * 0.25 + v * 0.5 + next * 0.25);
		});
	}

	async function loadWaveform(asset: AudioAsset) {
		if (!asset.url) {
			waveforms[asset.id] = generateFallbackWaveform(asset.id);
			return;
		}
		try {
			const ctx = new AudioContext();
			const res = await fetch(asset.url);
			const buf = await res.arrayBuffer();
			const decoded = await ctx.decodeAudioData(buf);
			const ch = decoded.getChannelData(0);
			const step = Math.floor(ch.length / 60);
			const amplitudes: number[] = [];
			for (let i = 0; i < 60; i++) {
				let sum = 0;
				for (let j = 0; j < step; j++) sum += Math.abs(ch[i * step + j] ?? 0);
				amplitudes.push(sum / step);
			}
			const max = Math.max(...amplitudes, 0.001);
			waveforms[asset.id] = amplitudes.map((v) => v / max);
			ctx.close();
		} catch {
			waveforms[asset.id] = generateFallbackWaveform(asset.id);
		}
	}

	// Build SVG polyline points from amplitude array
	function buildSvgPoints(amplitudes: number[], width = 200, height = 32): string {
		if (!amplitudes.length) return '';
		const mid = height / 2;
		const step = width / amplitudes.length;
		return amplitudes
			.map((v, i) => {
				const x = i * step;
				const h = v * mid * 0.9;
				return `${x},${mid - h} ${x + step * 0.5},${mid - h}`;
			})
			.join(' ');
	}

	onMount(() => {
		// Load waveforms for any lanes already present
		for (const lane of audioLanes) {
			const asset = audioAssets.find((a) => a.id === lane.id);
			if (asset && !waveforms[lane.id]) loadWaveform(asset);
		}
	});
</script>

<div class="audio-timeline" aria-label="Bande-son">
	<!-- Track selector -->
	<div class="track-selector">
		<span class="track-selector-label">Bande-son</span>
		{#each audioAssets as asset}
			{@const hasLane = audioLanes.find((l) => l.id === asset.id)}
			<button
				onclick={() => (hasLane ? removeLane(asset.id) : addAudioLane(asset))}
				class="track-pill {hasLane ? 'active' : ''}"
				title={hasLane ? 'Retirer la piste' : 'Ajouter la piste'}
				aria-label={`${hasLane ? 'Retirer' : 'Ajouter'} ${asset.label || asset.id}`}
			>
				{asset.label || asset.id}
			</button>
		{/each}
	</div>

	<!-- Lanes -->
	<div class="lanes">
		{#each audioLanes as lane (lane.id)}
			{@const amps = waveforms[lane.id] ?? generateFallbackWaveform(lane.id)}
			<div class="lane {lane.muted ? 'lane--muted' : ''}">
				<div class="lane-controls">
					<button
						onclick={() => toggleMute(lane.id)}
						class="ctrl-btn {lane.muted ? 'muted' : ''}"
						title="Mute (M)"
						aria-label={`Mute ${lane.name}`}
						aria-pressed={lane.muted}
					>
						{#if lane.muted}
							<VolumeX class="w-3 h-3" />
						{:else}
							<Volume2 class="w-3 h-3" />
						{/if}
					</button>
					<button
						onclick={() => toggleSolo(lane.id)}
						class="ctrl-btn solo-btn {lane.soloed ? 'soloed' : ''}"
						title="Solo (S)"
						aria-label={`Solo ${lane.name}`}
						aria-pressed={lane.soloed}
					>S</button>
					<button
						onclick={() => removeLane(lane.id)}
						class="ctrl-btn remove-btn"
						title="Retirer la piste"
						aria-label={`Retirer ${lane.name}`}
					>×</button>
				</div>

				<div class="waveform-container">
					<div class="waveform-label">{lane.name}</div>
					<svg
						class="waveform-svg"
						viewBox="0 0 200 32"
						preserveAspectRatio="none"
						aria-label={`Waveform ${lane.name}`}
					>
						<!-- Top half -->
						<polyline
							points={buildSvgPoints(amps, 200, 32)}
							fill="none"
							stroke="oklch(0.65 0.25 280 / {lane.muted ? 0.25 : 0.7})"
							stroke-width="1"
						/>
						<!-- Mirror bottom half -->
						<polyline
							points={amps.map((v, i) => {
								const mid = 16;
								const x = i * (200 / amps.length);
								const h = v * mid * 0.9;
								return `${x},${mid + h}`;
							}).join(' ')}
							fill="none"
							stroke="oklch(0.65 0.25 280 / {lane.muted ? 0.15 : 0.35})"
							stroke-width="1"
						/>
						<!-- Center line -->
						<line x1="0" y1="16" x2="200" y2="16" stroke="oklch(0.65 0.25 280 / 0.15)" stroke-width="0.5" />
					</svg>
				</div>
			</div>
		{/each}

		{#if audioLanes.length === 0}
			<div class="empty-lanes">Ajoute une piste audio ci-dessus.</div>
		{/if}
	</div>
</div>

<style>
	.audio-timeline {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.track-selector {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		background: oklch(0.65 0.25 280 / 0.06);
		border: 1px solid oklch(0.65 0.25 280 / 0.15);
		border-radius: 6px;
		flex-wrap: wrap;
	}

	.track-selector-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: oklch(0.75 0.2 280);
	}

	.track-pill {
		padding: 3px 10px;
		border-radius: 20px;
		border: 1px solid oklch(0.65 0.25 280 / 0.3);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.track-pill.active {
		background: oklch(0.65 0.25 280);
		color: #fff;
		border-color: oklch(0.65 0.25 280);
	}

	.lanes {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.lane {
		display: flex;
		align-items: stretch;
		gap: 6px;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow: hidden;
		background: var(--color-surface);
		transition: opacity 0.15s;
	}

	.lane--muted {
		opacity: 0.5;
	}

	.lane-controls {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px 4px;
		background: var(--color-surface-alt, var(--color-surface));
		border-right: 1px solid var(--color-border);
	}

	.ctrl-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.65rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
	}

	.ctrl-btn.muted {
		background: oklch(0.65 0.18 25);
		color: #fff;
		border-color: oklch(0.65 0.18 25);
	}

	.ctrl-btn.solo-btn.soloed {
		background: oklch(0.65 0.25 280);
		color: #fff;
		border-color: oklch(0.65 0.25 280);
	}

	.ctrl-btn.remove-btn {
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.ctrl-btn.remove-btn:hover {
		color: oklch(0.65 0.18 25);
		border-color: oklch(0.65 0.18 25 / 0.4);
	}

	.waveform-container {
		flex: 1;
		padding: 6px 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.waveform-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.waveform-svg {
		width: 100%;
		height: 32px;
		display: block;
	}

	.empty-lanes {
		padding: 8px 12px;
		text-align: center;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		border: 1px dashed var(--color-border);
		border-radius: 6px;
	}
</style>
