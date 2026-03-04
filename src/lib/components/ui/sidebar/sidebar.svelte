<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { useSidebar } from './context.svelte.js';

	export let ref = null;
	export let side = 'left';
	export let variant = 'sidebar';
	export let collapsible = 'none';
	export let className = '';
	export let children = undefined;
	export let restProps = {};

	const sidebar = useSidebar();
</script>

{#if collapsible === 'none'}
	<aside
		class="sidebar flex h-screen min-h-0 w-[220px] flex-col border-r border-zinc-200 bg-zinc-50 px-4 py-6 md:w-64 {className}"
		bind:this={ref}
		{...restProps}
	>
		<div class="sidebar-header mb-8">
			<slot name="header" />
		</div>
		<nav class="sidebar-nav flex-1">
			<slot />
		</nav>
	</aside>
{:else if sidebar.isMobile}
	<Sheet.Root bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)} {...restProps}>
		<Sheet.Content data-sidebar="sidebar">
			<div
				class="sidebar flex h-screen min-h-0 w-[220px] flex-col border-r border-zinc-200 bg-zinc-50 px-4 py-6 md:w-64 {className}"
			>
				<div class="sidebar-header mb-8">
					<slot name="header" />
				</div>
				<nav class="sidebar-nav flex-1">
					<slot />
				</nav>
			</div>
			<Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<div
		class="sidebar flex h-screen min-h-0 w-[220px] flex-col border-r border-zinc-200 bg-zinc-50 px-4 py-6 md:w-64 {className}"
		bind:this={ref}
		{...restProps}
	>
		<div class="sidebar-header mb-8">
			<slot name="header" />
		</div>
		<nav class="sidebar-nav flex-1">
			<slot />
		</nav>
	</div>
{/if}

<style>
	.sidebar {
		width: 220px;
		min-width: 0;
		max-width: 100vw;
	}
	@media (max-width: 768px) {
		.sidebar {
			width: 100vw;
			min-width: 0;
			max-width: 100vw;
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
			height: auto;
			flex-direction: row;
			padding: 0.5rem 0;
		}
	}
	.sidebar-header {
		font-weight: 700;
		font-size: 1.5rem;
		text-align: left;
		padding: 0;
	}
	.sidebar-nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
