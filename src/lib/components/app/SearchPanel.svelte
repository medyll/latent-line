<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { X, Search, Save, FolderOpen, Trash2, ChevronDown } from '@lucide/svelte';
	import { SearchIndex, type SearchResult } from '$lib/utils/search-index';
	import { applyFilters, loadFilterPresets, type FilterConfig } from '$lib/utils/search-filters';
	import type { Model, TimelineEvent } from '$lib/model/model-types';

	interface Props {
		open?: boolean;
		model?: Model;
		onClose?: () => void;
		onSelectResult?: (result: SearchResult) => void;
	}

	let {
		open = false,
		model,
		onClose,
		onSelectResult
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		select: SearchResult;
	}>();

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchIndex: SearchIndex | null = null;

	// Filter state
	let filters = $state<FilterConfig>({});
	let filterPresets = $state<Record<string, FilterConfig>>({});
	let showFilters = $state(false);

	// Debounce timer
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	// Initialize search index
	$effect(() => {
		if (model && open) {
			if (searchIndex) {
				searchIndex.update(model);
			} else {
				searchIndex = new SearchIndex(model);
			}
			performSearch(searchQuery);
		}
	});

	onMount(() => {
		filterPresets = loadFilterPresets();
		
		// Keyboard shortcut
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
				e.preventDefault();
				if (!open) {
					// Open search panel
				}
			}
			if (e.key === 'Escape' && open) {
				handleClose();
			}
		}

		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		if (searchTimer) clearTimeout(searchTimer);
		if (searchIndex) searchIndex.destroy();
		window.removeEventListener('keydown', handleKeyDown);
	});

	function performSearch(query: string) {
		if (searchTimer) clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			if (searchIndex && query.trim()) {
				searchResults = searchIndex.search(query);
			} else {
				searchResults = [];
			}
		}, 300);
	}

	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;
		performSearch(value);
	}

	function handleClose() {
		dispatch('close');
		onClose?.();
	}

	function handleSelect(result: SearchResult) {
		dispatch('select', result);
		onSelectResult?.(result);
		
		// Jump to event in timeline
		if (result.type === 'event') {
			// Emit custom event for timeline scroll
			window.dispatchEvent(new CustomEvent('timeline-scroll-to', {
				detail: { time: parseInt(result.id) }
			}));
		}
	}

	function applyPreset(name: string) {
		filters = filterPresets[name] ?? {};
		applyFiltersToResults();
	}

	function applyFiltersToResults() {
		if (!model) return;
		
		const filtered = applyFilters(model.timeline, filters);
		// Filter search results based on filtered events
		const filteredTimes = new Set(filtered.map(e => e.time));
		searchResults = searchResults.filter(r => 
			r.type !== 'event' || filteredTimes.has((r.data as TimelineEvent).time)
		);
	}

	function clearFilters() {
		filters = {};
		if (searchIndex && searchQuery) {
			searchResults = searchIndex.search(searchQuery);
		}
	}

	function getFilterCount(): number {
		return Object.keys(filters).filter(k => filters[k as keyof FilterConfig] !== undefined).length;
	}
</script>

