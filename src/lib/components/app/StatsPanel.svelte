<script lang="ts">
	/**
	 * StatsPanel.svelte
	 * Displays timeline statistics dashboard.
	 */

	import type { Model } from '$lib/model/model-types';
	import {
		calculateStats,
		formatDuration,
		getTopCharacters,
		getMoodBreakdown,
		exportStatsToJson
	} from '$lib/utils/stats-calculator';

	let { model }: { model: Model } = $props();

	const stats = $derived(calculateStats(model));
	const topChars = $derived(getTopCharacters(model));
	const moodBreakdown = $derived(getMoodBreakdown(model));

	function handleExport() {
		const json = exportStatsToJson(model);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'timeline-stats.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatMoodLabel(mood: string): string {
		return mood.charAt(0).toUpperCase() + mood.slice(1);
	}
</script>

<div class="stats-panel" role="region" aria-label="Timeline statistics">
	<!-- Summary Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<span class="stat-value">{stats.totalEvents}</span>
			<span class="stat-label">Events</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{formatDuration(stats.totalDuration)}</span>
			<span class="stat-label">Duration</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{Math.round(stats.averageEventDuration)}</span>
			<span class="stat-label">Avg Duration</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{stats.markerCount}</span>
			<span class="stat-label">Markers</span>
		</div>
	</div>

	<!-- Character Screen Time -->
	{#if topChars.length > 0}
		<div class="stats-section">
			<h3 class="section-title">Character Screen Time</h3>
			<ul class="stat-list" role="list">
				{#each topChars as char (char.id)}
					<li class="stat-list-item">
						<span class="item-name">{char.id}</span>
						<div class="item-bar-container">
							<div
								class="item-bar"
								style="width: {char.percentage}%"
								aria-label="{char.percentage}%"
							></div>
						</div>
						<span class="item-value">{char.percentage}%</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Mood Distribution -->
	{#if moodBreakdown.length > 0}
		<div class="stats-section">
			<h3 class="section-title">Mood Distribution</h3>
			<ul class="stat-list" role="list">
				{#each moodBreakdown as mood (mood.mood)}
					<li class="stat-list-item">
						<span class="item-name">{formatMoodLabel(mood.mood)}</span>
						<span class="item-count">{mood.count}</span>
						<span class="item-value">{mood.percentage}%</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Lighting & FX -->
	<div class="stats-section">
		<h3 class="section-title">Technical</h3>
		<div class="tech-stats">
			<div class="tech-item">
				<span class="tech-label">Camera Movements</span>
				<span class="tech-value">{stats.cameraMovementCount}</span>
			</div>
			<div class="tech-item">
				<span class="tech-label">FX Usage</span>
				<span class="tech-value">{stats.fxCount}</span>
			</div>
			<div class="tech-item">
				<span class="tech-label">Audio Tracks</span>
				<span class="tech-value">{stats.audioTrackCount}</span>
			</div>
		</div>
	</div>

	<!-- Export Button -->
	<div class="stats-actions">
		<button onclick={handleExport} aria-label="Export statistics as JSON">
			Export JSON
		</button>
	</div>
</div>

<style>
	.stats-panel {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.stat-card {
		padding: 12px;
		background-color: var(--color-surface-3);
		border-radius: 6px;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 20px;
		font-weight: 600;
		color: var(--color-text);
	}

	.stat-label {
		display: block;
		font-size: 11px;
		color: var(--color-text-muted);
		margin-top: 4px;
	}

	.stats-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
	}

	.stat-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.stat-list-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}

	.item-name {
		min-width: 80px;
		color: var(--color-text);
	}

	.item-bar-container {
		flex: 1;
		height: 8px;
		background-color: var(--color-surface-3);
		border-radius: 4px;
		overflow: hidden;
	}

	.item-bar {
		height: 100%;
		background-color: var(--color-primary);
		border-radius: 4px;
		transition: width 300ms ease;
	}

	.item-value {
		min-width: 40px;
		text-align: right;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.item-count {
		color: var(--color-text-muted);
		font-size: 11px;
	}

	.tech-stats {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tech-item {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
	}

	.tech-label {
		color: var(--color-text-muted);
	}

	.tech-value {
		font-weight: 500;
		color: var(--color-text);
	}

	.stats-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	button {
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background-color: var(--color-surface-2);
		color: var(--color-text);
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	button:hover {
		background-color: var(--color-surface-3);
	}
</style>
