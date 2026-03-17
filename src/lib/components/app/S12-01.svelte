<script lang="ts">
  import { getContext } from 'svelte';
  import { MODEL_STORE_KEY } from '$lib/context/keys';
  import { createModelTemplate } from '$lib/model/model-template';

  export let message: string = 'S12-01 placeholder';

  // Try to obtain the model from context. If not present, `model` will be undefined.
  let model: any;
  try {
    model = getContext(MODEL_STORE_KEY);
  } catch {
    model = undefined;
  }

  function insertSampleEvent() {
    const template = createModelTemplate();
    const sample = template.timeline[0];
    if (!sample) return;

    if (model && Array.isArray(model.timeline)) {
      // Find an insert time after the last event
      const last = model.timeline.length ? Math.max(...model.timeline.map((e: any) => e.time)) : 0;
      const newEvent = JSON.parse(JSON.stringify(sample));
      newEvent.time = last + 60; // add 60 frames later
      model.timeline.push(newEvent);
      // force an update if store uses reactive proxies — mutate in place as other components do
    } else {
      // no model context — inform the developer
      // eslint-disable-next-line no-console
      console.warn('S12-01: no model context found; cannot insert event');
      // show quick feedback
      alert('No model context available to insert sample event.');
    }
  }
</script>

<section class="s12-01">
  <h2>S12-01</h2>
  <p>{message}</p>
  <div style="margin-top:8px">
    <button onclick={insertSampleEvent}>Insert sample timeline event</button>
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
