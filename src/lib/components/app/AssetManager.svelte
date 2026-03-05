<script lang="ts">
	/**
	 * AssetManager.svelte
	 *
	 * @component AssetManager
	 * @description Provides CRUD interface for global assets (characters, environments, audio).
	 *              Supports asset selection via $bindable selectedAssetId (format: "type:id").
	 * @example <AssetManager bind:selectedAssetId />
	 */
	import type { Assets, Character } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import {
		Empty,
		EmptyHeader,
		EmptyTitle,
		EmptyDescription
	} from '$lib/components/ui/empty';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Trash2, Plus } from '@lucide/svelte';

	let {
		selectedAssetId = $bindable<string | null>(null)
	}: { selectedAssetId?: string | null } = $props();

	/**
	 * Asset store state, cloned from example model assets to prevent mutations.
	 */
	const assetStore = $state<Assets>(structuredClone(exampleModel.assets));

	// Helper types for AssetManager
	interface CharacterAsset extends Character {
		avatar?: string;
	}

	// Convert characters to include avatar for display
	const charactersWithAvatar = $derived.by(() =>
		assetStore.characters.map((char) => ({
			...char,
			avatar: char.id === 'char_01' ? 'https://picsum.photos/seed/character1/40/40' : undefined
		}))
	);

	/**
	 * Toggles selection for an asset. Deselects if already selected.
	 */
	function selectAsset(type: 'char' | 'env' | 'audio', id: string) {
		const key = `${type}:${id}`;
		selectedAssetId = selectedAssetId === key ? null : key;
	}

	/**
	 * Removes a character from the asset store
	 */
	function removeCharacter(e: MouseEvent, id: string) {
		e.stopPropagation();
		assetStore.characters = assetStore.characters.filter((char) => char.id !== id);
		if (selectedAssetId === `char:${id}`) selectedAssetId = null;
	}

	/**
	 * Removes an environment from the asset store
	 */
	function removeEnvironment(e: MouseEvent, id: string) {
		e.stopPropagation();
		const { [id]: _, ...remaining } = assetStore.environments;
		assetStore.environments = remaining;
		if (selectedAssetId === `env:${id}`) selectedAssetId = null;
	}

	/**
	 * Removes an audio asset from the store
	 */
	function removeAudio(e: MouseEvent, id: string) {
		e.stopPropagation();
		assetStore.audio = (assetStore.audio || []).filter((aud) => aud.id !== id);
		if (selectedAssetId === `audio:${id}`) selectedAssetId = null;
	}

	/**
	 * Adds a new character with basic defaults
	 */
	function addCharacter() {
		const newId = `char_${assetStore.characters.length + 1}`;
		assetStore.characters = [
			...assetStore.characters,
			{
				id: newId,
				name: `New Character ${assetStore.characters.length + 1}`,
				references: [],
				outfits: {
					default: {
						prompt: 'default outfit'
					}
				}
			}
		];
	}

	/**
	 * Adds a new environment with basic defaults
	 */
	function addEnvironment() {
		const newId = `env_${Object.keys(assetStore.environments).length + 1}`;
		assetStore.environments[newId] = {
			prompt: `New environment ${Object.keys(assetStore.environments).length + 1}`
		};
	}

	/**
	 * Adds a new audio asset with basic defaults
	 */
	function addAudio() {
		const newId = `audio_${(assetStore.audio || []).length + 1}`;
		assetStore.audio = [
			...(assetStore.audio || []),
			{
				id: newId,
				url: '',
				label: `New Audio ${(assetStore.audio || []).length + 1}`
			}
		];
	}
</script>

<!--
  AssetManager Component
  Displays and manages global assets: Characters, Environments, Audio.
  Each row is selectable; selectedAssetId is bindable for parent integration.
-->
<div class="flex flex-col gap-1 p-1" aria-label="Asset Manager">
	<!-- Characters Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 flex items-center justify-between">
			<div class="text-xs font-semibold">Characters</div>
			<Button variant="ghost" size="sm" onclick={addCharacter} title="Add character">
				<Plus class="h-3 w-3" />
			</Button>
		</div>
		<div>
			{#if !charactersWithAvatar?.length}
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No characters</EmptyTitle>
						<EmptyDescription>Add your first character to get started.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<ul class="flex flex-col gap-0">
					{#each charactersWithAvatar as char (char.id)}
						<li
							onclick={() => selectAsset('char', char.id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('char', char.id)}
							role="button"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-xs transition-colors ${selectedAssetId === `char:${char.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Character ${char.name}`}
							aria-selected={selectedAssetId === `char:${char.id}`}
						>
							<div class="flex items-center gap-2">
								<Avatar>
									{#if char.avatar}
										<AvatarImage src={char.avatar} alt={char.name} />
									{:else}
										<AvatarFallback>{char.name?.[0] ?? '?'}</AvatarFallback>
									{/if}
								</Avatar>
								<div>
									<div class="font-mono text-muted-foreground">{char.id}</div>
									<div>{char.name}</div>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={(e) => removeCharacter(e, char.id)}
								title={`Delete ${char.name}`}
								class="text-red-500 hover:text-red-700"
							>
								<Trash2 class="h-3 w-3" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Environments Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 flex items-center justify-between">
			<div class="text-xs font-semibold">Environments</div>
			<Button variant="ghost" size="sm" onclick={addEnvironment} title="Add environment">
				<Plus class="h-3 w-3" />
			</Button>
		</div>
		<div>
			{#if !Object.keys(assetStore.environments).length}
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No environments</EmptyTitle>
						<EmptyDescription>Add an environment to your story world.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<ul class="flex flex-col gap-0">
					{#each Object.entries(assetStore.environments) as [id, env] (id)}
						<li
							onclick={() => selectAsset('env', id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('env', id)}
							role="button"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-xs transition-colors ${selectedAssetId === `env:${id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Environment ${env.prompt}`}
							aria-selected={selectedAssetId === `env:${id}`}
						>
							<div>
								<div class="font-mono text-muted-foreground">{id}</div>
								<div>{env.prompt}</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={(e) => removeEnvironment(e, id)}
								title="Delete environment"
								class="text-red-500 hover:text-red-700"
							>
								<Trash2 class="h-3 w-3" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Audio Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 flex items-center justify-between">
			<div class="text-xs font-semibold">Audio</div>
			<Button variant="ghost" size="sm" onclick={addAudio} title="Add audio">
				<Plus class="h-3 w-3" />
			</Button>
		</div>
		<div>
			{#if !assetStore.audio?.length}
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No audio assets</EmptyTitle>
						<EmptyDescription>Add music or sound effects to your project.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<ul class="flex flex-col gap-0">
					{#each assetStore.audio as aud (aud.id)}
						<li
							onclick={() => selectAsset('audio', aud.id)}
							onkeydown={(e) => e.key === 'Enter' && selectAsset('audio', aud.id)}
							role="button"
							tabindex="0"
							class={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-xs transition-colors ${selectedAssetId === `audio:${aud.id}` ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}
							aria-label={`Audio ${aud.label || aud.id}`}
							aria-selected={selectedAssetId === `audio:${aud.id}`}
						>
							<div>
								<div class="font-mono text-muted-foreground">{aud.id}</div>
								<div>{aud.label || aud.id}</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={(e) => removeAudio(e, aud.id)}
								title="Delete audio"
								class="text-red-500 hover:text-red-700"
							>
								<Trash2 class="h-3 w-3" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
