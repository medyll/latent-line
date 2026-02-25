<script lang="ts">
	import type { PageProps } from './$types';
	import Timeline from '$lib/components/app/timeline.svelte';
	let { data }: PageProps = $props();
</script>

<Timeline />
