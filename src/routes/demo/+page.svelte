<!-- eslint-disable svelte/no-navigation-without-resolve -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Redirect browser to the actual demo-model page
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto('/demo-model');
	});
</script>

<main class="p-6">
	<h1 class="mb-2 text-xl font-semibold">Redirection…</h1>
	<p>
		Vous êtes redirigé vers <a href="/demo-model" class="text-sky-600 hover:underline"
			>/demo-model</a
		>
	</p>
</main>
