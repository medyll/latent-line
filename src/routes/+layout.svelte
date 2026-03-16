<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/app.css';

	let theme: 'light' | 'dark' = $state('light');
	let { children } = $props();

	function setTheme(newTheme: 'light' | 'dark') {
		theme = newTheme;
		document.documentElement.style.colorScheme = newTheme;
		localStorage.setItem('theme', newTheme);
	}

	function toggleTheme() {
		setTheme(theme === 'light' ? 'dark' : 'light');
	}

	setContext('theme', { get current() { return theme; }, toggle: toggleTheme });

	onMount(() => {
		const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (saved === 'light' || saved === 'dark') setTheme(saved);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div style="display:flex;flex-direction:column;height:100dvh;width:100vw;overflow:hidden;">
	<div style="display:flex;align-items:center;justify-content:flex-end;padding:0 0.5rem;height:28px;border-bottom:var(--border-width) solid var(--color-border);flex-shrink:0;">
		<button onclick={toggleTheme} title="Toggle theme" style="font-size:var(--text-xs);background:none;border:none;cursor:pointer;color:var(--color-text-muted);">
			{theme === 'dark' ? '☀ Light' : '☾ Dark'}
		</button>
	</div>
	<main style="flex:1;min-height:0;overflow:hidden;">
		{@render children()}
	</main>
</div>
