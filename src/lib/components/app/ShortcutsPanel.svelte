<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Save, Upload, Download, RotateCcw, AlertTriangle } from '@lucide/svelte';
	import {
		DEFAULT_SHORTCUTS,
		SHORTCUT_PRESETS,
		parseShortcut,
		detectConflicts,
		isValidShortcut,
		loadShortcuts,
		saveShortcuts,
		loadPreset,
		exportShortcuts,
		importShortcuts,
		formatShortcut,
		type ShortcutConfig
	} from '$lib/utils/shortcuts-config';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();
	const dispatch = createEventDispatcher<{ close: void; change: ShortcutConfig }>();

	// State
	let shortcuts = $state<ShortcutConfig>({ ...DEFAULT_SHORTCUTS });
	let conflicts = $state<Array<{ action1: string; action2: string; shortcut: string }>>([]);
	let selectedPreset = $state('Default');
	let editingAction: string | null = null;
	let editingValue = $state('');
	let importText = $state('');
	let showImport = $state(false);

	// Group shortcuts by category
	const categories = $derived({
		'File': Object.entries(shortcuts).filter(([k]) => k.startsWith('file.')),
		'Editing': Object.entries(shortcuts).filter(([k]) => k.startsWith('edit.')),
		'Playback': Object.entries(shortcuts).filter(([k]) => k.startsWith('playback.')),
		'Navigation': Object.entries(shortcuts).filter(([k]) => k.startsWith('nav.')),
		'View': Object.entries(shortcuts).filter(([k]) => k.startsWith('view.')),
		'Timeline': Object.entries(shortcuts).filter(([k]) => k.startsWith('timeline.'))
	});

	// Update conflicts when shortcuts change
	$effect(() => {
		conflicts = detectConflicts(shortcuts);
	});

	// Load shortcuts on open
	$effect(() => {
		if (open) {
			shortcuts = loadShortcuts();
		}
	});

	function handleClose() {
		dispatch('close');
		onClose?.();
	}

	function handleSave() {
		saveShortcuts(shortcuts);
		dispatch('change', shortcuts);
		handleClose();
	}

	function handleReset() {
		shortcuts = { ...DEFAULT_SHORTCUTS };
		selectedPreset = 'Default';
	}

	function handlePresetChange(name: string) {
		shortcuts = loadPreset(name);
		selectedPreset = name;
	}

	function startEditing(action: string, currentShortcut: string) {
		editingAction = action;
		editingValue = currentShortcut;
	}

	function stopEditing() {
		editingAction = null;
		editingValue = '';
	}

	function handleKeyDown(e: KeyboardEvent, action: string) {
		e.preventDefault();
		
		const parts: string[] = [];
		if (e.ctrlKey) parts.push('Ctrl');
		if (e.altKey) parts.push('Alt');
		if (e.shiftKey) parts.push('Shift');
		if (e.metaKey) parts.push('Meta');
		
		// Add key
		const key = e.key.toUpperCase();
		if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) {
			parts.push(key);
		}
		
		const shortcut = parts.join('+');
		
		if (shortcut && editingAction === action) {
			shortcuts[action] = shortcut;
			stopEditing();
		}
	}

	function handleExport() {
		const json = exportShortcuts(shortcuts);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'shortcuts.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImport() {
		const config = importShortcuts(importText);
		if (config) {
			shortcuts = config;
			showImport = false;
			importText = '';
		}
	}

	function getActionLabel(action: string): string {
		return action
			.split('.')
			.pop()
			?.replace(/-/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase()) ?? action;
	}

	function hasConflict(action: string): boolean {
		return conflicts.some(c => c.action1 === action || c.action2 === action);
	}
</script>

