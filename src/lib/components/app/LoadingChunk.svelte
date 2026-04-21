<script lang="ts">
	import { t } from '$lib/i18n';
	import type { LoadProgress } from '$lib/utils/model-chunker';
	
	interface Props {
		progress: LoadProgress | null;
		isLoading: boolean;
	}
	
	let { progress, isLoading }: Props = $props();
	
	// Animation for progress bar
	let animatedProgress = $state(0);
	
	$effect(() => {
		if (progress) {
			// Smooth animation to target progress
			const interval = setInterval(() => {
				if (animatedProgress < progress.percent) {
					animatedProgress += 2;
				} else if (animatedProgress > progress.percent) {
					animatedProgress -= 1;
				}
			}, 50);
			
			return () => clearInterval(interval);
		} else {
			animatedProgress = 0;
		}
	});
</script>

<div class="loading-chunk" role="status" aria-live="polite">
	<div class="loading-content">
		<div class="spinner" aria-hidden="true"></div>
		
		<div class="loading-text">
			<h3 class="loading-title">
				{isLoading ? t('loading.chunks.title') : t('loading.complete')}
			</h3>
			
			{#if progress}
				<p class="loading-subtitle">
					{t('loading.chunks.progress', { 
						current: progress.chunkIndex + 1, 
						total: progress.totalChunks,
						events: progress.eventsLoaded 
					})}
				</p>
				
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style="width: {animatedProgress}%"
						role="progressbar"
						aria-valuenow={progress.percent}
						aria-valuemin="0"
						aria-valuemax="100"
					></div>
				</div>
				
				<div class="progress-stats">
					<span class="stat">
						<span class="stat-label">{t('loading.chunks.events')}</span>
						<span class="stat-value">{progress.eventsLoaded} / {progress.totalEvents}</span>
					</span>
					<span class="stat">
						<span class="stat-label">{t('loading.chunks.chunks')}</span>
						<span class="stat-value">{progress.chunkIndex + 1} / {progress.totalChunks}</span>
					</span>
					<span class="stat">
						<span class="stat-label">{t('loading.chunks.percent')}</span>
						<span class="stat-value">{progress.percent}%</span>
					</span>
				</div>
			{:else}
				<p class="loading-subtitle">{t('loading.complete.desc')}</p>
			{/if}
		</div>
	</div>
	
	<style>
		.loading-chunk {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: var(--pad-2xl);
			background: var(--color-surface);
			border-radius: var(--radius-lg);
			border: var(--border-width) solid var(--color-border);
			min-height: 300px;
		}
		
		.loading-content {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--gap-lg);
			max-width: 500px;
			width: 100%;
		}
		
		.spinner {
			width: 48px;
			height: 48px;
			border: 4px solid var(--color-border);
			border-top-color: var(--color-primary);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}
		
		@keyframes spin {
			to { transform: rotate(360deg); }
		}
		
		.loading-text {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--gap-sm);
			text-align: center;
		}
		
		.loading-title {
			font-size: var(--text-lg);
			font-weight: var(--font-semibold);
			color: var(--color-text);
			margin: 0;
		}
		
		.loading-subtitle {
			font-size: var(--text-sm);
			color: var(--color-text-muted);
			margin: 0;
		}
		
		.progress-bar {
			width: 100%;
			height: 8px;
			background: var(--color-surface-alt);
			border-radius: var(--radius-full);
			overflow: hidden;
			position: relative;
		}
		
		.progress-fill {
			height: 100%;
			background: linear-gradient(
				90deg,
				var(--color-primary),
				color-mix(in oklch, var(--color-primary) 80%, white)
			);
			border-radius: var(--radius-full);
			transition: width 0.3s ease-out;
			position: relative;
			overflow: hidden;
			
			&::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: linear-gradient(
					90deg,
					transparent,
					rgba(255, 255, 255, 0.3),
					transparent
				);
				animation: shimmer 1.5s infinite;
			}
		}
		
		@keyframes shimmer {
			0% { transform: translateX(-100%); }
			100% { transform: translateX(100%); }
		}
		
		.progress-stats {
			display: flex;
			gap: var(--gap-lg);
			justify-content: center;
			flex-wrap: wrap;
		}
		
		.stat {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--gap-xs);
			padding: var(--pad-sm) var(--pad-md);
			background: var(--color-surface-alt);
			border-radius: var(--radius-md);
			min-width: 80px;
		}
		
		.stat-label {
			font-size: var(--text-xs);
			color: var(--color-text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		
		.stat-value {
			font-size: var(--text-lg);
			font-weight: var(--font-semibold);
			color: var(--color-text);
		}
	</style>
</div>
