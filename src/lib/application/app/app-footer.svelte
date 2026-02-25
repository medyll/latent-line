<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
    import { cn, type WithElementRef } from "$lib/utils.js";
    let {  ref = $bindable(null),class: className,children,...restProps }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
   
</script>
<div 
    bind:this={ref} 
    data-slot="app-footer" 
    data-app="footer"
    class={cn("footer", className)} {...restProps}>   
    {@render children?.()}
</div>