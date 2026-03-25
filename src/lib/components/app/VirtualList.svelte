<script lang="ts" generics="T">
	/**
	 * VirtualList — renders only visible items from a large array.
	 * Uses scrollTop + itemHeight to compute visible slice with overscan.
	 */

	import type { Snippet } from 'svelte';

	let {
		items,
		itemHeight = 64,
		overscan = 3,
		children
	}: {
		items: T[];
		itemHeight?: number;
		overscan?: number;
		children: Snippet<[T, number]>;
	} = $props();

	let containerEl = $state<HTMLElement | null>(null);
	let containerHeight = $state(0);
	let scrollTop = $state(0);

	const totalHeight = $derived(items.length * itemHeight);

	const startIndex = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));
	const endIndex = $derived(
		Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)
	);

	const visibleItems = $derived(items.slice(startIndex, endIndex + 1));
	const offsetTop = $derived(startIndex * itemHeight);

	function onScroll(e: Event) {
		scrollTop = (e.currentTarget as HTMLElement).scrollTop;
	}

	$effect(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver(([entry]) => {
			containerHeight = entry.contentRect.height;
		});
		ro.observe(containerEl);
		containerHeight = containerEl.clientHeight;
		return () => ro.disconnect();
	});
</script>

<div
	bind:this={containerEl}
	class="virtual-list"
	onscroll={onScroll}
	style="height:100%;overflow-y:auto;position:relative;"
	role="list"
>
	<!-- spacer to maintain total scroll height -->
	<div style="height:{totalHeight}px;position:relative;">
		<div style="position:absolute;top:{offsetTop}px;left:0;right:0;">
			{#each visibleItems as item, i (startIndex + i)}
				{@render children(item, startIndex + i)}
			{/each}
		</div>
	</div>
</div>
