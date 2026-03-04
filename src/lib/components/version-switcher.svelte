<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { versions, defaultVersion }: { versions: string[]; defaultVersion: string } = $props();

	let selectedVersion = $state(defaultVersion);
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<div class="flex flex-col gap-0.5 leading-none">
			<span class="font-semibold">latent-line</span>
			<span class="">v{selectedVersion}</span>
		</div>
	</Sidebar.MenuItem>
</Sidebar.Menu>
