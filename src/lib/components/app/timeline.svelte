
<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "$lib/components/ui/empty";

  // Demo asset list for sidebar
  let assets = [
    { id: 'asset_1', name: 'Asset One', details: 'On testnet' },
    { id: 'asset_2', name: 'Asset Two', details: 'On mainnet' }
  ];
  let selected = $state(assets[0]);

  let zoom = $state(100);
  let timelineItems = [
    { id: 1, label: "Clip 1", start: 0, end: 10 },
    { id: 2, label: "Clip 2", start: 12, end: 22 },
    { id: 3, label: "Clip 3", start: 25, end: 40 }
  ];
</script>


<!-- Timeline with sidebar layout -->
<div class="flex flex-row h-full w-full">
  <!-- Sidebar -->
  <aside class="bg-zinc-50 border-r border-zinc-200 h-full min-h-0 flex flex-col w-[220px] md:w-64 px-4 py-6">
    <div class="font-bold text-lg mb-4">Assets</div>
    <nav class="flex-1 flex flex-col gap-2">
      {#each assets as asset}
        <button type="button" onclick={() => selected = asset} class="w-full text-left mb-2 focus:outline-none focus:ring-2 focus:ring-accent rounded">
          <Card class="px-2 py-2 {selected && selected.id === asset.id ? 'bg-accent' : ''}">
            <div class="font-semibold">{asset.name}</div>
            <div class="text-xs text-gray-500">{asset.details}</div>
          </Card>
        </button>
      {/each}
    </nav>
  </aside>

  <!-- Main timeline area -->
  <div class="flex-1 flex flex-col p-6">
    <Resizable.PaneGroup direction="vertical" class="h-[400px] w-full rounded-lg border">
      <Resizable.Pane defaultSize={80}>
        <Card class="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col flex-1 p-0">
            <div class="flex items-center gap-4 p-2 border-b">
              <!-- Zoom slider -->
              <Label for="zoom-slider">Zoom</Label>
              <Slider id="zoom-slider" type="single" bind:value={zoom} min={10} max={400} step={1} class="w-[200px]" />
              <span>{zoom}%</span>
            </div>
            <ScrollArea orientation="horizontal" class="flex-1 w-full">
              <div class="relative h-[120px] min-w-[800px] flex items-center">
                {#if timelineItems.length === 0}
                  <!-- Empty state for timeline -->
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No timeline items</EmptyTitle>
                      <EmptyDescription>Add clips to the timeline.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                {:else}
                  <!-- Timeline clips -->
                  {#each timelineItems as item (item.id)}
                    <div
                      class="absolute top-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center shadow-md cursor-pointer"
                      style="left:calc({item.start * zoom}px); width:calc(({item.end - item.start} * zoom)px);"
                    >
                      {item.label}
                    </div>
                  {/each}
                {/if}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </Resizable.Pane>
      <Resizable.Handle />
      <Resizable.Pane defaultSize={20}>
        <Card class="h-full flex items-center justify-center">
          <CardContent class="text-muted-foreground flex items-center justify-center h-full">
            <!-- Timeline controls or details placeholder -->
            <span>Timeline controls or details here</span>
          </CardContent>
        </Card>
      </Resizable.Pane>
    </Resizable.PaneGroup>
  </div>
</div>
