<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/app.css';

	let theme: 'light' | 'dark' = $state('light');
	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#snippet figure(image: { src: string; caption: string; width: number; height: number })}
	<figure>
		<img src={image.src} alt={image.caption} width={image.width} height={image.height} />
		<figcaption>{image.caption}</figcaption>
	</figure>
{/snippet}
<!--
        AppLayout using shadcn-svelte Card for sidebar and main content.
    -->
<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	{@render children?.sidebar?.()}
	<Sidebar.Inset>
		<header aria-label="Application header" class="flex h-16 shrink-0 items-center gap-2 border-b px-4" style="background:var(--color-card); color:var(--color-card-foreground);">
			<div>
				<div><Sidebar.Trigger class="-ms-1" /></div>
				<div></div>
			</div>
		</header>
		<main
			class="flex h-full flex-1 flex-col items-start justify-start border-none p-0 shadow-none"
			style="background:var(--color-background); color:var(--color-foreground)">
			{@render children?.()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
