<script lang="ts">
	import ModelInspector from '$lib/components/app/ModelInspector.svelte';
</script>

<main>
	<h1 class="mb-4 text-2xl font-bold">Demo Model — Validation & Preview</h1>
	<p class="mb-6">Interface minimale pour explorer et valider <em>model-example</em>.</p>
	<ModelInspector />
</main>

<style>
	main {
		max-width: 920px;
		text-align: left;
	}
</style>
