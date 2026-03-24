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
	import { getContext, tick } from 'svelte';
	import type { Assets, Model } from '$lib/model/model-types';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY } from '$lib/context/keys';
	import { Trash2, Plus, Pencil, X, Check } from '@lucide/svelte';

	const assetStore = getContext<Assets>(ASSET_STORE_KEY);
	const model = getContext<Model>(MODEL_STORE_KEY);

	let selectedAssetId = $state<string | null>(null);

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

	// --- Search / filter ---
	let searchQuery = $state('');
	const q = $derived(searchQuery.trim().toLowerCase());

	const filteredCharacters = $derived(
		q ? assetStore.characters.filter((c) => c.name.toLowerCase().includes(q)) : assetStore.characters
	);
	const filteredEnvironments = $derived(
		q ? Object.fromEntries(Object.entries(assetStore.environments).filter(([, e]) => (e.prompt ?? '').toLowerCase().includes(q))) : assetStore.environments
	);
	const filteredAudio = $derived(
		q ? (assetStore.audio ?? []).filter((a) => (a.label ?? '').toLowerCase().includes(q) || (a.url ?? '').toLowerCase().includes(q)) : (assetStore.audio ?? [])
	);

	// --- Edit state ---
	let editingId = $state<string | null>(null);

	// Debugging aid: visible counts and last action to help E2E traces show store changes.
	let debugLastAction = $state('');

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
		debugLastAction = `select:${key}`;
		selectedAssetId = selectedAssetId === key ? null : key;
	}

	// --- Character mutations ---
	function removeCharacter(e: MouseEvent, id: string) {
		e.stopPropagation();
		debugLastAction = `remove:char:${id}`;
		assetStore.characters = assetStore.characters.filter((c) => c.id !== id);
		if (selectedAssetId === `char:${id}`) selectedAssetId = null;
		if (editingId === `char:${id}`) editingId = null;
	}

	async function addCharacter() {
		console.log(
			'[AssetManager] addCharacter called, before length:',
			assetStore.characters?.length ?? 0
		);
		debugLastAction = 'add:char:pending';
		const newId = `char_${Date.now()}`;
		// set editingId early so the inline input mounts in the next tick
		editingId = `char:${newId}`;
		assetStore.characters = [
			...assetStore.characters,
			{ id: newId, name: 'New Character', references: [], outfits: { default: { prompt: '' } } }
		];
		// Auto-select the new character
		selectedAssetId = `char:${newId}`;
		// wait a tick so the inline input mounts and bindings apply before tests assert
		await tick();
		// reaffirm editingId to ensure inline form remains visible across microtasks
		editingId = `char:${newId}`;
		// attempt to focus the new inline input after it's mounted
		await tick();
		try {
			const el = document.querySelector(
				`[data-testid="asset-char-${newId}"] input[aria-label="Character name"]`
			) as HTMLInputElement | null;
			if (el) {
				try {
					el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
				} catch {}
				el.focus();
				el.select();
				debugLastAction = `add:char:${newId}:focused`;
			} else {
				// fallback: schedule a rAF attempt
				requestAnimationFrame(() => {
					const el2 = document.querySelector(
						`[data-testid="asset-char-${newId}"] input[aria-label="Character name"]`
					) as HTMLInputElement | null;
					if (el2) {
						try {
							el2.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
						} catch {}
						el2.focus();
						el2.select();
						debugLastAction = `add:char:${newId}:focused:raf`;
					}
				});
			}
		} catch (err) {
			console.warn('[AssetManager] focus failed', err);
		}
		debugLastAction = `add:char:${newId}`;
		console.log(
			'[AssetManager] addCharacter done, after length:',
			assetStore.characters.length,
			'editingId=',
			editingId,
			'selectedAssetId=',
			selectedAssetId
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
		debugLastAction = `remove:env:${id}`;
		const { [id]: _, ...remaining } = assetStore.environments;
		assetStore.environments = remaining;
		if (selectedAssetId === `env:${id}`) selectedAssetId = null;
		if (editingId === `env:${id}`) editingId = null;
	}

	function addEnvironment() {
		console.log(
			'[AssetManager] addEnvironment called, before:',
			Object.keys(assetStore.environments).length
		);
		debugLastAction = 'add:env:pending';
		const newId = `env_${Date.now()}`;
		// mutate via full replacement to ensure reactivity
		assetStore.environments = {
			...(assetStore.environments ?? {}),
			[newId]: { prompt: 'New environment' }
		};
		editingId = `env:${newId}`;
		debugLastAction = `add:env:${newId}`;
		console.log(
			'[AssetManager] addEnvironment done, after:',
			Object.keys(assetStore.environments).length,
			'editingId=',
			editingId
		);
	}

	// --- Audio mutations ---
	function removeAudio(e: MouseEvent, id: string) {
		e.stopPropagation();
		debugLastAction = `remove:audio:${id}`;
		assetStore.audio = (assetStore.audio ?? []).filter((a) => a.id !== id);
		if (selectedAssetId === `audio:${id}`) selectedAssetId = null;
		if (editingId === `audio:${id}`) editingId = null;
	}

	function addAudio() {
		console.log('[AssetManager] addAudio called, before:', (assetStore.audio ?? []).length);
		debugLastAction = 'add:audio:pending';
		const newId = `audio_${Date.now()}`;
		assetStore.audio = [...(assetStore.audio ?? []), { id: newId, url: '', label: 'New Audio' }];
		editingId = `audio:${newId}`;
		debugLastAction = `add:audio:${newId}`;
		console.log(
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
<!-- <div
	class="flex flex-col gap-1 p-1 text-xs"
	aria-label="Asset Manager"
	style="background:var(--color-popover); color:var(--color-popover-foreground)"
>
</div> -->
<!-- E2E debug: visible store counts and last action -->
<div
	data-testid="am-debug-visible"
	aria-hidden="true"
	style="font-size:10px;line-height:1;opacity:0.9;color:var(--color-popover-foreground);"
>
	{JSON.stringify({
		chars: assetStore.characters?.length ?? 0,
		envs: Object.keys(assetStore.environments ?? {}).length,
		audio: assetStore.audio?.length ?? 0,
		last: debugLastAction
	})}
</div>
<!-- ── Search ── -->
<div class="sidebar-group" style="padding-bottom:0">
	<input
		type="search"
		placeholder="Search assets…"
		aria-label="Search assets"
		data-testid="asset-search"
		bind:value={searchQuery}
		class="w-full"
		style="font-size:0.8rem"
	/>
</div>

<!-- ── Characters ── -->
<section class="sidebar-group">
	<div class="group-header">
		<h2 class="header-title">Characters</h2>
		<div class="header-control">
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addCharacter}
				onpointerdown={() => (debugLastAction = 'pointerdown:add-char')}
				onpointerup={() => (debugLastAction = 'pointerup:add-char')}
				data-testid="add-character"
				title="Add character"
				aria-label="Add character"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>
	</div>
	<div class="group-actions">
		{#if !assetStore.characters.length}
			<div class="empty-state"><p>No characters</p><small>Add your first character to get started.</small></div>
		{:else}
			<ul role="listbox" aria-label="Characters" class="menu-list">
				{#each filteredCharacters as char (char.id)}
					{@const isOrphan = !usedCharIds.has(char.id)}
					{@const refCount = charRefCounts[char.id] ?? 0}
					{@const isEditing = editingId === `char:${char.id}`}
					<li
						role="option"
						class={`menu-item ${selectedAssetId === `char:${char.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
						data-testid={`asset-char-${char.id}`}
						onclick={() => selectAsset('char', char.id)}
						onkeydown={(e) => e.key === 'Enter' && selectAsset('char', char.id)}
						tabindex="0"
						aria-label={`Character ${char.name}`}
						aria-selected={selectedAssetId === `char:${char.id}`}
					>
						<span class="avatar-fallback">{char.name?.[0] ?? '?'}</span>
						<div class="item-info">
							<div class="info-light">{char.id}</div>
							<div class="info-main">{char.name}</div>
						</div>
						<div class="item-chip">
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
						</div>
						<button
							onclick={(e) => toggleEdit(e, `char:${char.id}`)}
							title="Edit character"
							aria-label={`Edit ${char.name}`}
							class="btn-icon"
						>
							{#if isEditing}<X  />{:else}<Pencil />{/if}
						</button>
						<button onclick={(e) => removeCharacter(e, char.id)} title={`Delete ${char.name}`} class="btn-icon" data-testid={`delete-char-${char.id}`}><Trash2 /></button>
						
						
						<!-- Inline edit form -->
						{#if isEditing}
							{@const idx = assetStore.characters.findIndex((c) => c.id === char.id)}
							<div class="col-span-full mt-1 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
								<!-- Name -->
								<div class="flex flex-col gap-0.5">
									<label>Name</label>
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
									<label>Voice ID</label>
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
									<div class="mb-1">Outfits</div>
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
</section>

<!-- ── Environments ── -->
<section class="sidebar-group">
	<div class="group-header">
		<h2 class="header-title">Environments</h2>
		<div class="header-control">
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addEnvironment}
				onpointerdown={() => (debugLastAction = 'pointerdown:add-env')}
				onpointerup={() => (debugLastAction = 'pointerup:add-env')}
				data-testid="add-environment"
				title="Add environment"
				aria-label="Add environment"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>
	</div>

	{#if !Object.keys(assetStore.environments).length}
		<div class="empty-state"><p>No environments</p><small>Add an environment to your story world.</small></div>
	{:else}
		<ul role="listbox" aria-label="Environments" class="menu-list">
			{#each Object.entries(filteredEnvironments) as [id, env] (id)}
				{@const isEditing = editingId === `env:${id}`}
				<li
					class="menu-item"
					data-testid={`asset-env-${id}`}
					onclick={() => selectAsset('env', id)}
					onkeydown={(e) => e.key === 'Enter' && selectAsset('env', id)}
					role="option"
					tabindex="0"
					aria-label={`Environment ${env.prompt}`}
					aria-selected={selectedAssetId === `env:${id}`}
				>
					<span class="avatar-fallback">A</span>
					<div class="item-info">
						<div class="info-light">{id}</div>
						<div class="info-main">{env.prompt}</div>
					</div>
					<button
						onclick={(e) => toggleEdit(e, `env:${id}`)}
						title="Edit environment"
						aria-label={`Edit ${id}`}
						class="rounded p-0.5 text-gray-400 hover:text-blue-600"
					>
						{#if isEditing}<X class="h-3 w-3" />{:else}<Pencil class="h-3 w-3" />{/if}
					</button>
					<button onclick={(e) => removeEnvironment(e, id)} title="Delete environment" class="btn-icon" data-testid={`delete-env-${id}`}><Trash2 class="h-3 w-3" /></button>

					<!-- Inline edit -->
					{#if isEditing}
						<div class="col-span-full mt-1 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
							<div class="flex flex-col gap-0.5">
								<label class="text-gray-400">Prompt</label>
								<textarea
									value={env.prompt}
									oninput={(e) =>
										(assetStore.environments[id].prompt = (e.target as HTMLTextAreaElement).value)}
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
</section>

<!-- ── Audio ── -->
<section class="sidebar-group">
	<div class="group-header">
		<span class="header-title">Audio</span>
		<div class="header-control">
			<button
				type="button"
				class="rounded p-1 text-gray-600 hover:text-blue-600"
				onclick={addAudio}
				onpointerdown={() => (debugLastAction = 'pointerdown:add-audio')}
				onpointerup={() => (debugLastAction = 'pointerup:add-audio')}
				data-testid="add-audio"
				title="Add audio"
				aria-label="Add audio"
			>
				<Plus class="h-3 w-3" />
			</button>
		</div>
	</div>

	{#if !assetStore.audio?.length}
		<div class="empty-state"><p>No audio assets</p><small>Add music or sound effects to your project.</small></div>
	{:else}
		<ul role="listbox" aria-label="Audio assets" class="menu-list">
			{#each filteredAudio as aud (aud.id)}
				{@const isOrphan = !usedAudioIds.has(aud.id)}
				{@const refCount = audioRefCounts[aud.id] ?? 0}
				{@const isEditing = editingId === `audio:${aud.id}`}
				{@const audIdx = assetStore.audio!.findIndex((a) => a.id === aud.id)}
				<li
					role="option"
					data-testid={`asset-audio-${aud.id}`}
					onclick={() => selectAsset('audio', aud.id)}
					onkeydown={(e) => e.key === 'Enter' && selectAsset('audio', aud.id)}
					tabindex="0"
					class={`menu-item  ${selectedAssetId === `audio:${aud.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
					aria-label={`Audio ${aud.label || aud.id}`}
					aria-selected={selectedAssetId === `audio:${aud.id}`}
				>
					<span class="avatar-fallback">A</span>
					<div class="item-info">
						<div class="info-light">{aud.id}</div>
						<div class="info-main">{aud.label || aud.id}</div>
					</div>
					<div class="item-chip">
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
					</div>
					<button
						onclick={(e) => toggleEdit(e, `audio:${aud.id}`)}
						title="Edit audio"
						aria-label={`Edit ${aud.id}`}
						class="rounded p-0.5 text-gray-400 hover:text-blue-600"
					>
						{#if isEditing}<X class="h-3 w-3" />{:else}<Pencil class="h-3 w-3" />{/if}
					</button>
					<button onclick={(e) => removeAudio(e, aud.id)} title="Delete audio" class="btn-icon" data-testid={`delete-audio-${aud.id}`}><Trash2 class="h-3 w-3" /></button>

					<!-- Inline edit -->
					{#if isEditing}
						<div class="col-span-full mt-1 flex flex-col gap-1.5 rounded bg-gray-50 p-2">
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
</section>
