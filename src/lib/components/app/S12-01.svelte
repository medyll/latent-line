<script lang="ts">
  import { getContext } from 'svelte';
  import { MODEL_STORE_KEY } from '$lib/context/keys';
  import { createSampleEvent } from '$lib/features/s12-01';

  export let message: string = 'S12-01 placeholder';

  // Try to obtain the model from context. If not present, `model` will be undefined.
  let model: any;
  try {
    model = getContext(MODEL_STORE_KEY);
  } catch {
    model = undefined;
  }

  let offset: number = 60;

  function insertSampleEvent() {
    if (model && Array.isArray(model.timeline)) {
      const last = model.timeline.length ? Math.max(...model.timeline.map((e: any) => e.time)) : 0;
      const newEvent = createSampleEvent(last + Number(offset));
      model.timeline.push(JSON.parse(JSON.stringify(newEvent)));
    } else {
      console.warn('S12-01: no model context found; cannot insert event');
      alert('No model context available to insert sample event.');
    }
  }
</script>

<section class="s12-01">
  <h2>S12-01</h2>
  <p>{message}</p>
  <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
    <label style="font-size:0.9rem">Offset:</label>
    <input type="number" bind:value={offset} min="0" style="width:6rem" />
    <button onclick={insertSampleEvent}>Insert sample timeline event</button>
    {#if model && Array.isArray(model.timeline)}
      <small style="margin-left:8px">Events: {model.timeline.length}</small>
    {/if}
  </div>
</section>

<style>
  .s12-01{
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }
  .s12-01 h2{ margin: 0 0 8px 0; font-size: 1rem }
</style>
