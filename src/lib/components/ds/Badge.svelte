<script lang="ts">
	interface Props {
		variant: 'character' | 'ai' | 'mood';
		label: string;
		color?: string;
		icon?: string;
		title?: string;
	}

	let { variant, label, color, icon, title }: Props = $props();
</script>

{#if variant === 'character'}
	<span class="badge-character" style:background-color={color} {title}>
		{label}
	</span>
{:else if variant === 'ai'}
	<span class="badge-ai" {title}>
		<svg class="sparkle" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
			<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
		</svg>
		{label}
	</span>
{:else if variant === 'mood'}
	<span class="badge-mood" style:color {title}>
		{#if icon}<span class="mood-icon">{icon}</span>{/if}
		<span class="mood-label">{label}</span>
	</span>
{/if}

<style>
	.badge-character {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		font-size: 0.6rem;
		font-weight: 700;
		color: white;
		letter-spacing: 0.02em;
		flex-shrink: 0;
		font-family: var(--font-mono, ui-monospace, monospace);
	}

	.badge-ai {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		background: var(--accent2);
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.sparkle {
		opacity: 0.9;
	}

	.badge-mood {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.mood-icon {
		font-size: 0.75rem;
		line-height: 1;
	}

	.mood-label {
		text-transform: lowercase;
	}
</style>
