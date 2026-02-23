
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
      <AssetManager />
    </Card>
  </Resizable.Pane>

  <Resizable.Handle />

  <!-- Central Zone: Sequence Orchestrator -->
  <Resizable.Pane defaultSize={0} minSize={0} class="flex-1 h-full">
    <Card class="h-full px-4 py-6 md:px-2 md:py-2">
      <SequenceOrchestrator />
      <!-- Timeline bottom placeholder -->
      <div>Timeline bottom</div>
    </Card>
  </Resizable.Pane>

  <Resizable.Handle />

  <!-- Sidebar: Properties Panel -->
  <Resizable.Pane defaultSize={320} minSize={200} maxSize={480} class="h-full">
    <Card class="h-full border-l px-4 py-6 md:border-none md:px-2 md:py-2">
      <PropertiesPanel />
    </Card>
  </Resizable.Pane>

  <!-- Footer: System Configuration -->
  <!-- Not resizable, placed outside PaneGroup -->
</Resizable.PaneGroup>

<Card as="footer" class="w-full border-t px-4 py-3 md:px-2 md:py-2">
  <SystemFooter />
</Card>

<style>
/* Ensure layout fills viewport height */
.app-layout {
  min-height: 100dvh;
}
</style>
