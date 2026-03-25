<script lang="ts">
	import { SHORTCUTS } from '$lib/utils/keyboard';
	import { focusTrap } from '$lib/actions/focus-trap';
	import { fade, fly } from 'svelte/transition';
	let { onclose }: { onclose?: () => void } = $props();
</script>

<div
	class="shortcuts-overlay"
	role="dialog"
	aria-label="Raccourcis clavier"
	aria-modal="true"
	use:focusTrap={{ onEscape: onclose }}
	transition:fade={{ duration: 150 }}
>
	<div class="shortcuts-panel" in:fly={{ y: 12, duration: 200 }}>
		<header class="card-header">
			<h3 class="card-title">Raccourcis clavier</h3>
			{#if onclose}
				<button onclick={onclose} aria-label="Fermer" class="text-xs">✕</button>
			{/if}
		</header>
		<div class="card-content p-2">
			<ul class="list-none text-sm">
				{#each SHORTCUTS as s}
					<li class="py-1">
						<strong
							>{s.key}{s.ctrl ? ' + Ctrl' : ''}{s.meta ? ' + Cmd' : ''}{s.shift
								? ' + Shift'
								: ''}</strong
						>
						— {s.description}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	.shortcuts-overlay {
		position: fixed;
		inset: 0;
		z-index: 120;
		background: color-mix(in srgb, var(--color-text) 28%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.shortcuts-panel {
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-border);
		padding: 0.5rem;
		border-radius: var(--radius-md);
		min-width: 320px;
		max-width: 720px;
		box-shadow: var(--shadow-lg);
	}
	.card-title {
		font-weight: 600;
	}
</style>
