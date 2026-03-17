<script lang="ts">
	import ModelInspector from '$lib/components/app/ModelInspector.svelte';
	import S1201 from '$lib/components/app/S12-01.svelte';
</script>

<main>
	<h1 class="mb-4 text-2xl font-bold">Demo Model — Validation & Preview</h1>
	<p class="mb-6">Interface minimale pour explorer et valider <em>model-example</em>.</p>
	<ModelInspector />

	<section class="mt-8">
		<h2 class="text-lg font-semibold mb-2">S12-01 Feature (placeholder)</h2>
		<S1201 message="Placeholder integrated in demo-model page" />
	</section>
</main>

<style>
	main {
		max-width: 920px;
		text-align: left;
	}
</style>
