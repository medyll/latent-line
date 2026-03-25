<script lang="ts">
	import { getContext } from 'svelte';
	import { PREFS_CONTEXT_KEY, type Preferences } from '$lib/stores/preferences.svelte';
	import { focusTrap } from '$lib/actions/focus-trap';

	let { onclose }: { onclose: () => void } = $props();

	const { prefs, reset } = getContext<{ prefs: Preferences; reset: () => void }>(PREFS_CONTEXT_KEY);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onclose}>
	<div
		class="panel card"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Préférences"
		aria-modal="true"
		tabindex="-1"
		use:focusTrap={{ onEscape: onclose }}
	>
		<header class="panel-header">
			<span>Préférences</span>
			<button onclick={onclose} title="Fermer" aria-label="Fermer" class="close-btn">✕</button>
		</header>

		<div class="panel-body">
			<label class="field">
				<span class="label">Thème</span>
				<select bind:value={prefs.theme}>
					<option value="light">Clair</option>
					<option value="dark">Sombre</option>
				</select>
			</label>

			<label class="field">
				<span class="label">Zoom par défaut</span>
				<input type="number" min="0.5" max="4" step="0.1" bind:value={prefs.defaultZoom} />
			</label>

			<label class="field">
				<span class="label">Largeur panneau gauche (%)</span>
				<input type="number" min="10" max="40" step="1" bind:value={prefs.sidebarWidth} />
			</label>

			<label class="field">
				<span class="label">Langue</span>
				<select bind:value={prefs.language}>
					<option value="en">English</option>
					<option value="fr">Français</option>
				</select>
			</label>
		</div>

		<footer class="panel-footer">
			<button onclick={reset} class="btn-secondary">Réinitialiser</button>
		</footer>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.panel {
		width: 340px;
		max-width: 95vw;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-bottom: var(--border-width) solid var(--color-border);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}
	.panel-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
	}
	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: var(--text-xs);
	}
	.label {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}
	.panel-footer {
		padding: 0.5rem 0.75rem;
		border-top: var(--border-width) solid var(--color-border);
		display: flex;
		justify-content: flex-end;
	}
</style>
