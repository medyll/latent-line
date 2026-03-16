<script lang="ts">
	import { setContext } from 'svelte';
	import AssetManager from '$lib/components/app/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/app/PropertiesPanel.svelte';
	import SequenceOrchestrator from '$lib/components/app/SequenceOrchestrator.svelte';
	import type { Model } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY } from '$lib/context/keys';

	const model = $state<Model>(structuredClone(exampleModel));

	setContext(ASSET_STORE_KEY, model.assets);
	setContext(MODEL_STORE_KEY, model);

	let selectedTime = $state<number | null>(null);

	const selectedEventId = $derived(selectedTime !== null ? String(selectedTime) : null);
</script>

<div class="app-layout" style="height:100%;">
	<div class="app-panels">
		<aside class="panel panel-left">
			<AssetManager />
		</aside>
		<div class="panel panel-main">
			<SequenceOrchestrator bind:selectedTime />
		</div>
		<aside class="panel panel-right">
			<PropertiesPanel {selectedEventId} />
		</aside>
	</div>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-surface);
		color: var(--color-text);
	}
	.app-panels {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.panel {
		overflow: auto;
		border: var(--border-width) solid var(--color-border);
	}
	.panel-left  { width: 20%; min-width: 180px; border-right: none; }
	.panel-main  { flex: 1; min-width: 0; }
	.panel-right { width: clamp(200px, 22%, 320px); border-left: none; flex-shrink: 0; }
</style>
