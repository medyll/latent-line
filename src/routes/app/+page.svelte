
<script>
	import AssetManager from '$lib/components/app/AssetManager.svelte';
	import PropertiesPanel from '$lib/components/app/PropertiesPanel.svelte';
	import SequenceOrchestrator from '$lib/components/app/SequenceOrchestrator.svelte';
	import SystemFooter from '$lib/components/app/SystemFooter.svelte';
	import { Card } from '$lib/components/ui/card';
/**
 * AppPage.svelte
 *
 * @component AppPage
 * @description Main app layout using shadcn-svelte primitives for structure and styling.
 */

import * as Resizable from '$lib/components/ui/resizable/index.js';
</script>

<!--
  AppPage Layout
  Uses shadcn-svelte Card for structure and consistent styling.
-->

<!--
  AppPage Layout with shadcn-svelte sidebar and leftbar using Resizable.Pane
-->
<Resizable.PaneGroup direction="horizontal" class="w-full max-w-7xl mx-auto min-h-[100dvh] bg-white">
  <!-- Leftbar: Asset Manager -->
  <Resizable.Pane defaultSize={320} minSize={200} maxSize={480} class="h-full">
    <Card class="h-full border-r px-4 py-6 md:border-none md:px-2 md:py-2">
      <AssetManager>
        {#if $loading}
          <Card class="flex items-center justify-center min-h-[200px] animate-pulse bg-muted">
            <span class="text-gray-500">Loading assets…</span>
          </Card>
        {:else if $error}
          <Card class="flex items-center justify-center min-h-[200px] bg-destructive text-destructive-foreground">
            <span>{$error}</span>
          </Card>
        {:else if $assets.length === 0}
          <Card class="flex items-center justify-center min-h-[200px] bg-muted">
            <span class="text-gray-400">No assets found. Add your first asset!</span>
          </Card>
        {:else}
          <!-- Render asset list with micro-interactions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each $assets as asset, i}
              <Card class="transition-all duration-300 ease-spring hover:-translate-y-1 hover:scale-98" style="animation-delay: calc({i} * 80ms)">
                <Avatar asset={asset} />
                <div class="mt-2 font-semibold">{asset.name}</div>
              </Card>
            {/each}
          </div>
        {/if}
      </AssetManager>
    </Card>
  </Resizable.Pane>

  <Resizable.Handle />

  <!-- Central Zone: Sequence Orchestrator -->
  <Resizable.Pane defaultSize={0} minSize={0} class="flex-1 h-full">
    <Card class="h-full px-4 py-6 md:px-2 md:py-2">
      <SequenceOrchestrator>
        {#if $loading}
          <Card class="flex items-center justify-center min-h-[200px] animate-pulse bg-muted">
            <span class="text-gray-500">Loading sequence…</span>
          </Card>
        {:else if $error}
          <Card class="flex items-center justify-center min-h-[200px] bg-destructive text-destructive-foreground">
            <span>{$error}</span>
          </Card>
        {:else if $sequence.length === 0}
          <Card class="flex items-center justify-center min-h-[200px] bg-muted">
            <span class="text-gray-400">No sequence events yet.</span>
          </Card>
        {:else}
          <!-- Render sequence with micro-interactions -->
          <div class="flex flex-col gap-4">
            {#each $sequence as event, i}
              <Card class="transition-all duration-300 ease-spring hover:-translate-y-1 hover:scale-98" style="animation-delay: calc({i} * 80ms)">
                <div class="font-mono text-xs text-gray-500">{event.time}</div>
                <div class="mt-2">{event.frame.actors?.map(a => a.id).join(', ')}</div>
              </Card>
            {/each}
          </div>
        {/if}
      </SequenceOrchestrator>
      <!-- Timeline bottom placeholder -->
      <div>Timeline bottom</div>
    </Card>
  </Resizable.Pane>

  <Resizable.Handle />

  <!-- Sidebar: Properties Panel -->
  <Resizable.Pane defaultSize={320} minSize={200} maxSize={480} class="h-full">
    <Card class="h-full border-l px-4 py-6 md:border-none md:px-2 md:py-2">
      <PropertiesPanel>
        {#if $loading}
          <Card class="flex items-center justify-center min-h-[200px] animate-pulse bg-muted">
            <span class="text-gray-500">Loading properties…</span>
          </Card>
        {:else if $error}
          <Card class="flex items-center justify-center min-h-[200px] bg-destructive text-destructive-foreground">
            <span>{$error}</span>
          </Card>
        {:else if !$selected}
          <Card class="flex items-center justify-center min-h-[200px] bg-muted">
            <span class="text-gray-400">No element selected.</span>
          </Card>
        {:else}
          <!-- Render properties with micro-interactions -->
          <div class="transition-all duration-300 ease-spring hover:-translate-y-1 hover:scale-98">
            <div class="font-semibold">{$selected.name}</div>
            <div class="mt-2 text-sm text-gray-600">{$selected.details}</div>
          </div>
        {/if}
      </PropertiesPanel>
    </Card>
  </Resizable.Pane>

  <!-- Footer: System Configuration -->
  <!-- Not resizable, placed outside PaneGroup -->
</Resizable.PaneGroup>

<Card as="footer" class="w-full border-t px-4 py-3 md:px-2 md:py-2">
      <SystemFooter>
        {#if $loading}
          <Card class="flex items-center justify-center min-h-[80px] animate-pulse bg-muted">
            <span class="text-gray-500">Loading system config…</span>
          </Card>
        {:else if $error}
          <Card class="flex items-center justify-center min-h-[80px] bg-destructive text-destructive-foreground">
            <span>{$error}</span>
          </Card>
        {:else}
          <!-- Render system config with micro-interactions -->
          <div class="transition-all duration-300 ease-spring hover:-translate-y-1 hover:scale-98">
            <div class="font-mono text-xs text-gray-500">{$config.checkpoint}</div>
            <div class="mt-2 text-sm text-gray-600">Sampler: {$config.sampler}</div>
          </div>
        {/if}
      </SystemFooter>
</Card>

<style>
/* Ensure layout fills viewport height */
.app-layout {
  min-height: 100dvh;
}
</style>
