<script lang="ts">
	import { focusTrap } from '$lib/actions/focus-trap';
	import { fade, fly } from 'svelte/transition';

	let {
		message,
		confirmLabel = 'Confirmer',
		cancelLabel = 'Annuler',
		onconfirm,
		oncancel
	}: {
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={oncancel} transition:fade={{ duration: 150 }}>
	<div
		class="dialog card"
		onclick={(e) => e.stopPropagation()}
		role="alertdialog"
		aria-modal="true"
		tabindex="-1"
		use:focusTrap={{ onEscape: oncancel }}
		in:fly={{ y: 12, duration: 200 }}
	>
		<p class="message">{message}</p>
		<div class="actions">
			<button onclick={oncancel} class="btn-secondary">{cancelLabel}</button>
			<button onclick={onconfirm} class="btn-danger">{confirmLabel}</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.dialog {
		width: 320px;
		max-width: 95vw;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.message {
		font-size: var(--text-sm);
		margin: 0;
		color: var(--color-text);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.btn-danger {
		background: var(--color-danger, #c0392b);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.25rem 0.75rem;
		cursor: pointer;
		font-size: var(--text-xs);
	}
	.btn-danger:hover {
		opacity: 0.85;
	}
</style>
