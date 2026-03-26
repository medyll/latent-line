<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '@medyll/css-base';
	import '$lib/styles/app.css';
	import { createPreferencesStore, PREFS_CONTEXT_KEY } from '$lib/stores/preferences.svelte';
	import ToastManager from '$lib/components/ui/ToastManager.svelte';
	import LanguageSelector from '$lib/components/ui/LanguageSelector.svelte';
	import { locale, t } from '$lib/i18n';
	import { validateStorageVersion } from '$lib/utils/storage-cleanup';

	let { children } = $props();

	const { prefs, reset } = createPreferencesStore();
	setContext(PREFS_CONTEXT_KEY, { prefs, reset });

	let showPrefs = $state(false);

	// Storage cleanup on app startup
	onMount(() => {
		validateStorageVersion();
	});

	// Sync locale ↔ preferences
	$effect(() => {
		locale.value = prefs.language ?? 'en';
	});
	$effect(() => {
		prefs.language = locale.value;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div style="display:flex;flex-direction:column;height:100dvh;width:100vw;overflow:hidden;">
	<div
		style="display:flex;align-items:center;justify-content:flex-end;padding:0 0.5rem;height:28px;border-bottom:var(--border-width) solid var(--color-border);flex-shrink:0;gap:0.5rem;"
	>
		<LanguageSelector compact />
		<button
			onclick={() => (showPrefs = true)}
			title={t('toolbar.preferences')}
			aria-label={t('toolbar.preferences')}
			style="font-size:var(--text-xs);background:none;border:none;cursor:pointer;color:var(--color-text-muted);"
			>⚙</button
		>
		<button
			onclick={() => {
				prefs.theme = prefs.theme === 'light' ? 'dark' : 'light';
			}}
			title={t('toolbar.toggleTheme.toDark')}
			aria-label={t('toolbar.toggleTheme.toDark')}
			style="font-size:var(--text-xs);background:none;border:none;cursor:pointer;color:var(--color-text-muted);"
			>{prefs.theme === 'dark'
				? t('toolbar.toggleTheme.toLight')
				: t('toolbar.toggleTheme.toDark')}</button
		>
	</div>
	<main style="flex:1;min-height:0;overflow:hidden;">
		{@render children()}
	</main>
</div>

{#if showPrefs}
	{#await import('$lib/components/app/PreferencesPanel.svelte') then { default: PreferencesPanel }}
		<PreferencesPanel onclose={() => (showPrefs = false)} />
	{/await}
{/if}

<ToastManager />
