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
	import GenerateBatchButton from '$lib/components/workspace/GenerateBatchButton.svelte';
	import Editor from '$lib/components/app/Editor.svelte';
	import Button from '$lib/components/ds/Button.svelte';
	import Icon from '$lib/components/ds/Icon.svelte';

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
		<Button
			variant="ghost"
			size="sm"
			icon="film"
			label="Projet"
			onclick={() => (showProjectConfig = true)}
		/>
		<Button
			variant="ghost"
			size="sm"
			icon="plus"
			label="Nouveau"
			onclick={() => (showNewProjectConfirm = true)}
		/>
		<Button
			variant="ghost"
			size="sm"
			icon="download"
			label="Exporter"
			onclick={() => (showExport = true)}
		/>
		<Button
			variant="ghost"
			size="sm"
			icon="image"
			label="Snapshots"
			onclick={() => (showSnapshots = true)}
		/>
		<a
			href="/present?model={encodeURIComponent(
				btoa(JSON.stringify($state.snapshot(model)))
			)}&index=0"
			target="_blank"
			rel="noopener"
			class="toolbar-link"
			title="Ouvrir le screening"
		>
			<Icon name="play" size={14} />
			<span>Screening</span>
		</a>
		<Button
			variant="ghost"
			size="sm"
			icon="sparkle"
			label="ComfyUI"
			onclick={() => (showComfyUISettings = true)}
		/>
		<GenerateBatchButton {model} {prefs} />
		<span style="margin-left:auto;"><SaveIndicator status={saveStatus.value} /></span>
	</div>
	<Editor bind:selectedTime onboardingActive={showOnboarding} />
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
		background: var(--surface);
		color: var(--text);
		overflow: hidden;
	}

	.app-toolbar {
		display: flex;
		align-items: center;
		gap: var(--gap-xs);
		padding: 0 var(--pad-sm);
		height: var(--status-bar-height);
		border-bottom: var(--border-width) solid var(--border);
		flex-shrink: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.app-toolbar::-webkit-scrollbar {
		display: none;
	}

	@media (max-width: 640px) {
		.toolbar-link {
			padding: 0 0.25rem;
			font-size: 0.625rem;
		}
		:global(.btn) {
			padding: 0 0.25rem;
			font-size: 0.625rem;
		}
	}

	.toolbar-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-xs);
		color: var(--text-muted);
		padding: 0 var(--pad-xs);
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.toolbar-link:hover {
		background: var(--surface-hover);
		color: var(--text);
	}
</style>
