<script lang="ts">
	/**
	 * AssetManager.svelte
	 *
	 * @component AssetManager
	 * @description Provides CRUD interface for global assets (characters, environments, audio).
	 *              Handles ID validation and displays asset lists with empty states.
	 * @example <AssetManager />
	 */
	import type { Assets, Character } from '$lib/model/model-types';
	import exampleModel from '$lib/model/model-example';
	import {
		Empty,
		EmptyHeader,
		EmptyTitle,
		EmptyDescription,
		EmptyContent
	} from '$lib/components/ui/empty';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

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
</script>

<!--
  AssetManager Component
  Displays and manages global assets: Characters, Environments, Audio.
  Each section shows a list or an empty state if no assets exist.
-->
<div class="flex flex-col gap-1 p-1" aria-label="Asset Manager">
	<!-- Characters Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 text-xs font-semibold">Characters</div>
		<div>
			{#if !charactersWithAvatar?.length}
				<!-- Empty state for characters -->
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No characters</EmptyTitle>
						<EmptyDescription>Add your first character to get started.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<!-- List of characters -->
				<ul class="flex flex-col gap-0">
					{#each charactersWithAvatar as char (char.id)}
						<li class="flex items-center gap-2 text-xs" aria-label={`Character ${char.name}`}>
							<Avatar>
								{#if char.avatar}
									<AvatarImage src={char.avatar} alt={char.name} />
								{:else}
									<AvatarFallback>{char.name?.[0] ?? '?'}</AvatarFallback>
								{/if}
							</Avatar>
							<span class="font-mono text-muted-foreground">{char.id}</span>
							<span>{char.name}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Environments Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 text-xs font-semibold">Environments</div>
		<div>
			{#if !Object.keys(assetStore.environments).length}
				<!-- Empty state for environments -->
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No environments</EmptyTitle>
						<EmptyDescription>Add an environment to your story world.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<!-- List of environments -->
				<ul class="flex flex-col gap-0">
					{#each Object.entries(assetStore.environments) as [id, env] (id)}
						<li class="flex items-center gap-2 text-xs" aria-label={`Environment ${env.prompt}`}>
							<span class="font-mono text-muted-foreground">{id}</span>
							<span>{env.prompt}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Audio Section -->
	<div class="bg-transparent p-1">
		<div class="mb-1 text-xs font-semibold">Audio</div>
		<div>
			{#if !assetStore.audio?.length}
				<!-- Empty state for audio assets -->
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No audio assets</EmptyTitle>
						<EmptyDescription>Add music or sound effects to your project.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			{:else}
				<!-- List of audio assets -->
				<ul class="flex flex-col gap-0">
					{#each assetStore.audio as aud (aud.id)}
						<li class="flex items-center gap-2 text-xs" aria-label={`Audio ${aud.label || aud.id}`}>
							<span class="font-mono text-muted-foreground">{aud.id}</span>
							<span>{aud.label || aud.id}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
