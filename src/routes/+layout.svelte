
<script lang="ts">
import { Card } from "$lib/components/ui/card/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import favicon from '$lib/assets/favicon.svg';
import "$lib/styles/app.css";
import { goto } from '$app/navigation';
	import { Sidebar, SidebarHeader, SidebarContent, SidebarMenuItem, SidebarProvider } from "$lib/components/ui/sidebar/index.js";

const demos = [
	{ name: "Demo App", path: "/app/" },
	{ name: "Demo Timeline", path: "/timeline" },
	{ name: "Demo Model", path: "/demo-model" },
	// Add more demos as needed
];

let theme: 'light' | 'dark' = $state('light');
let {	children } = $props();

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
<div class="w-full min-h-[100dvh] bg-background flex flex-row items-start">
	<!-- Sidebar navigation -->
	<SidebarProvider>
		<Sidebar class="h-full border-r bg-muted" style="min-width:220px;max-width:260px;width:16rem;">
			<SidebarHeader class="font-bold text-lg p-4 border-b flex items-center justify-between">
				Latent Line
				<Button variant="outline" onclick={toggleTheme}>
					{theme === 'dark' ? '☀️' : '🌙'}
				</Button>
			</SidebarHeader>
			<SidebarContent class="flex flex-col gap-2 p-4 flex-1">
				{#each demos as demo (demo.path)}
					<SidebarMenuItem class="w-full">
						<a href={demo.path} class="block w-full h-full px-2 py-1 rounded hover:bg-accent focus:bg-accent transition-colors">
							{demo.name}
						</a>
					</SidebarMenuItem>
				{/each}
			</SidebarContent>
		</Sidebar>
	</SidebarProvider>

	<!-- Main content area -->
	<main class="flex-1 h-full bg-white shadow-none border-none p-0 flex flex-col items-start justify-start px-8 py-8">
		{@render children()}
	</main>
</div>
