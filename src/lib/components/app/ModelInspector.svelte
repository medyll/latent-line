
<script lang="ts">
/**
 * ModelInspector.svelte
 *
 * @component ModelInspector
 * @description Allows inspection, validation, and switching between example/template models.
 *              Shows project, assets, timeline, and raw JSON.
 * @example <ModelInspector />
 */
import { Button } from '$lib/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';
import exampleModel from '$lib/model/model-example';
import { modelTemplate, modelSchema } from '$lib/model/model-template';
import type { Model } from '$lib/model/model-types';

/**
 * Selected model state (example or template).
 * @type {import('$lib/model/model-types').Model}
 */
const selected = $state<Model>(exampleModel);
/**
 * Validation result state.
 * @type {{$ok: boolean, message?: string} | null}
 */
const validation = $state<{ ok: boolean; message?: string } | null>(null);

/**
 * Validate the current model using Zod schema.
 * @param {Model} m
 */
function validate(m: Model) {
  const r = modelSchema.safeParse(m);
  if (r.success) {
    validation.value = { ok: true, message: 'Valid model (Zod).' };
  } else {
    validation.value = { ok: false, message: r.error.message };
  }
}

/**
 * Switch to example model.
 */
function useExample() {
  selected.value = exampleModel;
  validation.value = null;
}

/**
 * Switch to template model.
 */
function useTemplate() {
  selected.value = modelTemplate;
  validation.value = null;
}
</script>


<!--
  ModelInspector Component
  Allows switching between example/template models, validation, and inspection of project, assets, timeline, and raw JSON.
-->
<div class="max-w-2xl flex flex-col gap-6">
  <!-- Model Inspector Controls -->
  <Card>
    <CardHeader>
      <CardTitle>Model Inspector</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2 mb-4">
        <Button on:click={useExample}>Use example model</Button>
        <Button on:click={useTemplate}>Use template model</Button>
        <Button on:click={() => validate(selected)} class="ml-auto">Validate</Button>
      </div>

      {#if validation}
        <!-- Validation result -->
        <div class="p-3 mb-4 rounded-md" class:success={validation && validation.ok} style="background: {validation && validation.ok ? '#ecfccb' : '#fee2e2'}">
          <strong>{validation && validation.ok ? 'OK' : 'INVALID'}</strong>: {validation && validation.message}
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Project Info -->
  <Card>
    <CardHeader>
      <CardTitle>Project</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-sm">
        <div><strong>Name:</strong> {selected.project.name}</div>
        <div><strong>FPS:</strong> {selected.project.fps}</div>
        <div><strong>Resolution:</strong> {selected.project.resolution.w}×{selected.project.resolution.h}</div>
      </div>
    </CardContent>
  </Card>

  <!-- Assets Info -->
  <Card>
    <CardHeader>
      <CardTitle>Assets</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-sm">
        <div><strong>Characters:</strong> {selected.assets.characters.length}</div>
        <div><strong>Environments:</strong> {Object.keys(selected.assets.environments).join(', ')}</div>
        <div><strong>Audio tracks:</strong> {selected.assets.audio.length}</div>
      </div>
    </CardContent>
  </Card>

  <!-- Timeline Info -->
  <Card>
    <CardHeader>
      <CardTitle>Timeline</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-sm">
        <div><strong>Events:</strong> {selected.timeline.length}</div>
        {#if selected.timeline.length > 0}
          <!-- List of timeline events -->
          <ul class="list-disc pl-5 mt-2">
            {#each selected.timeline as ev (ev.time)}
              <li>time: {ev.time} — actors: {ev.frame.actors ? ev.frame.actors.length : 0}</li>
            {/each}
          </ul>
        {:else}
          <!-- Empty state for timeline -->
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No events</EmptyTitle>
              <EmptyDescription>The timeline is empty.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Raw JSON View -->
  <Card>
    <CardHeader>
      <CardTitle>Raw JSON</CardTitle>
    </CardHeader>
    <CardContent>
      <pre class="text-xs max-h-60 overflow-auto bg-slate-100 p-2 rounded">{JSON.stringify(selected, null, 2)}</pre>
    </CardContent>
  </Card>
</div>

<style>
/* Success background for validation result */
.success { background: #ecfccb }
</style>
