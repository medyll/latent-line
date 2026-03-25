<script lang="ts">
	let { size = '1rem', label = 'Chargement…' }: { size?: string; label?: string } = $props();
</script>

<span class="spinner" style="width:{size};height:{size};" role="status" aria-label={label}></span>

<style>
	.spinner {
		display: inline-block;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin var(--duration-spin, 1s) linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			opacity: 0.5;
		}
	}
</style>
