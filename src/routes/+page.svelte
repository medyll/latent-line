<script lang="ts">
	import { setContext } from 'svelte';
	import { createModelStore } from '$lib/model/model-store.svelte';
	import { createKeybindingHandler } from '$lib/context/keybindings.svelte';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY, HISTORY_STORE_KEY } from '$lib/context/keys';
	import AssetManager from '$lib/components/workspace/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/workspace/PropertiesPanel.svelte';
	import SequenceOrchestrator from '$lib/components/workspace/SequenceOrchestrator.svelte';
	import ModelInspector from '$lib/components/workspace/ModelInspector.svelte';

	const { model, history, undo, redo } = createModelStore();

	setContext(ASSET_STORE_KEY, model.assets);
	setContext(MODEL_STORE_KEY, model);
	setContext(HISTORY_STORE_KEY, history);

	let selectedTime = $state<number | null>(null);
	let showInspector = $state(false);

	const selectedEventId = $derived(selectedTime !== null ? String(selectedTime) : null);

	const onKeydown = createKeybindingHandler({
		undo,
		redo,
		toggleInspector: () => { showInspector = !showInspector; }
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app-layout" style="height:100%;">
	<div class="app-panels">
		<aside class="panel panel-left" aria-label="Asset Manager">
			<AssetManager />
		</aside>
		<div class="panel panel-main">
			<SequenceOrchestrator bind:selectedTime />
		</div>
		<aside class="panel panel-right">
			<PropertiesPanel {selectedEventId} />
		</aside>
	</div>
	<button
		class="inspector-toggle"
		onclick={() => (showInspector = !showInspector)}
		title="Toggle Model Inspector (Ctrl+I)"
		aria-label="Toggle Model Inspector"
	>⌥</button>
</div>

{#if showInspector}
	<ModelInspector onclose={() => (showInspector = false)} />
{/if}

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
	.inspector-toggle {
		position: fixed;
		bottom: 0.75rem;
		right: 0.75rem;
		z-index: 90;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		background: var(--color-surface-3);
		border: var(--border-width) solid var(--color-border);
		font-size: 0.9rem;
		cursor: pointer;
		box-shadow: var(--shadow-md);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.inspector-toggle:hover { background: var(--color-surface-2); }
</style>
