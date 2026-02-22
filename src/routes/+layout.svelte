
<script lang="ts">
import { Card } from "$lib/components/ui/card/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import favicon from '$lib/assets/favicon.svg';
import "$lib/styles/app.css";

const demos = [
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

<div class="flex h-screen w-screen bg-background">
	<Card class="w-64 h-full border-r bg-muted flex flex-col">
		<div class="font-bold text-lg p-4 border-b flex items-center justify-between">
			Latent Line
			<Button variant="outline" onclick={toggleTheme}>
				{theme === 'dark' ? '☀️' : '🌙'}
			</Button>
		</div>
		<div class="flex flex-col gap-2 p-4 flex-1">
			{#each demos as demo (demo.path)}
				<Button variant="ghost" class="justify-start w-full" onclick={() => window.location.href = demo.path}>
					{demo.name}
				</Button>
			{/each}
		</div>
	</Card>
	<main class="flex-1 flex items-center justify-center bg-background"> 
			<div>{@render children()}</div>
	</main>
</div>
