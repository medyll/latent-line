<script lang="ts">
	import { onMount } from 'svelte';
	import { createModelStore } from '$lib/model/model-store.svelte';
	import LoadingChunk from '$lib/components/app/LoadingChunk.svelte';
	import Timeline from './Timeline.svelte';
	import { t } from '$lib/i18n';
	
	// Example model import (in real app, this comes from API or file)
	import exampleModel from '$lib/model/model-example';
	
	const { model, loadLargeModel, isLoadingLarge, loadProgress, isLargeModel } = createModelStore();
	
	let showChunkLoader = $state(false);
	
	onMount(async () => {
		// Check if model is large enough to warrant chunked loading
		if (isLargeModel(exampleModel)) {
			showChunkLoader = true;
			await loadLargeModel(exampleModel, 100);
			showChunkLoader = false;
		} else {
			// Small model, load directly
			Object.assign(model, exampleModel);
		}
	});
</script>

<div class="timeline-container">
	{#if showChunkLoader && isLoadingLarge}
		<LoadingChunk {progress} {isLoadingLarge} />
	{:else}
		<Timeline {model} />
	{/if}
</div>

<style>
	.timeline-container {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
