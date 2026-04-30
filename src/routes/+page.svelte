<script lang="ts">
	import { setContext } from 'svelte';
	import { createModelStore } from '$lib/model/model-store.svelte';
	import { createEmptyModel } from '$lib/model/model-empty';
	import { createPlaybackStore } from '$lib/context/playback-context.svelte';
	import { createTemplatesStore } from '$lib/stores/templates.svelte';
	import { createKeybindingHandler } from '$lib/context/keybindings.svelte';
	import { deleteEventFromModel } from '$lib/utils/event-helpers';
	import { createPreferencesStore } from '$lib/stores/preferences.svelte';
	import ShortcutHelp from '$lib/components/ui/ShortcutHelp.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import SaveIndicator from '$lib/components/app/SaveIndicator.svelte';
	import OnboardingFlow from '$lib/components/app/OnboardingFlow.svelte';
	import {
		ASSET_STORE_KEY,
		MODEL_STORE_KEY,
		HISTORY_STORE_KEY,
		PLAYBACK_CONTEXT_KEY,
		TEMPLATES_CONTEXT_KEY,
		PREFS_CONTEXT_KEY
	} from '$lib/context/keys';
	import AssetManager from '$lib/components/workspace/assets/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/workspace/properties/PropertiesPanel.svelte';
	import PreviewPanel from '$lib/components/app/PreviewPanel.svelte';
	import SequenceOrchestrator from '$lib/components/workspace/orchestrator/SequenceOrchestrator.svelte';
	import GenerateBatchButton from '$lib/components/workspace/GenerateBatchButton.svelte';
	import { resizable } from '$lib/actions/resizable';

	const { model, history, undo, redo, saveStatus } = createModelStore();
	const playback = createPlaybackStore();
	const templatesStore = createTemplatesStore();
	const { prefs } = createPreferencesStore();

	setContext(ASSET_STORE_KEY, model.assets);
	setContext(MODEL_STORE_KEY, model);
	setContext(HISTORY_STORE_KEY, history);
	setContext(PLAYBACK_CONTEXT_KEY, playback);
	setContext(TEMPLATES_CONTEXT_KEY, templatesStore);
	setContext(PREFS_CONTEXT_KEY, prefs);

	let selectedTime = $state<number | null>(null);
	let showInspector = $state(false);
	let showShortcuts = $state(false);

	// Show onboarding on first visit (empty project)
	const isEmptyProject = $derived(
		model.timeline.length === 0 && model.assets.characters.length === 0
	);
	let onboardingDismissed = $state(false);
	const showOnboarding = $derived(isEmptyProject && !onboardingDismissed);
	let showProjectConfig = $state(false);
	let showNewProjectConfirm = $state(false);
	let showExport = $state(false);
	let showSnapshots = $state(false);
	let showComfyUISettings = $state(false);
	let rightTab = $state<'properties' | 'preview'>('properties');

	const selectedEventId = $derived(selectedTime !== null ? String(selectedTime) : null);

	const onKeydown = createKeybindingHandler({
		undo,
		redo,
		toggleInspector: () => {
			showInspector = !showInspector;
		},
		toggleShortcuts: () => {
			showShortcuts = !showShortcuts;
		},
		deleteSelected: () => {
			if (selectedTime === null) return;
			const deleted = deleteEventFromModel(model, selectedTime);
			if (deleted) selectedTime = null;
		}
	});

	function newProject() {
		const empty = createEmptyModel();
		Object.assign(model.project, empty.project);
		model.assets.characters = empty.assets.characters;
		model.assets.environments = empty.assets.environments;
		model.assets.audio = empty.assets.audio;
		model.timeline.length = 0;
		model.config = empty.config;
		history.clear();
		localStorage.removeItem('latent-line:model');
		selectedTime = null;
		showNewProjectConfirm = false;
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app-layout" style="height:100%;">
	<div class="app-toolbar">
		<button
			onclick={() => (showProjectConfig = true)}
			title="Configuration projet"
			class="toolbar-btn"
		>
			📋 Projet
		</button>
		<button
			onclick={() => (showNewProjectConfirm = true)}
			title="Nouveau projet"
			class="toolbar-btn"
		>
			＋ Nouveau
		</button>
		<button onclick={() => (showExport = true)} title="Exporter" class="toolbar-btn">
			⬇ Export
		</button>
		<button onclick={() => (showSnapshots = true)} title="Snapshots" class="toolbar-btn">
			📸 Snapshots
		</button>
		<a
			href="/present?model={encodeURIComponent(btoa(JSON.stringify($state.snapshot(model))))}&index=0"
			target="_blank"
			rel="noopener"
			class="toolbar-btn toolbar-btn--screening"
			title="Ouvrir le screening"
		>
			▶ Screening
		</a>
		<button
			onclick={() => (showComfyUISettings = true)}
			title="ComfyUI / Stable Diffusion Settings"
			class="toolbar-btn"
		>
			🎨 ComfyUI
		</button>
		<GenerateBatchButton {model} {prefs} />
		<span style="margin-left:auto;"><SaveIndicator status={saveStatus.value} /></span>
	</div>
	<div class="app-panels">
		<aside
			class="panel panel-left"
			aria-label="Asset Manager"
			use:resizable={{ key: 'panel-left', defaultWidth: 220, min: 160, max: 480 }}
		>
			<AssetManager />
		</aside>
		<div class="panel panel-main">
			<SequenceOrchestrator bind:selectedTime />
		</div>
		<aside
			class="panel panel-right"
			use:resizable={{ key: 'panel-right', defaultWidth: 280, min: 160, max: 500, side: 'left' }}
		>
			<div class="right-tabs">
				<button
					class="tab-btn {rightTab === 'properties' ? 'active' : ''}"
					onclick={() => (rightTab = 'properties')}>Properties</button
				>
				<button
					class="tab-btn {rightTab === 'preview' ? 'active' : ''}"
					onclick={() => (rightTab = 'preview')}>Preview</button
				>
			</div>
			<div class="tab-content">
				{#if rightTab === 'properties'}
					<PropertiesPanel {selectedEventId} />
				{:else}
					<PreviewPanel />
				{/if}
			</div>
		</aside>
	</div>
	<button
		class="inspector-toggle"
		onclick={() => (showInspector = !showInspector)}
		title="Régie (Ctrl+I)"
		aria-label="Ouvrir la Régie">⌥</button
	>
</div>

{#if showInspector}
	{#await import('$lib/components/workspace/utils/ModelInspector.svelte') then { default: ModelInspector }}
		<ModelInspector onclose={() => (showInspector = false)} />
	{/await}
{/if}

{#if showShortcuts}
	<ShortcutHelp onclose={() => (showShortcuts = false)} />
{/if}

{#if showProjectConfig}
	{#await import('$lib/components/app/ProjectConfig.svelte') then { default: ProjectConfig }}
		<ProjectConfig onclose={() => (showProjectConfig = false)} />
	{/await}
{/if}

{#if showExport}
	{#await import('$lib/components/app/ExportModal.svelte') then { default: ExportModal }}
		<ExportModal onclose={() => (showExport = false)} />
	{/await}
{/if}

{#if showSnapshots}
	{#await import('$lib/components/app/SnapshotsPanel.svelte') then { default: SnapshotsPanel }}
		<SnapshotsPanel onclose={() => (showSnapshots = false)} />
	{/await}
{/if}

{#if showNewProjectConfirm}
	<ConfirmDialog
		message="Créer un nouveau projet ? Les données non sauvegardées seront perdues."
		confirmLabel="Nouveau projet"
		onconfirm={newProject}
		oncancel={() => (showNewProjectConfirm = false)}
	/>
{/if}

{#if showComfyUISettings}
	{#await import('$lib/components/app/ComfyUISettings.svelte') then { default: ComfyUISettings }}
		<ComfyUISettings
			open={showComfyUISettings}
			{prefs}
			onClose={() => (showComfyUISettings = false)}
		/>
	{/await}
{/if}

{#if showOnboarding}
	<OnboardingFlow {model} onComplete={() => (onboardingDismissed = true)} />
{/if}

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-surface);
		color: var(--color-text);
	}
	.app-toolbar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0 0.5rem;
		height: 24px;
		border-bottom: var(--border-width) solid var(--color-border);
		flex-shrink: 0;
	}
	.toolbar-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		padding: 0 0.25rem;
		border-radius: var(--radius-sm);
	}
	.toolbar-btn:hover {
		background: var(--color-surface-2);
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
	/* resizable action sets explicit width via JS; these are fallback defaults */
	.panel-left {
		width: 220px;
		min-width: 160px;
		border-right: none;
	}
	.panel-main {
		flex: 1;
		min-width: 0;
	}
	.panel-right {
		width: 280px;
		min-width: 160px;
		border-left: none;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* ── Tablet (≤1024px) — 2 columns, right panel slides ── */
	@media (max-width: 1024px) {
		.panel-left {
			width: 200px;
			min-width: 160px;
		}
		.panel-right {
			width: 240px;
			min-width: 160px;
		}
	}

	/* ── Mobile (≤768px) — 1 column, stacked tabs ── */
	@media (max-width: 768px) {
		.app-panels {
			flex-direction: column;
		}
		.panel-left {
			width: 100%;
			height: auto;
			max-height: 35vh;
			border-right: var(--border-width) solid var(--color-border);
		}
		.panel-main {
			min-height: 0;
			flex: 1;
		}
		.panel-right {
			width: 100%;
			height: auto;
			max-height: 35vh;
			border-left: var(--border-width) solid var(--color-border);
		}
	}

	/* ── Small mobile (≤480px) ── */
	@media (max-width: 480px) {
		.panel-left {
			max-height: 28vh;
		}
		.panel-right {
			max-height: 28vh;
		}
	}
	.right-tabs {
		display: flex;
		border-bottom: var(--border-width) solid var(--color-border);
		flex-shrink: 0;
	}
	.tab-btn {
		flex: 1;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		padding: 0.25rem 0;
	}
	.tab-btn.active {
		color: var(--color-text);
		border-bottom-color: var(--color-accent, #7c3aed);
	}
	.tab-content {
		flex: 1;
		min-height: 0;
		overflow: auto;
	}
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
	.inspector-toggle:hover {
		background: var(--color-surface-2);
	}
</style>
