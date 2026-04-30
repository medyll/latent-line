<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '@medyll/css-base';
	import '$lib/styles/app.css';
	import '$lib/styles/workspace.css';
	import { createPreferencesStore, PREFS_CONTEXT_KEY } from '$lib/stores/preferences.svelte';
	import ToastManager from '$lib/components/ui/ToastManager.svelte';
	import LanguageSelector from '$lib/components/ui/LanguageSelector.svelte';
	import { locale, t } from '$lib/i18n';
	import { validateStorageVersion } from '$lib/utils/storage-cleanup';
	import { generationStats } from '$lib/stores/generation.svelte';

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

	let stats = $state({ total: 0, done: 0, error: 0, generating: 0 });
	$effect(() => {
		const unsub = generationStats.subscribe((s) => (stats = s));
		return unsub;
	});

	// Show "done" badge briefly after all complete
	let showDone = $state(false);
	let doneTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (stats.total > 0 && stats.generating === 0 && stats.done > 0) {
			showDone = true;
			clearTimeout(doneTimer);
			doneTimer = setTimeout(() => (showDone = false), 3000);
		}
		if (stats.generating > 0) showDone = false;
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
		<div class="flex items-center gap-sm" style="margin-left:auto;">
			{#if stats.generating > 0}
				<span class="gen-badge gen-badge--active">
					<span class="gen-spinner"></span>
					{stats.generating}/{stats.total} frames
				</span>
			{:else if showDone}
				<span class="gen-badge gen-badge--done">✓ {stats.done} done</span>
			{/if}
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
				title={prefs.theme === 'dark'
					? t('toolbar.toggleTheme.toLight')
					: t('toolbar.toggleTheme.toDark')}
				aria-label={prefs.theme === 'dark'
					? t('toolbar.toggleTheme.toLight')
					: t('toolbar.toggleTheme.toDark')}
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

<style>
	.gen-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--gap-xs);
		font-size: var(--text-xs);
		font-weight: var(--font-bold);
		padding: var(--pad-xs) var(--pad-sm);
		border-radius: var(--radius-full);
		white-space: nowrap;
	}
	.gen-badge--active {
		background: color-mix(in oklch, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
		border: var(--border-width) solid color-mix(in oklch, var(--color-primary) 30%, transparent);
	}
	.gen-badge--done {
		background: color-mix(in oklch, var(--color-success) 10%, transparent);
		color: var(--color-success);
		border: var(--border-width) solid color-mix(in oklch, var(--color-success) 25%, transparent);
	}
	.gen-spinner {
		display: inline-block;
		width: 8px;
		height: 8px;
		border: 1.5px solid color-mix(in oklch, var(--color-primary) 30%, transparent);
		border-top-color: var(--color-primary);
		border-radius: var(--radius-full);
		animation: gspin var(--duration-spin) linear infinite;
	}
	@keyframes gspin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
