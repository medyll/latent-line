<script lang="ts">
  import {Button} from '$lib/components/ui/button/index.js';
  import exampleModel from '$lib/model/model-example';
  import { modelTemplate, modelSchema } from '$lib/model/model-template';
  import type { Model } from '$lib/model/model-types';

  let selected: Model = exampleModel;
  let validation: { ok: boolean; message?: string } | null = null;

  function validate(m: Model) {
    const r = modelSchema.safeParse(m);
    if (r.success) {
      validation = { ok: true, message: 'Valid model (Zod).' };
    } else {
      validation = { ok: false, message: r.error.message };
    }
  }

  function useExample() {
    selected = exampleModel;
    validation = null;
  }

  function useTemplate() {
    selected = modelTemplate;
    validation = null;
  }
</script>

<div class="max-w-2xl">
  <div class="flex gap-2 mb-4">
    <Button on:click={useExample}>Use example model</Button>
    <Button on:click={useTemplate}>Use template model</Button>
    <Button on:click={() => validate(selected)} className="ml-auto">Validate</Button>
  </div>

  {#if validation}
    <div class="p-3 mb-4 rounded-md" class:success={validation.ok} style="background: {validation.ok ? '#ecfccb' : '#fee2e2'}">
      <strong>{validation.ok ? 'OK' : 'INVALID'}</strong>: {validation.message}
    </div>
  {/if}

  <section class="mb-4 p-4 border rounded">
    <h2 class="text-lg font-medium mb-2">Project</h2>
    <div class="text-sm">
      <div><strong>Name:</strong> {selected.project.name}</div>
      <div><strong>FPS:</strong> {selected.project.fps}</div>
      <div><strong>Resolution:</strong> {selected.project.resolution.w}×{selected.project.resolution.h}</div>
    </div>
  </section>

  <section class="mb-4 p-4 border rounded">
    <h2 class="text-lg font-medium mb-2">Assets</h2>
    <div class="text-sm">
      <div><strong>Characters:</strong> {selected.assets.characters.length}</div>
      <div><strong>Environments:</strong> {Object.keys(selected.assets.environments).join(', ')}</div>
      <div><strong>Audio tracks:</strong> {selected.assets.audio.length}</div>
    </div>
  </section>

  <section class="mb-4 p-4 border rounded">
    <h2 class="text-lg font-medium mb-2">Timeline</h2>
    <div class="text-sm">
      <div><strong>Events:</strong> {selected.timeline.length}</div>
      {#if selected.timeline.length > 0}
        <ul class="list-disc pl-5 mt-2">
          {#each selected.timeline as ev}
            <li>time: {ev.time} — actors: {ev.frame.actors ? ev.frame.actors.length : 0}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

  <section class="p-4 border rounded">
    <h2 class="text-lg font-medium mb-2">Raw JSON</h2>
    <pre class="text-xs max-h-60 overflow-auto bg-slate-100 p-2 rounded">{JSON.stringify(selected, null, 2)}</pre>
  </section>
</div>

<style>
.success { background: #ecfccb }
</style>
