<script lang="ts">
	import { locale, SUPPORTED_LOCALES, t } from '$lib/i18n';

	let { compact = false }: { compact?: boolean } = $props();

	const FLAGS: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷' };
</script>

<div class="lang-selector" role="group" aria-label={t('preferences.language.label')}>
	{#each SUPPORTED_LOCALES as lang}
		<button
			class="lang-btn {locale.value === lang ? 'active' : ''}"
			onclick={() => {
				locale.value = lang;
			}}
			aria-pressed={locale.value === lang}
			aria-label={t(`language.${lang}`)}
			title={t(`language.${lang}`)}
		>
			<span aria-hidden="true">{FLAGS[lang]}</span>
			{#if !compact}<span class="lang-label">{t(`language.${lang}`)}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.lang-selector {
		display: flex;
		gap: 0.125rem;
		align-items: center;
	}
	.lang-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: var(--text-xs);
		background: none;
		border: var(--border-width) solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--color-text-muted);
		transition: background var(--transition-fast);
	}
	.lang-btn:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}
	.lang-btn.active {
		background: var(--color-surface-3);
		border-color: var(--color-border);
		color: var(--color-text);
		font-weight: var(--font-medium);
	}
	.lang-label {
		font-size: var(--text-xs);
	}
</style>
