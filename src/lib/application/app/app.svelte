<script lang="ts">

    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import favicon from '$lib/assets/favicon.svg';
    import "$lib/styles/app.css"; 
    
    
    let theme: 'light' | 'dark' = $state('light');
    let {	children } = $props();
    
    </script>
    <svelte:head><link rel="icon" href={favicon} /></svelte:head>
    {#snippet figure(image)}
        <figure>
            <img src={image.src} alt={image.caption} width={image.width} height={image.height} />
            <figcaption>{image.caption}</figcaption>
        </figure>
    {/snippet}
    <!--
        AppLayout using shadcn-svelte Card for sidebar and main content.
    -->
    <Sidebar.Provider
	    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"	>
        <slot name="sidebar" ></slot> 
	    <Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<div><div><Sidebar.Trigger class="-ms-1" /></div><div></div></div>
		</header> 
		<main class="flex-1 h-full bg-white shadow-none border-none p-0 flex flex-col items-start justify-start">
			<slot></slot>
		</main>		 
	</Sidebar.Inset>
</Sidebar.Provider>