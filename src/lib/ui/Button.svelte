<script lang="ts">
  export let type: 'button' | 'submit' = 'button'
  export let className = ''
</script>

<button type={type} class={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 ${className}`}>
  <slot />
</button>
