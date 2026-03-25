<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import PresentationView from '$lib/components/PresentationView.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function handleExit() {
		goto('/app');
	}
</script>

{#if data.error}
	<div class="error-container">
		<h1>Presentation Mode</h1>
		<p class="error-message">{data.error}</p>
		<p class="help-text">
			To start a presentation, use: <code>/present?model=&lt;base64-encoded-model&gt;&index=0</code>
		</p>
		<button onclick={handleExit} class="btn-exit">Return to App</button>
	</div>
{:else if data.model}
	<PresentationView model={data.model} initialIndex={data.startIndex} onExit={handleExit} />
{:else}
	<div class="loading-container">
		<p>Loading presentation...</p>
	</div>
{/if}

<style>
	.error-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-0, #1a1a1a);
		color: var(--color-foreground, #ffffff);
		padding: 40px;
		text-align: center;
		font-family: var(--font-family-sans, 'System', sans-serif);
	}

	h1 {
		font-size: 2rem;
		margin: 0 0 20px;
	}

	.error-message {
		font-size: 1.1rem;
		color: var(--color-error, #ef4444);
		margin: 0 0 20px;
	}

	.help-text {
		font-size: 0.9rem;
		color: var(--color-foreground-secondary, #aaaaaa);
		margin: 0 0 30px;
	}

	code {
		background: var(--color-surface-2, #3a3a3a);
		padding: 4px 8px;
		border-radius: 4px;
		font-family: 'Courier', monospace;
		font-size: 0.8rem;
	}

	.btn-exit {
		padding: 10px 20px;
		background: var(--color-accent, #7c3aed);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-exit:hover {
		background: var(--color-accent-dark, #6d28d9);
	}

	.loading-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-0, #1a1a1a);
		color: var(--color-foreground, #ffffff);
		font-family: var(--font-family-sans, 'System', sans-serif);
	}
</style>
