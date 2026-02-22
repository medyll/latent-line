<script lang="ts">
  import ModelInspector from '$lib/ui/ModelInspector.svelte';
</script>

<main class="p-6">
  <h1 class="text-2xl font-bold mb-4">Demo Model — Validation & Preview</h1>
  <p class="mb-6">Interface minimale pour explorer et valider <em>model-example</em>.</p>

  <ModelInspector />
</main>

<style>
main { max-width: 920px; margin: 0 auto }
</style>
