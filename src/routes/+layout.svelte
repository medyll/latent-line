<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
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

	function toggleTheme() {
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

<!--
	AppLayout using shadcn-svelte Card for sidebar and main content.
-->
<div class="h-screen w-screen overflow-hidden">
	<Sidebar.Provider
		style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
	>
		<AppSidebar />
		<Sidebar.Inset>
			<div class="flex h-full flex-col">
				<header class="flex flex-row items-center gap-2 border-b px-4">
					<Sidebar.Trigger class="-ms-1" /> latent-line
				</header>
				<main class="overflow-none w-full flex-1">
					{@render children()}
				</main>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>
