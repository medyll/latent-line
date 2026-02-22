<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Slider } from "$lib/components/ui/slider/index.js";
  let zoom = $state(100);
  let timelineItems = [
    { id: 1, label: "Clip 1", start: 0, end: 10 },
    { id: 2, label: "Clip 2", start: 12, end: 22 },
    { id: 3, label: "Clip 3", start: 25, end: 40 }
  ];
</script>

<Resizable.PaneGroup direction="vertical" class="h-[400px] w-full rounded-lg border">
  <Resizable.Pane defaultSize={80}>
    <div class="flex flex-col h-full">
      <div class="flex items-center gap-4 p-2 border-b">
        <span class="font-semibold">Zoom</span>
        <Slider type="single" bind:value={zoom} min={10} max={400} step={1} class="w-[200px]" />
        <span>{zoom}%</span>
      </div>
      <ScrollArea orientation="horizontal" class="flex-1 w-full">
        <div class="relative h-[120px] min-w-[800px] flex items-center">
          {#each timelineItems as item (item.id)}
            <div
              class="absolute top-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center shadow-md cursor-pointer"
              style="left:calc({item.start * zoom}px); width:calc(({item.end - item.start} * zoom)px);"
            >
              {item.label}
            </div>
          {/each}
        </div>
      </ScrollArea>
    </div>
  </Resizable.Pane>
  <Resizable.Handle />
  <Resizable.Pane defaultSize={20}>
    <div class="flex items-center justify-center h-full text-muted-foreground">
      <span>Timeline controls or details here</span>
    </div>
  </Resizable.Pane>
</Resizable.PaneGroup>
