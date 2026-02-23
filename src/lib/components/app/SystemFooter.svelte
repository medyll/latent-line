

<script>
/**
 * SystemFooter.svelte
 *
 * @component SystemFooter
 * @description Displays technical configuration controls and export pipeline for the model.
 * @example <SystemFooter />
 */
import exampleModel from '$lib/model/model-example';
import { Button } from '$lib/components/ui/button';
import { Label } from '$lib/components/ui/label';

/**
 * Export the current model as a JSON file.
 */
function exportModel() {
  // Export model as JSON
  const data = JSON.stringify(exampleModel, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'model.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
SystemFooter
<!--
  SystemFooter Component
  Shows technical configuration controls and export pipeline for the model.
-->
<div class="flex items-center justify-between" aria-label="System Footer">
  <div class="flex gap-4 items-center">
    <!-- Checkpoint selection -->
    <Label for="checkpoint-select">Checkpoint:</Label>
    <select id="checkpoint-select" tabindex="0" class="border rounded px-2 py-1">
      <option>default</option>
      <option>custom</option>
    </select>
    <!-- Sampler selection -->
    <Label for="sampler-select">Sampler:</Label>
    <select id="sampler-select" tabindex="0" class="border rounded px-2 py-1">
      <option>Euler</option>
      <option>DDIM</option>
    </select>
    <!-- TTS Engine selection -->
    <Label for="tts-select">TTS Engine:</Label>
    <select id="tts-select" tabindex="0" class="border rounded px-2 py-1">
      <option>Coqui</option>
      <option>Google</option>
    </select>
  </div>
  <!-- Export JSON button -->
  <Button on:click={exportModel} aria-label="Export JSON">Export JSON</Button>
</div>