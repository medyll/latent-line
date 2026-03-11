<script lang="ts">
	/**
	 * AssetManager.svelte
	 *
	 * @component AssetManager
	 * @description CRUD interface for global assets (characters, environments, audio).
	 *              - Inline editing for all asset types (AM-02/03/05/07).
	 *              - Orphan detection: badge on assets unused in the timeline (AM-08/09).
	 *              - Reference counts per character and audio asset.
	 * @example <AssetManager bind:selectedAssetId />
	 */
	import { getContext } from 'svelte';
	import type { Assets, Model } from '$lib/model/model-types';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY } from '$lib/context/keys';
	import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '$lib/components/ui/empty';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Trash2, Plus, Pencil, X, Check } from '@lucide/svelte';

	let { selectedAssetId = $bindable<string | null>(null) }: { selectedAssetId?: string | null } =
		$props();

	const assetStore = getContext<Assets>(ASSET_STORE_KEY);
	const model = getContext<Model>(MODEL_STORE_KEY);

	// --- Orphan detection ---
	const usedCharIds = $derived(
		new Set(model.timeline.flatMap((ev) => (ev.frame.actors ?? []).map((a) => a.id)))
	);

	const charRefCounts = $derived(
		model.timeline.reduce(
			(acc, ev) => {
				for (const actor of ev.frame.actors ?? []) {
					acc[actor.id] = (acc[actor.id] ?? 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		)
	);

	const usedAudioIds = $derived(
		new Set(model.timeline.flatMap((ev) => (ev.frame.audio_tracks ?? []).map((t) => t.id)))
	);

	const audioRefCounts = $derived(
		model.timeline.reduce(
			(acc, ev) => {
				for (const track of ev.frame.audio_tracks ?? []) {
					acc[track.id] = (acc[track.id] ?? 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		)
	);

	// --- Edit state ---
	let editingId = $state<string | null>(null);

	// Draft state for adding a new outfit
	let newOutfitKey = $state('');
	let newOutfitPrompt = $state('');

	function toggleEdit(e: MouseEvent, assetKey: string) {
		e.stopPropagation();
		editingId = editingId === assetKey ? null : assetKey;
		newOutfitKey = '';
		newOutfitPrompt = '';
	}

	// --- Selection ---
	function selectAsset(type: 'char' | 'env' | 'audio', id: string) {
		const key = `${type}:${id}`;
		console.debug('[AssetManager] selectAsset', key, 'prevSelected:', selectedAssetId);
		selectedAssetId = selectedAssetId === key ? null : key;
		console.debug('[AssetManager] selectedAssetId ->', selectedAssetId);
	}

	// --- Character mutations ---
	function removeCharacter(e: MouseEvent, id: string) {
		e.stopPropagation();
		assetStore.characters = assetStore.characters.filter((c) => c.id !== id);
		if (selectedAssetId === `char:${id}`) selectedAssetId = null;
		if (editingId === `char:${id}`) editingId = null;
	}

	function addCharacter() {
		console.debug(
			'[AssetManager] addCharacter called, before length:',
			assetStore.characters?.length ?? 0
		);
		const newId = `char_${Date.now()}`;
		assetStore.characters = [
			...assetStore.characters,
			{ id: newId, name: 'New Character', references: [], outfits: { default: { prompt: '' } } }
		];
		editingId = `char:${newId}`;
		console.debug(
			'[AssetManager] addCharacter done, after length:',
			assetStore.characters.length,
			'editingId=',
			editingId
		);
	}

	function addOutfit(charId: string) {
		const key = newOutfitKey.trim();
		const prompt = newOutfitPrompt.trim();
		if (!key) return;
		const idx = assetStore.characters.findIndex((c) => c.id === charId);
		if (idx === -1) return;
		assetStore.characters[idx].outfits = {
			...(assetStore.characters[idx].outfits ?? {}),
			[key]: { prompt }
		};
		newOutfitKey = '';
		newOutfitPrompt = '';
	}

	function removeOutfit(charId: string, outfitKey: string) {
		const idx = assetStore.characters.findIndex((c) => c.id === charId);
		if (idx === -1) return;
		const outfits = { ...(assetStore.characters[idx].outfits ?? {}) };
		delete outfits[outfitKey];
		assetStore.characters[idx].outfits = outfits;
	}

	// --- Environment mutations ---
	function removeEnvironment(e: MouseEvent, id: string) {
		e.stopPropagation();
		const { [id]: _, ...remaining } = assetStore.environments;
		assetStore.environments = remaining;
		if (selectedAssetId === `env:${id}`) selectedAssetId = null;
		if (editingId === `env:${id}`) editingId = null;
	}

	function addEnvironment() {
		console.debug(
			'[AssetManager] addEnvironment called, before:',
			Object.keys(assetStore.environments).length
		);
		const newId = `env_${Date.now()}`;
		assetStore.environments[newId] = { prompt: 'New environment' };
		editingId = `env:${newId}`;
		console.debug(
			'[AssetManager] addEnvironment done, after:',
			Object.keys(assetStore.environments).length,
			'editingId=',
			editingId
		);
	}

	// --- Audio mutations ---
	function removeAudio(e: MouseEvent, id: string) {
		e.stopPropagation();
		assetStore.audio = (assetStore.audio ?? []).filter((a) => a.id !== id);
		if (selectedAssetId === `audio:${id}`) selectedAssetId = null;
		if (editingId === `audio:${id}`) editingId = null;
	}

	function addAudio() {
		console.debug('[AssetManager] addAudio called, before:', (assetStore.audio ?? []).length);
		const newId = `audio_${Date.now()}`;
		assetStore.audio = [...(assetStore.audio ?? []), { id: newId, url: '', label: 'New Audio' }];
		editingId = `audio:${newId}`;
		console.debug(
			'[AssetManager] addAudio done, after:',
			assetStore.audio.length,
			'editingId=',
			editingId
		);
	}
</script>

<!--
  AssetManager Component
  Characters / Environments / Audio with inline editing and orphan badges.
-->
<div
	class="flex flex-col gap-1 p-1 text-xs"
	aria-label="Asset Manager"
	style="background:var(--color-popover); color:var(--color-popover-foreground)"
>
	<!-- ── Characters ── -->
	<div class="p-1">
		<div class="mb-1 flex items-center justify-between">
			<span class="font-semibold">Characters</span>
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addCharacter}
				data-testid="add-character"
				title="Add character"
				aria-label="Add character"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>

		{#if !assetStore.characters.length}
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No characters</EmptyTitle>
					<EmptyDescription>Add your first character to get started.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{:else}
			<ul role="listbox" aria-label="Characters" class="flex flex-col gap-0.5">
				{#each assetStore.characters as char (char.id)}
					{@const isOrphan = !usedCharIds.has(char.id)}
					{@const refCount = charRefCounts[char.id] ?? 0}
					{@const isEditing = editingId === `char:${char.id}`}
					<li class="flex flex-col rounded border border-transparent hover:border-gray-100">
						<!-- Row -->
						<div
							data-testid={`asset-char-${char.id}`}
							onclick={() => selectAsset('char', char.id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('char', char.id)}
							role="option"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 transition-colors ${selectedAssetId === `char:${char.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Character ${char.name}`}
							aria-selected={selectedAssetId === `char:${char.id}`}
						>
							<div class="flex min-w-0 items-center gap-2">
								<Avatar class="h-5 w-5 shrink-0 text-xs">
									<AvatarFallback>{char.name?.[0] ?? '?'}</AvatarFallback>
								</Avatar>
								<div class="min-w-0">
									<div class="font-mono text-muted-foreground">{char.id}</div>
									<div class="truncate">{char.name}</div>
								</div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								{#if isOrphan}
									<span
										class="rounded bg-orange-100 px-1 py-0.5 text-orange-600"
										title="Orphan — not used in timeline">○</span
									>
								{:else}
									<span
										class="rounded bg-green-100 px-1 py-0.5 text-green-700"
										title={`Used in ${refCount} frame(s)`}>{refCount}</span
									>
								{/if}
								<button
									onclick={(e) => toggleEdit(e, `char:${char.id}`)}
									title="Edit character"
									aria-label={`Edit ${char.name}`}
									class="rounded p-0.5 text-gray-400 hover:text-blue-600"
								>
									{#if isEditing}<X class="h-3 w-3" />{:else}<Pencil class="h-3 w-3" />{/if}
								</button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => removeCharacter(e, char.id)}
									title={`Delete ${char.name}`}
									class="h-5 w-5 p-0 text-red-400 hover:text-red-700"
									data-testid={`delete-char-${char.id}`}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>

						<!-- Inline edit form -->
						{#if isEditing}
							{@const idx = assetStore.characters.findIndex((c) => c.id === char.id)}
							<div class="mt-0.5 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
								<!-- Name -->
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">Name</label>
									<input
										type="text"
										value={assetStore.characters[idx].name}
										oninput={(e) =>
											(assetStore.characters[idx].name = (e.target as HTMLInputElement).value)}
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Character name"
									/>
								</div>
								<!-- Voice ID -->
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">Voice ID</label>
									<input
										type="text"
										value={assetStore.characters[idx].voice_id ?? ''}
										oninput={(e) =>
											(assetStore.characters[idx].voice_id =
												(e.target as HTMLInputElement).value || undefined)}
										placeholder="e.g. v_male_deep_01"
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Voice ID"
									/>
								</div>
								<!-- Outfits -->
								<div>
									<div class="mb-1 text-gray-400">Outfits</div>
									{#if assetStore.characters[idx].outfits && Object.keys(assetStore.characters[idx].outfits!).length}
										<ul class="mb-1 flex flex-col gap-0.5">
											{#each Object.entries(assetStore.characters[idx].outfits!) as [key, outfit]}
												<li
													class="flex items-center justify-between gap-1 rounded bg-white px-1.5 py-0.5"
												>
													<span class="font-mono text-blue-600">{key}</span>
													<span class="min-w-0 flex-1 truncate text-gray-500">{outfit.prompt}</span>
													<button
														onclick={() => removeOutfit(char.id, key)}
														title={`Remove outfit ${key}`}
														class="text-red-400 hover:text-red-600"
													>
														<X class="h-3 w-3" />
													</button>
												</li>
											{/each}
										</ul>
									{/if}
									<!-- Add outfit -->
									<div class="flex gap-1">
										<input
											type="text"
											bind:value={newOutfitKey}
											placeholder="name"
											class="w-20 rounded border border-gray-200 px-1 py-0.5 text-xs"
											aria-label="New outfit name"
										/>
										<input
											type="text"
											bind:value={newOutfitPrompt}
											placeholder="prompt"
											class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
											aria-label="New outfit prompt"
										/>
										<button
											onclick={() => addOutfit(char.id)}
											title="Add outfit"
											class="rounded bg-blue-50 px-1 text-blue-600 hover:bg-blue-100"
											data-testid={`add-outfit-${char.id}`}
										>
											<Plus class="h-3 w-3" />
										</button>
									</div>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- ── Environments ── -->
	<div class="p-1">
		<div class="mb-1 flex items-center justify-between">
			<span class="font-semibold">Environments</span>
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addEnvironment}
				data-testid="add-environment"
				title="Add environment"
				aria-label="Add environment"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>

		{#if !Object.keys(assetStore.environments).length}
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No environments</EmptyTitle>
					<EmptyDescription>Add an environment to your story world.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{:else}
			<ul role="listbox" aria-label="Environments" class="flex flex-col gap-0.5">
				{#each Object.entries(assetStore.environments) as [id, env] (id)}
					{@const isEditing = editingId === `env:${id}`}
					<li class="flex flex-col rounded border border-transparent hover:border-gray-100">
						<!-- Row -->
						<div
							data-testid={`asset-env-${id}`}
							onclick={() => selectAsset('env', id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('env', id)}
							role="option"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 transition-colors ${selectedAssetId === `env:${id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Environment ${env.prompt}`}
							aria-selected={selectedAssetId === `env:${id}`}
						>
							<div class="min-w-0">
								<div class="font-mono text-muted-foreground">{id}</div>
								<div class="truncate text-gray-600">{env.prompt}</div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<button
									onclick={(e) => toggleEdit(e, `env:${id}`)}
									title="Edit environment"
									aria-label={`Edit ${id}`}
									class="rounded p-0.5 text-gray-400 hover:text-blue-600"
								>
									{#if isEditing}<X class="h-3 w-3" />{:else}<Pencil class="h-3 w-3" />{/if}
								</button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => removeEnvironment(e, id)}
									title="Delete environment"
									class="h-5 w-5 p-0 text-red-400 hover:text-red-700"
									data-testid={`delete-env-${id}`}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>

						<!-- Inline edit -->
						{#if isEditing}
							<div class="mt-0.5 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">Prompt</label>
									<textarea
										value={env.prompt}
										oninput={(e) =>
											(assetStore.environments[id].prompt = (
												e.target as HTMLTextAreaElement
											).value)}
										rows={2}
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Environment prompt"
									></textarea>
								</div>
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">Reference image</label>
									<input
										type="text"
										value={env.ref ?? ''}
										oninput={(e) =>
											(assetStore.environments[id].ref =
												(e.target as HTMLInputElement).value || undefined)}
										placeholder="filename or URL"
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Environment reference image"
									/>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- ── Audio ── -->
	<div class="p-1">
		<div class="mb-1 flex items-center justify-between">
			<span class="font-semibold">Audio</span>
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addAudio}
				data-testid="add-audio"
				title="Add audio"
				aria-label="Add audio"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>

		{#if !assetStore.audio?.length}
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No audio assets</EmptyTitle>
					<EmptyDescription>Add music or sound effects to your project.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		{:else}
			<ul role="listbox" aria-label="Audio assets" class="flex flex-col gap-0.5">
				{#each assetStore.audio as aud (aud.id)}
					{@const isOrphan = !usedAudioIds.has(aud.id)}
					{@const refCount = audioRefCounts[aud.id] ?? 0}
					{@const isEditing = editingId === `audio:${aud.id}`}
					{@const audIdx = assetStore.audio!.findIndex((a) => a.id === aud.id)}
					<li class="flex flex-col rounded border border-transparent hover:border-gray-100">
						<!-- Row -->
						<div
							data-testid={`asset-audio-${aud.id}`}
							onclick={() => selectAsset('audio', aud.id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('audio', aud.id)}
							role="option"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 transition-colors ${selectedAssetId === `audio:${aud.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Audio ${aud.label || aud.id}`}
							aria-selected={selectedAssetId === `audio:${aud.id}`}
						>
							<div class="min-w-0">
								<div class="font-mono text-muted-foreground">{aud.id}</div>
								<div class="truncate">{aud.label || aud.id}</div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								{#if isOrphan}
									<span
										class="rounded bg-orange-100 px-1 py-0.5 text-orange-600"
										title="Orphan — not used in timeline">○</span
									>
								{:else}
									<span
										class="rounded bg-green-100 px-1 py-0.5 text-green-700"
										title={`Used in ${refCount} frame(s)`}>{refCount}</span
									>
								{/if}
								<button
									onclick={(e) => toggleEdit(e, `audio:${aud.id}`)}
									title="Edit audio"
									aria-label={`Edit ${aud.id}`}
									class="rounded p-0.5 text-gray-400 hover:text-blue-600"
								>
									{#if isEditing}<X class="h-3 w-3" />{:else}<Pencil class="h-3 w-3" />{/if}
								</button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => removeAudio(e, aud.id)}
									title="Delete audio"
									class="h-5 w-5 p-0 text-red-400 hover:text-red-700"
									data-testid={`delete-audio-${aud.id}`}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>

						<!-- Inline edit -->
						{#if isEditing}
							<div class="mt-0.5 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">Label</label>
									<input
										type="text"
										value={assetStore.audio![audIdx].label ?? ''}
										oninput={(e) =>
											(assetStore.audio![audIdx].label =
												(e.target as HTMLInputElement).value || undefined)}
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Audio label"
									/>
								</div>
								<div class="flex flex-col gap-0.5">
									<label class="text-gray-400">URL / file</label>
									<input
										type="text"
										value={assetStore.audio![audIdx].url}
										oninput={(e) =>
											(assetStore.audio![audIdx].url = (e.target as HTMLInputElement).value)}
										placeholder="https://... or filename.mp3"
										class="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
										aria-label="Audio URL"
									/>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
