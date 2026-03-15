<script lang="ts">
	import { setContext } from 'svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { Card } from '$lib/components/ui/card';
	import AssetManager from '$lib/components/app/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/app/PropertiesPanel.svelte';
	import SequenceOrchestrator from '$lib/components/app/SequenceOrchestrator.svelte';
	import SystemFooter from '$lib/components/app/SystemFooter.svelte';
	import type { Model } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY } from '$lib/context/keys';

	// Single source of truth for the full model
	const model = $state<Model>(structuredClone(exampleModel));

	// Expose assets and full model via context
	setContext(ASSET_STORE_KEY, model.assets);
	setContext(MODEL_STORE_KEY, model);

	let selectedTime = $state<number | null>(null);
	let selectedAssetId = $state<string | null>(null);

	// Mutual exclusion: selecting an event clears the asset, and vice versa
	$effect(() => {
		if (selectedTime !== null) selectedAssetId = null;
	});
	$effect(() => {
		if (selectedAssetId !== null) selectedTime = null;
	});

	// Derive selectedEventId (string form) for PropertiesPanel
	const selectedEventId = $derived(selectedTime !== null ? String(selectedTime) : null);
</script>

<div class="flex h-[100dvh] flex-col bg-white">
	<Resizable.PaneGroup direction="horizontal" class="min-h-0 flex-1">
		<!-- Left: Asset Manager -->
		<Resizable.Pane defaultSize={20} minSize={15} maxSize={30} class="h-full">
			<Card class="h-full overflow-auto border-r px-2 py-2">
				<AssetManager bind:selectedAssetId />
			</Card>
		</Resizable.Pane>

		<Resizable.Handle />

		<!-- Central: Sequence Orchestrator -->
		<Resizable.Pane defaultSize={60} minSize={30} class="h-full">
			<Card class="h-full overflow-auto px-2 py-2">
				<SequenceOrchestrator bind:selectedTime />
			</Card>
		</Resizable.Pane>

		<Resizable.Handle />

		<!-- Right: Properties Panel -->
		<Resizable.Pane defaultSize={20} minSize={15} maxSize={35} class="h-full">
			<Card class="h-full overflow-auto border-l px-2 py-2">
				<PropertiesPanel {selectedEventId} {selectedAssetId} />
			</Card>
		</Resizable.Pane>
	</Resizable.PaneGroup>
	<SystemFooter />
</div>
