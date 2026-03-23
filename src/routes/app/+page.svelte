<script lang="ts">
	import { setContext } from 'svelte';
	import AssetManager from '$lib/components/app/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/app/PropertiesPanel.svelte';
	import SequenceOrchestrator from '$lib/components/app/SequenceOrchestrator.svelte';
	import ModelInspector from '$lib/components/app/ModelInspector.svelte';
	import type { Model } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import { loadModelFromLocalStorage, saveModelToLocalStorage } from '$lib/utils/persistence';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY, HISTORY_STORE_KEY } from '$lib/context/keys';
	import { createModelHistory } from '$lib/context/history.svelte';

// Hydrate from localStorage if available and valid, otherwise fall back to exampleModel
const saved = loadModelFromLocalStorage();
const model = $state<Model>(saved ?? structuredClone(exampleModel));

const history = createModelHistory();
setContext(ASSET_STORE_KEY, model.assets);
setContext(MODEL_STORE_KEY, model);
setContext(HISTORY_STORE_KEY, history);

let selectedTime = $state<number | null>(null);
let showInspector = $state(false);

const selectedEventId = $derived(selectedTime !== null ? String(selectedTime) : null);

// Track previous JSON to detect external mutations and push snapshots
let previousJson = JSON.stringify(model);
let isApplyingSnapshot = false;

// Auto-snapshot: when the model changes, store the old state for undo
$effect(() => {
	const currentJson = JSON.stringify(model);
	if (!isApplyingSnapshot && currentJson !== previousJson) {
		history.push(JSON.parse(previousJson) as Model);
		previousJson = currentJson;
	}
	isApplyingSnapshot = false;
});

// Persist the model to localStorage whenever it changes and validates.
$effect(() => {
	saveModelToLocalStorage(model);
}, [model]);

function applySnapshot(snapshot: Model) {
	isApplyingSnapshot = true;
	Object.assign(model.project, snapshot.project);
	model.assets.characters = snapshot.assets.characters;
	model.assets.environments = snapshot.assets.environments;
	model.assets.audio = snapshot.assets.audio;
	model.timeline = snapshot.timeline;
	model.config = snapshot.config;
	previousJson = JSON.stringify(snapshot);
}

function handleUndo() {
	const prev = history.undo(JSON.parse(JSON.stringify(model)) as Model);
	if (prev) applySnapshot(prev);
}

function handleRedo() {
	const next = history.redo(JSON.parse(JSON.stringify(model)) as Model);
	if (next) applySnapshot(next);
}

function onKeydown(e: KeyboardEvent) {
	if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
		e.preventDefault();
		handleUndo();
	} else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
		e.preventDefault();
		handleRedo();
	}
}
</script>

<svelte:window onkeydown={onKeydown} />

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
