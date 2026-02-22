<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect browser to the actual demo-model page
    goto('/demo-model');
  });
</script>

<main class="p-6">
  <h1 class="text-xl font-semibold mb-2">Redirection…</h1>
  <p>Vous êtes redirigé vers <a href="/demo-model" class="text-sky-600 hover:underline">/demo-model</a></p>
</main>
