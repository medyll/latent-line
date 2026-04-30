<script lang="ts">
	import { getContext } from 'svelte';
	import type { Model } from '$lib/model/model-types';
	import { MODEL_STORE_KEY, HISTORY_STORE_KEY } from '$lib/context/keys';
	import {
		listSnapshots,
		saveSnapshot,
		deleteSnapshot,
		restoreSnapshot,
		type Snapshot
	} from '$lib/utils/snapshots';
	import { getMoodColor } from '$lib/model/mood-palette';

	let { onclose }: { onclose?: () => void } = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);
	const history = getContext<any>(HISTORY_STORE_KEY);

	let snapshots = $state(listSnapshots());
	let newName: string = $state('');
	let message: string = $state('');

	const PRESET_LABELS = ['Rough cut', 'Director\'s cut', 'Final', 'Archive'];

	function refresh() {
		snapshots = listSnapshots();
	}

	function create(nameOverride?: string) {
		message = '';
		const res = saveSnapshot(model, nameOverride || newName || undefined);
		if (!res.success) {
			message = res.errors.join('; ');
			return;
		}
		newName = '';
		refresh();
		message = 'Version sauvegardée';
		setTimeout(() => (message = ''), 2000);
	}

	function remove(id: string) {
		if (!confirm('Supprimer cette version ?')) return;
		const ok = deleteSnapshot(id);
		if (!ok) { message = 'Erreur lors de la suppression'; return; }
		refresh();
	}

	function apply(id: string) {
		const res = restoreSnapshot(id);
		if (!res.success) { message = res.errors.join('; '); return; }
		history?.push(JSON.parse(JSON.stringify(model)));
		const imported = res.model;
		Object.assign(model.project, imported.project);
		model.assets.characters = imported.assets.characters;
		model.assets.environments = imported.assets.environments;
		model.assets.audio = imported.assets.audio;
		model.timeline.length = 0;
		model.timeline.push(...imported.timeline);
		model.config = imported.config;
		message = 'Version chargée';
		setTimeout(() => (message = ''), 2000);
		onclose?.();
	}

	function getSnapshotMood(s: Snapshot): string | undefined {
		try {
			const parsed = JSON.parse(s.json);
			return parsed?.timeline?.[0]?.frame?.actors?.[0]?.speech?.mood;
		} catch {
			return undefined;
		}
	}

	function getSnapshotScene(s: Snapshot): string | undefined {
		try {
			const parsed = JSON.parse(s.json);
			const prompt = parsed?.timeline?.[0]?.frame?.prompt;
			return prompt ? (prompt.length > 60 ? prompt.slice(0, 58) + '…' : prompt) : undefined;
		} catch {
			return undefined;
		}
	}

	function formatDate(ts: string): string {
		const d = new Date(ts);
		return `Prise du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
	}
</script>

<div class="snapshots-overlay" onclick={onclose} role="presentation">
	<div class="snapshots-panel" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Versions de tournage">
		<header class="panel-header">
			<h2 class="panel-title">Versions de tournage</h2>
			{#if onclose}
				<button class="close-btn" onclick={onclose} aria-label="Fermer">✕</button>
			{/if}
		</header>

		<!-- Save new version -->
		<div class="save-section">
			<div class="preset-labels">
				{#each PRESET_LABELS as label}
					<button class="preset-btn" onclick={() => create(label)}>{label}</button>
				{/each}
			</div>
			<div class="custom-save">
				<input
					placeholder="Ou nommer manuellement…"
					bind:value={newName}
					class="name-input"
					onkeydown={(e) => e.key === 'Enter' && create()}
				/>
				<button onclick={() => create()} class="save-btn">📸 Sauvegarder</button>
			</div>
		</div>

		{#if message}
			<div class="feedback-msg">{message}</div>
		{/if}

		<!-- Snapshots list -->
		{#if snapshots.length === 0}
			<div class="empty-state">Aucune version sauvegardée.</div>
		{:else}
			<div class="snapshot-list">
				{#each snapshots.slice().reverse() as s (s.id)}
					{@const mood = getSnapshotMood(s)}
					{@const scene = getSnapshotScene(s)}
					{@const mc = getMoodColor(mood)}
					<div
						class="snapshot-card"
						style={mc ? `border-left: 3px solid ${mc.border};` : ''}
					>
						<div class="snapshot-top">
							<div class="snapshot-info">
								<div class="snapshot-name">{s.name}</div>
								<div class="snapshot-date">{formatDate(s.timestamp)}</div>
								{#if scene}
									<div class="snapshot-scene">{scene}</div>
								{/if}
							</div>
							{#if mc}
								<div class="snapshot-mood" style="background:{mc.bg}; color:{mc.text}; border:1px solid {mc.border};">{mood}</div>
							{/if}
						</div>
						<div class="snapshot-actions">
							<button onclick={() => apply(s.id)} class="action-btn action-btn--primary">
								▶ Charger
							</button>
							<button
								onclick={() =>
									navigator.clipboard?.writeText(window.location.href + '?snap=' + s.id)}
								class="action-btn"
								title="Copier le lien"
							>🔗</button>
							<button onclick={() => remove(s.id)} class="action-btn action-btn--danger">✕</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.snapshots-overlay {
		position: fixed;
		inset: 0;
		background: oklch(0 0 0 / 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
	}

	.snapshots-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 16px 16px 0 0;
		width: min(520px, 100%);
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 -8px 32px oklch(0 0 0 / 0.3);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px 12px;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.01em;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 1rem;
		padding: 4px;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: var(--color-surface-hover, var(--color-surface-2));
	}

	/* Save section */
	.save-section {
		padding: 16px 24px;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex-shrink: 0;
	}

	.preset-labels {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.preset-btn {
		padding: 5px 12px;
		border-radius: 20px;
		border: 1px solid var(--color-border);
		background: var(--color-surface-alt, var(--color-surface));
		color: var(--color-text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.preset-btn:hover {
		border-color: oklch(0.65 0.25 280 / 0.5);
		color: oklch(0.75 0.2 280);
		background: oklch(0.65 0.25 280 / 0.08);
	}

	.custom-save {
		display: flex;
		gap: 8px;
	}

	.name-input {
		flex: 1;
		padding: 7px 12px;
		background: var(--color-surface-alt, var(--color-surface));
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 0.8rem;
		outline: none;
	}

	.name-input:focus {
		border-color: oklch(0.65 0.25 280 / 0.5);
	}

	.save-btn {
		padding: 7px 14px;
		border-radius: 6px;
		border: none;
		background: oklch(0.65 0.25 280);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.save-btn:hover {
		opacity: 0.9;
	}

	/* Feedback */
	.feedback-msg {
		padding: 6px 24px;
		font-size: 0.75rem;
		color: oklch(0.72 0.18 150);
		background: oklch(0.72 0.18 150 / 0.06);
		flex-shrink: 0;
	}

	/* Empty */
	.empty-state {
		padding: 24px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	/* Snapshot list */
	.snapshot-list {
		overflow-y: auto;
		padding: 12px 24px 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.snapshot-card {
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		transition: border-color 0.15s;
	}

	.snapshot-card:hover {
		border-color: oklch(0.65 0.25 280 / 0.4);
	}

	.snapshot-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
	}

	.snapshot-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.snapshot-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.snapshot-date {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.snapshot-scene {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		font-style: italic;
		font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.snapshot-mood {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 20px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.snapshot-actions {
		display: flex;
		gap: 6px;
	}

	.action-btn {
		padding: 5px 12px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.action-btn:hover {
		background: var(--color-surface-hover, var(--color-surface-2));
		color: var(--color-text);
	}

	.action-btn--primary {
		background: oklch(0.65 0.25 280 / 0.1);
		color: oklch(0.75 0.2 280);
		border-color: oklch(0.65 0.25 280 / 0.3);
	}

	.action-btn--primary:hover {
		background: oklch(0.65 0.25 280 / 0.2);
	}

	.action-btn--danger {
		color: oklch(0.65 0.18 25);
	}

	.action-btn--danger:hover {
		background: oklch(0.65 0.18 25 / 0.1);
		border-color: oklch(0.65 0.18 25 / 0.3);
	}
</style>
