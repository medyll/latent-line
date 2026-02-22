<script lang="ts">
    import type { PageProps } from './$types';
    import Timeline from "$lib/components/timeline.svelte";
    let { data }: PageProps = $props();
</script>

<div class="flex flex-col h-screen w-screen bg-background">
	<div class="flex-1 flex items-center justify-center">
		<Timeline />
	</div>
</div>