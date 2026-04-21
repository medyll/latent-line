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

	// Sync theme with data-theme attribute for css-base
	$effect(() => {
		if (prefs.theme === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else if (prefs.theme === 'light') {
			document.documentElement.setAttribute('data-theme', 'light');
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Latent Line</title>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="flex items-center gap-md">
			<h1 class="text-lg font-semibold text-gradient hide-mobile">Latent Line</h1>
		</div>
		<div class="flex items-center gap-sm">
			<LanguageSelector compact />
			<button
				class="icon-btn"
				onclick={() => (showPrefs = true)}
				title={t('toolbar.preferences')}
				aria-label={t('toolbar.preferences')}
				type="button"
			>
				⚙
			</button>
			<button
				class="icon-btn"
				onclick={() => {
					prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark';
				}}
				title={prefs.theme === 'dark' ? t('toolbar.toggleTheme.toLight') : t('toolbar.toggleTheme.toDark')}
				aria-label={prefs.theme === 'dark' ? t('toolbar.toggleTheme.toLight') : t('toolbar.toggleTheme.toDark')}
				type="button"
			>
				{prefs.theme === 'dark' ? '☀️' : '🌙'}
			</button>
		</div>
	</header>
	
	<main class="app-main">
		{@render children()}
	</main>
</div>

{#if showPrefs}
	{#await import('$lib/components/app/PreferencesPanel.svelte') then { default: PreferencesPanel }}
		<PreferencesPanel onclose={() => (showPrefs = false)} />
	{/await}
{/if}

<ToastManager />
