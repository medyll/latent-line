<script lang="ts">
	import { setContext } from 'svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { Card } from '$lib/components/ui/card';
	import AssetManager from '$lib/components/app/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/app/PropertiesPanel.svelte';
	import type { Assets } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import { ASSET_STORE_KEY } from '$lib/context/keys';

	const assetStore = $state<Assets>(structuredClone(exampleModel.assets));
	setContext(ASSET_STORE_KEY, assetStore);

	let selectedAssetId = $state<string | null>(null);
</script>

<Resizable.PaneGroup direction="horizontal" class="min-h-[100dvh] bg-white">
	<!-- Left: Asset Manager -->
	<Resizable.Pane defaultSize={20} minSize={15} maxSize={30} class="h-full">
		<Card class="h-full overflow-auto border-r px-2 py-2">
			<AssetManager bind:selectedAssetId />
		</Card>
	</Resizable.Pane>

	<Resizable.Handle />

	<!-- Central: Sequence / Timeline (placeholder) -->
	<Resizable.Pane defaultSize={60} minSize={30} class="h-full flex-1">
		<Card class="h-full px-2 py-2">
			<div class="text-sm text-gray-400">Sequence Orchestrator — coming in ST-011+</div>
		</Card>
	</Resizable.Pane>

	<Resizable.Handle />

	<!-- Right: Properties Panel -->
	<Resizable.Pane defaultSize={20} minSize={15} maxSize={35} class="h-full">
		<Card class="h-full overflow-auto border-l px-2 py-2">
			<PropertiesPanel {selectedAssetId} timelineEvents={[]} />
		</Card>
	</Resizable.Pane>
</Resizable.PaneGroup>
