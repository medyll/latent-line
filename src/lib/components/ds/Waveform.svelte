<!-- Waveform.svelte — Animated audio waveform bars -->
<script lang="ts">
	interface Props {
		bars?: number;
		color?: string;
		height?: number;
		animated?: boolean;
	}

	let { bars = 120, color = 'var(--text-muted)', height = 32, animated = true }: Props = $props();

	function generateHeights(count: number) {
		const out: number[] = [];
		for (let i = 0; i < count; i++) {
			// simulate a waveform with some pattern
			const base = Math.sin(i * 0.15) * 0.3 + 0.5;
			const noise = Math.random() * 0.4;
			out.push(Math.max(0.1, Math.min(1, base + noise)));
		}
		return out;
	}

	let heights = $state<number[]>([]);
	$effect(() => {
		heights = generateHeights(bars);
	});

	$effect(() => {
		if (!animated) return;
		const id = setInterval(() => {
			heights = generateHeights(bars);
		}, 1200);
		return () => clearInterval(id);
	});
</script>

<div class="waveform" style="height:{height}px; --wf-color:{color}">
	{#each heights as h, i}
		<div class="wf-bar" style="height:{Math.round(h * 100)}%; animation-delay:{i * 8}ms"></div>
	{/each}
</div>

<style>
	.waveform {
		display: flex;
		align-items: center;
		gap: 1px;
		width: 100%;
		padding: 0 0.75rem;
		overflow: hidden;
	}

	.wf-bar {
		flex: 1;
		min-width: 2px;
		background: var(--wf-color);
		border-radius: 1px;
		transition: height 800ms ease;
		opacity: 0.5;
	}
</style>