{#if open}
	<div class="search-overlay" onclick={handleClose}>
		<div class="search-panel" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="search-header">
				<h3>Search</h3>
				<div class="header-actions">
					<button
						class="filter-toggle {getFilterCount() > 0 ? 'active' : ''}"
						onclick={() => (showFilters = !showFilters)}
						title="Toggle filters"
					>
						<ChevronDown size={18} />
						{#if getFilterCount() > 0}
							<span class="filter-badge">{getFilterCount()}</span>
						{/if}
					</button>
					<button class="close-btn" onclick={handleClose}>
						<X size={18} />
					</button>
				</div>
			</div>

			<!-- Search Input -->
			<div class="search-input-wrapper">
				<Search size={18} class="search-icon" />
				<input
					type="text"
					class="search-input"
					placeholder="Search events, characters, environments..."
					value={searchQuery}
					oninput={handleSearchInput}
					autofocus
				/>
			</div>

			<!-- Filters Panel -->
			{#if showFilters}
				<div class="filters-panel">
					<div class="filter-section">
						<h4>Presets</h4>
						<div class="preset-buttons">
							{#each Object.entries(filterPresets).slice(0, 8) as [name, filter]}
								<button
									class="preset-btn {filters === filter ? 'active' : ''}"
									onclick={() => applyPreset(name)}
								>
									{name}
								</button>
							{/each}
						</div>
					</div>

					<div class="filter-section">
						<h4>Asset Types</h4>
						<div class="filter-toggles">
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasPrompt ?? false}
									onchange={(e) => (filters.hasPrompt = e.target.checked ? true : undefined)}
								/>
								Has Prompt
							</label>
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasCharacter ?? false}
									onchange={(e) => (filters.hasCharacter = e.target.checked ? true : undefined)}
								/>
								Has Character
							</label>
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasCamera ?? false}
									onchange={(e) => (filters.hasCamera = e.target.checked ? true : undefined)}
								/>
								Has Camera
							</label>
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasLighting ?? false}
									onchange={(e) => (filters.hasLighting = e.target.checked ? true : undefined)}
								/>
								Has Lighting
							</label>
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasFX ?? false}
									onchange={(e) => (filters.hasFX = e.target.checked ? true : undefined)}
								/>
								Has FX
							</label>
							<label class="toggle-label">
								<input
									type="checkbox"
									checked={filters.hasAudio ?? false}
									onchange={(e) => (filters.hasAudio = e.target.checked ? true : undefined)}
								/>
								Has Audio
							</label>
						</div>
					</div>

					<button class="clear-filters" onclick={clearFilters}>
						Clear all filters
					</button>
				</div>
			{/if}

			<!-- Results -->
			<div class="search-results">
				{#if searchQuery && searchResults.length === 0}
					<div class="no-results">
						<Search size={32} />
						<p>No results found for "{searchQuery}"</p>
					</div>
				{:else}
					{#each searchResults.slice(0, 50) as result (result.id)}
						<div
							class="search-result {result.type}"
							onclick={() => handleSelect(result)}
						>
							<div class="result-type">{result.type}</div>
							<div class="result-content">
								<div class="result-id">{result.id}</div>
								{#if result.matches.length > 0}
									<div class="result-matches">
										{#each result.matches as match}
											<span class="match-snippet">...{match}...</span>
										{/each}
									</div>
								{/if}
							</div>
							<div class="result-score">Score: {result.score}</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.search-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: grid;
		place-items: center;
		animation: fadeIn 0.2s ease;
	}

	.search-panel {
		background: var(--color-surface);
		border-radius: 12px;
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}

	.search-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.search-header h3 {
		margin: 0;
		font-size: 16px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.filter-toggle {
		position: relative;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 6px;
		cursor: pointer;
		color: var(--color-text);
	}

	.filter-toggle.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.filter-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		background: var(--color-primary);
		color: white;
		font-size: 10px;
		padding: 2px 4px;
		border-radius: 4px;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		color: var(--color-text-muted);
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.search-icon {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 14px;
		color: var(--color-text);
	}

	.search-input:focus {
		outline: none;
	}

	.filters-panel {
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
		max-height: 300px;
		overflow-y: auto;
	}

	.filter-section {
		margin-bottom: 16px;
	}

	.filter-section h4 {
		font-size: 12px;
		color: var(--color-text-muted);
		margin: 0 0 8px;
		text-transform: uppercase;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.preset-btn {
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		cursor: pointer;
		color: var(--color-text);
	}

	.preset-btn.active {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.filter-toggles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		cursor: pointer;
	}

	.clear-filters {
		width: 100%;
		padding: 8px;
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		color: var(--color-text);
	}

	.search-results {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		color: var(--color-text-muted);
	}

	.search-result {
		display: flex;
		gap: 12px;
		padding: 12px;
		border-radius: 8px;
		cursor: pointer;
		margin-bottom: 8px;
		background: var(--color-surface-2);
		transition: background 0.2s;
	}

	.search-result:hover {
		background: var(--color-surface-3);
	}

	.result-type {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--color-text-muted);
		padding: 4px 8px;
		background: var(--color-surface);
		border-radius: 4px;
		height: fit-content;
	}

	.result-content {
		flex: 1;
		min-width: 0;
	}

	.result-id {
		font-weight: 600;
		font-size: 13px;
		margin-bottom: 4px;
	}

	.result-matches {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.match-snippet {
		font-size: 11px;
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-score {
		font-size: 11px;
		color: var(--color-text-muted);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
