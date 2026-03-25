<script lang="ts">
	let {
		count,
		ondelete,
		onduplicate,
		onshift,
		onclear
	}: {
		count: number;
		ondelete: () => void;
		onduplicate: () => void;
		onshift: (delta: number) => void;
		onclear: () => void;
	} = $props();

	let shiftInput = $state(10);
</script>

<div class="selection-toolbar" role="toolbar" aria-label="Selection actions">
	<span class="sel-count">{count} selected</span>
	<div class="sel-actions">
		<button onclick={onduplicate} title="Duplicate selected" class="sel-btn">⧉ Dupliquer</button>
		<label class="sel-shift" title="Shift selected events by N frames">
			<span>Décaler</span>
			<input type="number" bind:value={shiftInput} min="-999" max="999" step="1" />
			<button onclick={() => onshift(shiftInput)} class="sel-btn-sm">→</button>
		</label>
		<button onclick={ondelete} title="Delete selected" class="sel-btn sel-btn-danger"
			>🗑 Supprimer</button
		>
		<button onclick={onclear} title="Clear selection (Escape)" class="sel-btn-icon">✕</button>
	</div>
</div>

<style>
	.selection-toolbar {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 150;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-surface-3, #313244);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		padding: 0.35rem 0.75rem;
		box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.4));
		font-size: var(--text-xs);
		color: var(--color-text);
	}
	.sel-count {
		font-weight: 700;
		color: var(--color-text-muted);
		white-space: nowrap;
	}
	.sel-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.sel-btn {
		background: var(--color-surface-2, #45475a);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm, 4px);
		color: var(--color-text);
		cursor: pointer;
		padding: 0.2rem 0.5rem;
		font-size: var(--text-xs);
	}
	.sel-btn:hover {
		background: var(--color-surface);
	}
	.sel-btn-danger {
		border-color: var(--color-danger, #f38ba8);
		color: var(--color-danger, #f38ba8);
	}
	.sel-btn-icon {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.1rem 0.25rem;
		font-size: var(--text-sm);
	}
	.sel-shift {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.sel-shift input {
		width: 3rem;
		text-align: center;
	}
	.sel-btn-sm {
		background: var(--color-surface-2);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--color-text);
		padding: 0.1rem 0.3rem;
		font-size: var(--text-xs);
	}
</style>
