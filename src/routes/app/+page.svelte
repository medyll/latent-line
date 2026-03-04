<script>
	import { Card } from '$lib/components/ui/card';
	/**
	 * AppPage.svelte
	 *
	 * @component AppPage
	 * @description Main app layout using shadcn-svelte primitives for structure and styling.
	 */

	import * as Resizable from '$lib/components/ui/resizable/index.js';

	// Mocked state for demo; replace with real data fetching logic as needed
	let loading = false;
	let error = '';
	let assets = [
		{ id: 'asset_1', name: 'Asset One', details: 'On testnet' },
		{ id: 'asset_2', name: 'Asset Two', details: 'On mainnet' }
	];
	let sequence = [
		{ time: '00:01', frame: { actors: [{ id: 'char_01' }] } },
		{ time: '00:02', frame: { actors: [{ id: 'char_02' }] } }
	];
	let selected = assets[0];
	let config = { checkpoint: 'v1.0', sampler: 'Euler' };
</script>

<!--
  AppPage Layout
  Uses shadcn-svelte Card for structure and consistent styling.
-->

<!--
  AppPage Layout with shadcn-svelte sidebar and leftbar using Resizable.Pane
-->
<Resizable.PaneGroup direction="horizontal" class="min-h-[100dvh] bg-white">
	<!-- Leftbar: Asset Manager -->
	<Resizable.Pane defaultSize={200} minSize={200} maxSize={200} class="h-full">
		<Card class="h-full border-r px-4 py-6 md:border-none md:px-2 md:py-2">
			{#if loading}
				<Card class="flex min-h-[200px] animate-pulse items-center justify-center bg-muted">
					<span class="text-gray-500">Loading assets…</span>
				</Card>
			{:else if error}
				<Card
					class="text-destructive-foreground flex min-h-[200px] items-center justify-center bg-destructive"
				>
					<span>{error}</span>
				</Card>
			{:else if assets.length === 0}
				<Card class="flex min-h-[200px] items-center justify-center bg-muted">
					<span class="text-gray-400">No assets found. Add your first asset!</span>
				</Card>
			{:else}
				<!-- Render asset list with micro-interactions -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each assets as asset, i}
						<Card
							class="ease-spring transition-all duration-300 hover:-translate-y-1 hover:scale-98"
							style="animation-delay: calc({i} * 80ms)"
						>
							<!-- <Avatar asset={asset} /> -->
							<div class="mt-2 font-semibold">{asset.name}</div>
						</Card>
					{/each}
				</div>
			{/if}
		</Card>
	</Resizable.Pane>

	<Resizable.Handle />
	<!-- Central Zone: Sequence Orchestrator -->
	<Resizable.Pane defaultSize={0} minSize={0} class="h-full flex-1">
		<Card class="h-full px-4 py-6 md:px-2 md:py-2">
			{#if loading}
				<Card class="flex min-h-[200px] animate-pulse items-center justify-center bg-muted">
					<span class="text-gray-500">Loading sequence…</span>
				</Card>
			{:else if error}
				<Card
					class="text-destructive-foreground flex min-h-[200px] items-center justify-center bg-destructive"
				>
					<span>{error}</span>
				</Card>
			{:else if sequence.length === 0}
				<Card class="flex min-h-[200px] items-center justify-center bg-muted">
					<span class="text-gray-400">No sequence events yet.</span>
				</Card>
			{:else}
				<!-- Render sequence with micro-interactions -->
				<div class="flex flex-col gap-4">
					{#each sequence as event, i}
						<Card
							class="ease-spring transition-all duration-300 hover:-translate-y-1 hover:scale-98"
							style="animation-delay: calc({i} * 80ms)"
						>
							<div class="font-mono text-xs text-gray-500">{event.time}</div>
							<div class="mt-2">{event.frame.actors?.map((a) => a.id).join(', ')}</div>
						</Card>
					{/each}
				</div>
			{/if}
			<!-- Timeline bottom placeholder -->
			<div>Timeline bottom</div>
		</Card>
	</Resizable.Pane>

	<Resizable.Handle />

	<!-- Sidebar: Properties Panel -->
	<Resizable.Pane defaultSize={320} minSize={200} maxSize={480} class="h-full">
		<Card class="h-full border-l px-4 py-6 md:border-none md:px-2 md:py-2">
			{#if loading}
				<Card class="flex min-h-[200px] animate-pulse items-center justify-center bg-muted">
					<span class="text-gray-500">Loading properties…</span>
				</Card>
			{:else if error}
				<Card
					class="text-destructive-foreground flex min-h-[200px] items-center justify-center bg-destructive"
				>
					<span>{error}</span>
				</Card>
			{:else if !selected}
				<Card class="flex min-h-[200px] items-center justify-center bg-muted">
					<span class="text-gray-400">No element selected.</span>
				</Card>
			{:else}
				<!-- Render properties with micro-interactions -->
				<div class="ease-spring transition-all duration-300 hover:-translate-y-1 hover:scale-98">
					<div class="font-semibold">{selected.name}</div>
					<div class="mt-2 text-sm text-gray-600">{selected.details}</div>
				</div>
			{/if}
		</Card>
	</Resizable.Pane>

	<!-- Footer: System Configuration -->
	<!-- Not resizable, placed outside PaneGroup -->
</Resizable.PaneGroup>

<Card class="w-full border-t px-4 py-3 md:px-2 md:py-2">
	{#if loading}
		<Card class="flex min-h-[80px] animate-pulse items-center justify-center bg-muted">
			<span class="text-gray-500">Loading system config…</span>
		</Card>
	{:else if error}
		<Card
			class="text-destructive-foreground flex min-h-[80px] items-center justify-center bg-destructive"
		>
			<span>{error}</span>
		</Card>
	{:else}
		<!-- Render system config with micro-interactions -->
		<div class="ease-spring transition-all duration-300 hover:-translate-y-1 hover:scale-98">
			<div class="font-mono text-xs text-gray-500">{config.checkpoint}</div>
			<div class="mt-2 text-sm text-gray-600">Sampler: {config.sampler}</div>
		</div>
	{/if}
</Card>
