<script lang="ts">
  import App from '../App.svelte'
</script>

<App />
<script lang="ts">
  import ModelInspector from '$lib/ui/ModelInspector.svelte';
</script>

<main class="min-h-screen flex items-center justify-center bg-slate-50">
  <div class="p-8 bg-white rounded-lg shadow w-full max-w-4xl">
    <header class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">latent-line</h1>
        <p class="text-sm text-slate-600">SvelteKit demo: model inspector</p>
      </div>
      <nav>
        <a href="#demo" class="text-sky-600 hover:underline">Voir la démo</a>
      </nav>
    </header>

    <section id="demo">
      <ModelInspector />
    </section>
  </div>
</main>
