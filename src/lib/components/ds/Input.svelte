<!-- Input.svelte — Search / text input with optional icon -->
<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		icon?: string;
		type?: 'text' | 'search' | 'number';
		size?: 'sm' | 'md';
		autofocus?: boolean;
		oninput?: (value: string) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		icon,
		type = 'text',
		size = 'md',
		autofocus = false,
		oninput,
		onkeydown
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		oninput?.(value);
	}
</script>

<div class="input-wrap input-{size}">
	{#if icon}
		<span class="input-icon">
			<Icon name={icon} size={size === 'sm' ? 14 : 16} />
		</span>
	{/if}
	<!-- svelte-ignore a11y_autofocus -->
	<input
		{type}
		{value}
		{placeholder}
		{autofocus}
		oninput={handleInput}
		{onkeydown}
		class="input-field"
	/>
</div>

<style>
	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.input-sm .input-field {
		height: 28px;
		padding: 0 0.5rem;
		font-size: 0.75rem;
	}
	.input-sm .input-icon {
		left: 0.5rem;
	}
	.input-sm .input-icon + .input-field {
		padding-left: 1.75rem;
	}

	.input-md .input-field {
		height: 36px;
		padding: 0 0.75rem;
		font-size: 0.8125rem;
	}
	.input-md .input-icon {
		left: 0.625rem;
	}
	.input-md .input-icon + .input-field {
		padding-left: 2rem;
	}

	.input-icon {
		position: absolute;
		color: var(--text-muted);
		pointer-events: none;
		display: flex;
		align-items: center;
	}

	.input-field {
		width: 100%;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--text);
		font-family: var(--font-sans);
		outline: none;
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.input-field::placeholder {
		color: var(--text-muted);
		opacity: 0.8;
	}

	.input-field:hover {
		border-color: var(--border2);
	}

	.input-field:focus {
		border-color: var(--accent2);
		box-shadow: 0 0 0 2px oklch(from var(--accent2) h s l / 0.15);
	}
</style>
