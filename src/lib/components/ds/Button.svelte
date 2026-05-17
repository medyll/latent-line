<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit';
		onclick?: (e: MouseEvent) => void;
		icon?: string;
		label?: string;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		icon,
		label,
		children
	}: Props = $props();

	const iconSize = $derived.by(() => {
		if (size === 'sm') return 14;
		if (size === 'lg') return 20;
		return 16;
	});
</script>

<button
	class="btn btn-{variant} btn-{size}"
	{type}
	{disabled}
	onclick={disabled ? undefined : onclick}
>
	{#if icon}
		<Icon name={icon} size={iconSize} />
	{/if}
	{#if label}
		<span class="label">{label}</span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md, 6px);
		font-family: var(--font-body, system-ui, sans-serif);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast, 0.15s);
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-sm {
		height: 28px;
		padding: 0 0.625rem;
		font-size: 0.75rem;
	}

	.btn-md {
		height: 36px;
		padding: 0 0.875rem;
		font-size: 0.8125rem;
	}

	.btn-lg {
		height: 44px;
		padding: 0 1.25rem;
		font-size: 0.9375rem;
	}

	.btn-primary {
		background: var(--accent2);
		color: white;
		border-color: var(--accent2);
	}

	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-secondary {
		background: var(--surface2);
		color: var(--text);
		border-color: var(--border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--surface3);
		border-color: var(--text-dim);
	}

	.btn-ghost {
		background: transparent;
		color: var(--text-dim);
		border-color: transparent;
	}

	.btn-ghost:hover:not(:disabled) {
		background: var(--surface2);
		color: var(--text);
	}

	.btn-danger {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.btn-danger:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.label {
		line-height: 1;
	}
</style>
