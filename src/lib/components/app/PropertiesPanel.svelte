<script lang="ts">
	import type { TimelineEvent, TimelineFrame } from '$lib/model/model-types';

	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Displays contextual properties for the selected timeline event (camera, lighting, fx, controlnet).
	 * @example <PropertiesPanel />
	 */

	/**
	 * Selected timeline event state.
	 */
	const selected = $state<TimelineEvent | null>(null);

	/**
	 * Extracts properties from the selected event for display.
	 * @param event - The selected timeline event
	 * @returns An object containing camera, lighting, fx, and controlnet properties
	 */
	function getProperties(event: TimelineEvent): Partial<TimelineFrame> {
		if (!event) return {};
		return {
			camera: event.frame?.camera,
			lighting: event.frame?.lighting,
			fx: event.frame?.fx,
			controlnet: event.frame?.controlnet
		};
	}
</script>

<!--
  PropertiesPanel Component
  Shows contextual properties for the currently selected timeline event.
-->
<div class="flex flex-col gap-4" aria-label="Properties Panel">
	<h2 class="text-lg font-bold">Properties</h2>
	{#if selected}
		<div>
			<!-- Camera properties -->
			<h3 class="font-semibold">Camera</h3>
			<pre aria-label="Camera properties">{JSON.stringify(
					getProperties(selected).camera,
					null,
					2
				)}</pre>
			<!-- Lighting properties -->
			<h3 class="font-semibold">Lighting</h3>
			<pre aria-label="Lighting properties">{JSON.stringify(
					getProperties(selected).lighting,
					null,
					2
				)}</pre>
			<!-- FX properties -->
			<h3 class="font-semibold">FX</h3>
			<pre aria-label="FX properties">{JSON.stringify(getProperties(selected).fx, null, 2)}</pre>
			<!-- ControlNet properties -->
			<h3 class="font-semibold">ControlNet</h3>
			<pre aria-label="ControlNet properties">{JSON.stringify(
					getProperties(selected).controlnet,
					null,
					2
				)}</pre>
		</div>
	{:else}
		<!-- No element selected state -->
		<div class="text-gray-500" aria-label="No element selected">No element selected</div>
	{/if}
</div>
