<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '@medyll/css-base';
	import '$lib/styles/app.css';
	import '$lib/styles/workspace.css';
	import { createPreferencesStore, PREFS_CONTEXT_KEY } from '$lib/stores/preferences.svelte';
	import ToastManager from '$lib/components/ui/ToastManager.svelte';
	import LanguageSelector from '$lib/components/ui/LanguageSelector.svelte';
	import Icon from '$lib/components/ds/Icon.svelte';
	import { locale, t } from '$lib/i18n';
	import { validateStorageVersion } from '$lib/utils/storage-cleanup';
	import { generationStats } from '$lib/stores/generation.svelte';

	let { children } = $props();

	const { prefs, reset } = createPreferencesStore();
	setContext(PREFS_CONTEXT_KEY, { prefs, reset });

	let showPrefs = $state(false);

	onMount(() => {
		validateStorageVersion();
	});

	$effect(() => {
		locale.value = prefs.language ?? 'en';
	});
	$effect(() => {
		prefs.language = locale.value;
	});

	let stats = $state({ total: 0, done: 0, error: 0, generating: 0 });
	$effect(() => {
		const unsub = generationStats.subscribe((s) => (stats = s));
		return unsub;
	});

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

	function cycleTheme() {
		const modes = ['light', 'dark', 'system'] as const;
		const idx = modes.indexOf(prefs.theme);
		prefs.theme = modes[(idx + 1) % modes.length];
	}

	function themeIcon(mode: string) {
		if (mode === 'dark') return 'sun';
		if (mode === 'light') return 'moon';
		return 'sparkle';
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Latent Line</title>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="header-brand">
			<span class="brand-mark">LL</span>
			<h1 class="brand-title hide-mobile">Latent Line</h1>
		</div>

		<nav class="header-nav" aria-label="Main">
			<a href="/" class="nav-link" aria-current={undefined}>{t('timeline.title')}</a>
			<a href="/present" class="nav-link">Screening</a>
		</nav>

		<div class="header-tools">
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
				class="tool-btn"
				onclick={() => (showPrefs = true)}
				title={t('toolbar.preferences')}
				aria-label={t('toolbar.preferences')}
				type="button"
			>
				<Icon name="settings" size={18} />
			</button>
			<button
				class="tool-btn theme-toggle"
				onclick={cycleTheme}
				title={`Theme: ${prefs.theme}`}
				aria-label={`Theme: ${prefs.theme}`}
				type="button"
			>
				<Icon name={themeIcon(prefs.theme)} size={18} />
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
	/* ── Header overrides using new v2.0 tokens ── */
	.app-header {
		height: 48px;
		display: flex;
		align-items: center;
		padding: 0 var(--pad-md);
		gap: var(--gap-md);
		border-bottom: var(--border-width) solid var(--border);
		background: var(--surface);
		flex-shrink: 0;
	}

	.header-brand {
		display: flex;
		align-items: center;
		gap: var(--gap-sm);
	}

	.brand-mark {
		font-family: var(--font-display);
		font-size: 1.25rem;
		line-height: 1;
		color: var(--accent2);
		letter-spacing: 0.05em;
	}

	.brand-title {
		font-family: var(--font-sans);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--text);
		margin: 0;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: var(--gap-xs);
	}

	.nav-link {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--text-muted);
		text-decoration: none;
		padding: var(--pad-xs) var(--pad-sm);
		border-radius: var(--radius-md);
		transition:
			color var(--transition-fast),
			background var(--transition-fast);
	}

	.nav-link:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.header-tools {
		display: flex;
		align-items: center;
		gap: var(--gap-xs);
		margin-left: auto;
	}

	.tool-btn {
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: var(--radius-md);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-lg);
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.tool-btn:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.theme-toggle {
		font-size: var(--text-sm);
	}

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
		background: color-mix(in oklch, var(--accent2) 12%, transparent);
		color: var(--accent2);
		border: var(--border-width) solid color-mix(in oklch, var(--accent2) 30%, transparent);
	}
	.gen-badge--done {
		background: color-mix(in oklch, var(--accent3) 10%, transparent);
		color: var(--accent3);
		border: var(--border-width) solid color-mix(in oklch, var(--accent3) 25%, transparent);
	}
	.gen-spinner {
		display: inline-block;
		width: 8px;
		height: 8px;
		border: 1.5px solid color-mix(in oklch, var(--accent2) 30%, transparent);
		border-top-color: var(--accent2);
		border-radius: var(--radius-full);
		animation: gspin 0.8s linear infinite;
	}
	@keyframes gspin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
