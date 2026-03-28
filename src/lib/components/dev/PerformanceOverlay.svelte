<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { X } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();

	// Metrics
	const fps = $state(60);
	const frameTime = $state(0);
	const renderCount = $state(0);
	const memoryUsage = $state(0);

	// History for graphs
	const fpsHistory = $state<number[]>([]);
	const memoryHistory = $state<number[]>([]);

	let animationFrame: number;
	let lastTime = performance.now();
	let frameCount = 0;

	function updateMetrics() {
		const now = performance.now();
		const delta = now - lastTime;
		frameCount++;

		// Update FPS every 500ms
		if (delta >= 500) {
			fps = Math.round((frameCount * 1000) / delta);
			frameTime = Math.round(delta / frameCount);
			fpsHistory.push(fps);
			if (fpsHistory.length > 60) fpsHistory.shift();
			frameCount = 0;
			lastTime = now;
		}

		// Memory (if available)
		if ('memory' in performance) {
			const mem = (performance as any).memory;
			memoryUsage = Math.round(mem.usedJSHeapSize / 1024 / 1024);
			memoryHistory.push(memoryUsage);
			if (memoryHistory.length > 60) memoryHistory.shift();
		}

		renderCount++;
		animationFrame = requestAnimationFrame(updateMetrics);
	}

	onMount(() => {
		if (open) {
			animationFrame = requestAnimationFrame(updateMetrics);
		}
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	});

	$effect(() => {
		if (open) {
			animationFrame = requestAnimationFrame(updateMetrics);
		} else {
			cancelAnimationFrame(animationFrame);
		}
	});
</script>

{#if open}
	<div class="performance-overlay">
		<div class="overlay-header">
			<h3>Performance</h3>
			<button class="close-btn" onclick={onClose}>
				<X size={16} />
			</button>
		</div>

		<div class="metrics-grid">
			<div class="metric">
				<div class="metric-label">FPS</div>
				<div class="metric-value {fps < 30 ? 'bad' : fps < 50 ? 'warn' : 'good'}">
					{fps}
				</div>
			</div>

			<div class="metric">
				<div class="metric-label">Frame Time</div>
				<div class="metric-value">{frameTime}ms</div>
			</div>

			<div class="metric">
				<div class="metric-label">Memory</div>
				<div class="metric-value">{memoryUsage} MB</div>
			</div>

			<div class="metric">
				<div class="metric-label">Renders</div>
				<div class="metric-value">{renderCount}</div>
			</div>
		</div>

		<!-- FPS Graph -->
		<div class="graph-container">
			<h4>FPS History</h4>
			<svg class="fps-graph" viewBox="0 0 300 60">
				{#each fpsHistory.map((v, i) => ({ v, i })) as { v, i }}
					<rect
						x={i * 5}
						y={60 - (v / 120) * 60}
						width="4"
						height={(v / 120) * 60}
						class={v < 30 ? 'bad' : v < 50 ? 'warn' : 'good'}
					/>
				{/each}
			</svg>
		</div>

		<!-- Memory Graph -->
		{#if memoryHistory.length > 0}
			<div class="graph-container">
				<h4>Memory (MB)</h4>
				<svg class="memory-graph" viewBox="0 0 300 60">
					{#each memoryHistory.map((v, i) => ({ v, i })) as { v, i }}
						<rect
							x={i * 5}
							y={60 - (v / 500) * 60}
							width="4"
							height={(v / 500) * 60}
							class="memory"
						/>
					{/each}
				</svg>
			</div>
		{/if}
	</div>
{/if}

<style>
	.performance-overlay {
		position: fixed;
		bottom: 16px;
		right: 16px;
		width: 320px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		padding: 12px;
		z-index: 9999;
		font-family: monospace;
		font-size: 11px;
	}

	.overlay-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.overlay-header h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: var(--color-text-muted);
	}

	.close-btn:hover {
		color: var(--color-text);
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		margin-bottom: 12px;
	}

	.metric {
		background: var(--color-surface-2);
		padding: 8px;
		border-radius: 4px;
	}

	.metric-label {
		color: var(--color-text-muted);
		font-size: 10px;
		margin-bottom: 4px;
	}

	.metric-value {
		font-size: 16px;
		font-weight: 600;
	}

	.metric-value.good {
		color: var(--color-success);
	}

	.metric-value.warn {
		color: var(--color-warning);
	}

	.metric-value.bad {
		color: var(--color-error);
	}

	.graph-container {
		margin-top: 12px;
	}

	.graph-container h4 {
		margin: 0 0 8px;
		font-size: 10px;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.fps-graph,
	.memory-graph {
		width: 100%;
		height: 60px;
		background: var(--color-surface-2);
		border-radius: 4px;
	}

	.fps-graph rect.good,
	.memory-graph rect {
		fill: var(--color-success);
	}

	.fps-graph rect.warn {
		fill: var(--color-warning);
	}

	.fps-graph rect.bad {
		fill: var(--color-error);
	}
</style>
