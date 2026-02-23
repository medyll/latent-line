

<script lang="ts">
/**
 * AssetManager.svelte
 *
 * @component AssetManager
 * @description Provides CRUD interface for global assets (characters, environments, audio).
 *              Handles ID validation and displays asset lists with empty states.
 * @example <AssetManager />
 */
import exampleModel from '$lib/model/model-example';
import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '$lib/components/ui/empty';
import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

/**
 * Asset store state, derived from example model assets.
 * @type {import('$lib/model/model-types').Assets}
 */
const assetStore = $state(exampleModel.assets);
</script>

<!--
  AssetManager Component
  Displays and manages global assets: Characters, Environments, Audio.
  Each section shows a list or an empty state if no assets exist.
-->
<div class="flex flex-col gap-6" aria-label="Asset Manager">
  <h2 class="font-bold text-lg">Assets</h2>

  <!-- Characters Section -->
  <Card>
    <CardHeader>
      <CardTitle>Characters</CardTitle>
    </CardHeader>
    <CardContent>
      {#if !assetStore.characters?.length}
        <!-- Empty state for characters -->
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No characters</EmptyTitle>
            <EmptyDescription>Add your first character to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      {:else}
        <!-- List of characters -->
        <ul class="flex flex-col gap-2">
          {#each assetStore.characters as char (char.id)}
            <li class="flex items-center gap-3" aria-label={`Character ${char.name}`}>
              <Avatar>
                {#if char.avatar}
                  <AvatarImage src={char.avatar} alt={char.name} />
                {:else}
                  <AvatarFallback>{char.name?.[0] ?? '?'}</AvatarFallback>
                {/if}
              </Avatar>
              <span class="font-mono text-xs text-muted-foreground">{char.id}</span>
              <span>{char.name}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </CardContent>
  </Card>

  <!-- Environments Section -->
  <Card>
    <CardHeader>
      <CardTitle>Environments</CardTitle>
    </CardHeader>
    <CardContent>
      {#if !assetStore.environments?.length}
        <!-- Empty state for environments -->
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No environments</EmptyTitle>
            <EmptyDescription>Add an environment to your story world.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      {:else}
        <!-- List of environments -->
        <ul class="flex flex-col gap-2">
          {#each assetStore.environments as env (env.id)}
            <li class="flex items-center gap-3" aria-label={`Environment ${env.name}`}>
              <span class="font-mono text-xs text-muted-foreground">{env.id}</span>
              <span>{env.name}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </CardContent>
  </Card>

  <!-- Audio Section -->
  <Card>
    <CardHeader>
      <CardTitle>Audio</CardTitle>
    </CardHeader>
    <CardContent>
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
        <ul class="flex flex-col gap-2">
          {#each assetStore.audio as aud (aud.id)}
            <li class="flex items-center gap-3" aria-label={`Audio ${aud.name}`}>
              <span class="font-mono text-xs text-muted-foreground">{aud.id}</span>
              <span>{aud.name}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </CardContent>
  </Card>
</div>