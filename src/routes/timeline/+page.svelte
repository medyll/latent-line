<script lang="ts">
	import type { PageProps } from './$types';
	import LatentLine from '$lib/components/app/latent-line.svelte';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data: _data }: PageProps = $props();
</script>

<LatentLine />
