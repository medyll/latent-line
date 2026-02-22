<script lang="ts">
import { Card } from "$lib/components/ui/card/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import favicon from '$lib/assets/favicon.svg';

const demos = [
	{ name: "Demo Timeline", path: "/demo" },
	{ name: "Demo Model", path: "/demo-model" },
	// Add more demos as needed
];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen w-screen bg-background">
	<Card class="w-64 h-full border-r bg-muted flex flex-col">
		<div class="font-bold text-lg p-4 border-b">Latent Line</div>
		<div class="flex flex-col gap-2 p-4 flex-1">
			{#each demos as demo (demo.path)}
				<Button variant="ghost" class="justify-start w-full" onclick={() => window.location.href = demo.path}>
					{demo.name}
				</Button>
			{/each}
		</div>
	</Card>
	<main class="flex-1 flex items-center justify-center bg-background">
		<Card class="w-full h-full max-w-5xl m-8 p-6 shadow-lg">
			{@render children()}
		</Card>
	</main>
</div>
