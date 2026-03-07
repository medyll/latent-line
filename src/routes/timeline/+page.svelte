<script lang="ts">
	import type { PageProps } from './$types';
	import Timeline from '$lib/components/app/timeline.svelte';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data: _data }: PageProps = $props();
</script>

<Timeline />