{#if open}
	<div class="shortcuts-overlay" onclick={handleClose}>
		<div class="shortcuts-panel" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="panel-header">
				<h3>Keyboard Shortcuts</h3>
				<div class="header-actions">
					<button class="icon-btn" onclick={handleReset} title="Reset to defaults">
						<RotateCcw size={18} />
					</button>
					<button class="icon-btn" onclick={handleClose}>
						<X size={18} />
					</button>
				</div>
			</div>

			<!-- Presets -->
			<div class="presets-bar">
				<select value={selectedPreset} onchange={(e) => handlePresetChange(e.target.value)}>
					{#each SHORTCUT_PRESETS as preset}
						<option value={preset.name}>{preset.name}</option>
					{/each}
				</select>
				<button class="btn btn-sm" onclick={() => (showImport = !showImport)}>
					<Upload size={14} />
					Import
				</button>
				<button class="btn btn-sm" onclick={handleExport}>
					<Download size={14} />
					Export
				</button>
			</div>

			<!-- Import Panel -->
			{#if showImport}
				<div class="import-panel">
					<textarea
						placeholder="Paste shortcuts JSON here..."
						value={importText}
						oninput={(e) => (importText = e.target.value)}
					/>
					<div class="import-actions">
						<button class="btn" onclick={handleImport}>Import</button>
						<button class="btn btn-secondary" onclick={() => (showImport = false)}>Cancel</button>
					</div>
				</div>
			{/if}

			<!-- Conflicts Warning -->
			{#if conflicts.length > 0}
				<div class="conflicts-warning">
					<AlertTriangle size={16} class="warning-icon" />
					<span>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</span>
					<ul class="conflicts-list">
						{#each conflicts.slice(0, 3) as conflict}
							<li>{conflict.shortcut}: {conflict.action1} & {conflict.action2}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Shortcuts List -->
			<div class="shortcuts-list">
				{#each Object.entries(categories) as [category, entries]}
					<div class="category">
						<h4>{category}</h4>
						{#each entries as [action, shortcut]}
							<div class="shortcut-row {hasConflict(action) ? 'conflict' : ''}">
								<span class="action-label">{getActionLabel(action)}</span>
								{#if editingAction === action}
									<input
										type="text"
										class="shortcut-input"
										value={editingValue}
										onkeydown={(e) => handleKeyDown(e, action)}
										onblur={stopEditing}
										autofocus
									/>
								{:else}
									<button
										class="shortcut-btn"
										onclick={() => startEditing(action, shortcut)}
									>
										{formatShortcut(shortcut)}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="panel-footer">
				<button class="btn btn-secondary" onclick={handleClose}>Cancel</button>
				<button class="btn btn-primary" onclick={handleSave}>
					<Save size={16} />
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.shortcuts-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: grid;
		place-items: center;
		animation: fadeIn 0.2s ease;
	}

	.shortcuts-panel {
		background: var(--color-surface);
		border-radius: 12px;
		width: 90%;
		max-width: 700px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 16px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		color: var(--color-text-muted);
		border-radius: 4px;
	}

	.icon-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.presets-bar {
		display: flex;
		gap: 8px;
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border);
		align-items: center;
	}

	.presets-bar select {
		flex: 1;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 12px;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-secondary {
		background: var(--color-surface-2);
	}

	.import-panel {
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.import-panel textarea {
		width: 100%;
		min-height: 100px;
		padding: 12px;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface-2);
		color: var(--color-text);
		font-family: monospace;
		font-size: 12px;
		resize: vertical;
	}

	.import-actions {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.conflicts-warning {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--color-warning-alpha);
		color: var(--color-warning);
		font-size: 13px;
	}

	.warning-icon {
		flex-shrink: 0;
	}

	.conflicts-list {
		margin: 8px 0 0 24px;
		font-size: 12px;
	}

	.shortcuts-list {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	.category {
		margin-bottom: 24px;
	}

	.category h4 {
		font-size: 12px;
		color: var(--color-text-muted);
		text-transform: uppercase;
		margin: 0 0 12px;
	}

	.shortcut-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid var(--color-border);
	}

	.shortcut-row:last-child {
		border-bottom: none;
	}

	.shortcut-row.conflict {
		background: var(--color-warning-alpha);
		margin: 0 -8px;
		padding: 8px;
		border-radius: 6px;
	}

	.action-label {
		font-size: 13px;
		color: var(--color-text);
	}

	.shortcut-btn {
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-2);
		color: var(--color-text);
		font-size: 12px;
		cursor: pointer;
		min-width: 100px;
		text-align: center;
	}

	.shortcut-btn:hover {
		border-color: var(--color-primary);
	}

	.shortcut-input {
		width: 120px;
		padding: 6px 12px;
		border: 2px solid var(--color-primary);
		border-radius: 6px;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 12px;
		text-align: center;
	}

	.panel-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 16px;
		border-top: 1px solid var(--color-border);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
