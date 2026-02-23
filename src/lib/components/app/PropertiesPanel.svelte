
<script>
/**
 * PropertiesPanel.svelte
 *
 * @component PropertiesPanel
 * @description Displays contextual properties for the selected element (camera, lighting, fx, controlnet).
 * @example <PropertiesPanel />
 */
// import { model } from '$lib/model-example';

/**
 * Selected element state.
 * @type {any}
 */
const selected = $state(null);

/**
 * Extracts properties from the selected element for display.
 * @param {any} element
 * @returns {{camera: any, lighting: any, fx: any, controlnet: any}}
 */
function getProperties(element) {
  if (!element) return {};
  // Example: show camera, lighting, fx, controlnet
  return {
    camera: element.frame?.camera,
    lighting: element.frame?.lighting,
    fx: element.frame?.fx,
    controlnet: element.frame?.controlnet,
  };
}
</script>

<!--
  PropertiesPanel Component
  Shows contextual properties for the currently selected element.
-->
<div class="flex flex-col gap-4" aria-label="Properties Panel">
  <h2 class="font-bold text-lg">Properties</h2>
  {#if selected}
    <div>
      <!-- Camera properties -->
      <h3 class="font-semibold">Camera</h3>
      <pre aria-label="Camera properties">{JSON.stringify(getProperties(selected).camera, null, 2)}</pre>
      <!-- Lighting properties -->
      <h3 class="font-semibold">Lighting</h3>
      <pre aria-label="Lighting properties">{JSON.stringify(getProperties(selected).lighting, null, 2)}</pre>
      <!-- FX properties -->
      <h3 class="font-semibold">FX</h3>
      <pre aria-label="FX properties">{JSON.stringify(getProperties(selected).fx, null, 2)}</pre>
      <!-- ControlNet properties -->
      <h3 class="font-semibold">ControlNet</h3>
      <pre aria-label="ControlNet properties">{JSON.stringify(getProperties(selected).controlnet, null, 2)}</pre>
    </div>
  {:else}
    <!-- No element selected state -->
    <div class="text-gray-500" aria-label="No element selected">No element selected</div>
  {/if}
</div>