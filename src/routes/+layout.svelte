<script lang="ts"> 
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/app.css';

	let theme: 'light' | 'dark' = $state('light');
	let { children } = $props();

	function setTheme(newTheme: 'light' | 'dark') {
		theme = newTheme;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', theme === 'dark');
			localStorage.setItem('theme', theme);
		}
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */
	function _toggleTheme() {
		setTheme(theme === 'light' ? 'dark' : 'light');
	}

	if (typeof document !== 'undefined') {
		// On mount, restore theme from localStorage
		const saved = localStorage.getItem('theme');
		if (saved === 'dark') {
			setTheme('dark');
		} else {
			setTheme('light');
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen w-screen overflow-hidden">
	<div class="flex h-full flex-col">
		<main class="overflow-none w-full flex-1">
			{@render children()}
		</main>
	</div>
</div>
