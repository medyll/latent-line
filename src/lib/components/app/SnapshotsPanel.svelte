<script lang="ts">
	import { getContext } from 'svelte';
	import type { Model } from '$lib/model/model-types';
	import { MODEL_STORE_KEY, HISTORY_STORE_KEY } from '$lib/context/keys';
	import {
		listSnapshots,
		saveSnapshot,
		deleteSnapshot,
		restoreSnapshot
	} from '$lib/utils/snapshots';
	import { deserializeModel } from '$lib/utils/export-import';

	const model = getContext<Model>(MODEL_STORE_KEY);
	const history = getContext<any>(HISTORY_STORE_KEY);

	let snapshots = $state(listSnapshots());
	let newName: string = $state('');
	let message: string = $state('');

	function refresh() {
		snapshots = listSnapshots();
	}

	function create() {
		message = '';
		const res = saveSnapshot(model, newName || undefined);
		if (!res.success) {
			message = res.errors.join('; ');
			return;
		}
		newName = '';
		refresh();
		message = 'Snapshot saved';
		setTimeout(() => (message = ''), 2000);
	}

	function remove(id: string) {
		if (!confirm('Delete snapshot?')) return;
		const ok = deleteSnapshot(id);
		if (!ok) {
			message = 'Failed to delete';
			return;
		}
		refresh();
	}

	function apply(id: string) {
		const res = restoreSnapshot(id);
		if (!res.success) {
			message = res.errors.join('; ');
			return;
		}
		// push current to history for undo
		history?.push(JSON.parse(JSON.stringify(model)));
		const imported = res.model;
		Object.assign(model.project, imported.project);
		model.assets.characters = imported.assets.characters;
		model.assets.environments = imported.assets.environments;
		model.assets.audio = imported.assets.audio;
		model.timeline.length = 0;
		model.timeline.push(...imported.timeline);
		model.config = imported.config;
		message = 'Snapshot applied';
		setTimeout(() => (message = ''), 2000);
	}
</script>

<div class="snapshots-panel p-3" aria-label="Snapshots">
	<div class="mb-2 flex items-center gap-2">
		<input
			placeholder="Snapshot name"
			bind:value={newName}
			class="flex-1 rounded border px-2 py-1 text-xs"
		/>
		<button onclick={create} class="text-xs">Save</button>
		<button onclick={refresh} class="text-xs">Refresh</button>
	</div>
	{#if message}
		<div class="mb-2 text-xs text-gray-600">{message}</div>
	{/if}
	{#if snapshots.length === 0}
		<div class="text-xs text-gray-500">No snapshots yet.</div>
	{:else}
		<ul class="text-xs">
			{#each snapshots as s}
				<li class="mb-2 border rounded p-2 flex items-center justify-between">
					<div>
						<div class="font-semibold">{s.name}</div>
						<div class="text-gray-500">{new Date(s.timestamp).toLocaleString()}</div>
					</div>
					<div class="flex items-center gap-2">
						<button onclick={() => apply(s.id)} class="text-xs">Restore</button>
						<button
							onclick={() =>
								navigator.clipboard?.writeText(window.location.href + '?snap=' + s.id) ||
								alert(window.location.href + '?snap=' + s.id)}
							class="text-xs">Copy Link</button
						>
						<button onclick={() => remove(s.id)} class="text-xs text-red-600">Delete</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.snapshots-panel input {
		min-width: 0;
	}
</style>
