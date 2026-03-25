<script lang="ts">
	/**
	 * PromptAssist.svelte
	 *
	 * @component PromptAssist
	 * @description Contextual prompt suggestion panel for AI rendering.
	 *              Displays vocabulary terms organized by category.
	 *              User clicks a term to append it to the action field.
	 * @example <PromptAssist {onSelect} {onClose} />
	 */
	import { PROMPT_VOCABULARY, getCategories } from '$lib/data/prompt-vocabulary';

	let { onSelect, onClose }: { onSelect: (term: string) => void; onClose: () => void } =
		$props();

	const categories = getCategories();
	let selectedCategory = $state(categories[0] ?? 'Movement');

	const currentSuggestions = $derived(PROMPT_VOCABULARY[selectedCategory] ?? []);
</script>

<div class="prompt-assist-panel">
	<div class="assist-header">
		<h4>Prompt Suggestions</h4>
		<button
			onclick={onClose}
			class="close-btn"
			aria-label="Close prompt assist"
			title="Close"
		>
			✕
		</button>
	</div>

	<div class="assist-categories">
		{#each categories as cat}
			<button
				class="category-btn"
				class:active={selectedCategory === cat}
				onclick={() => (selectedCategory = cat)}
				aria-pressed={selectedCategory === cat}
			>
				{cat}
			</button>
		{/each}
	</div>

	<div class="assist-suggestions">
		{#each currentSuggestions as term}
			<button
				class="suggestion-term"
				onclick={() => {
					onSelect(term);
				}}
				title={`Add "${term}" to action`}
			>
				{term}
			</button>
		{/each}
	</div>
</div>

<style>
	.prompt-assist-panel {
		position: absolute;
		right: 0;
		top: 0;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		width: 280px;
		max-height: 400px;
		display: flex;
		flex-direction: column;
		z-index: 1000;
		font-size: 11px;
	}

	.assist-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px;
		border-bottom: 1px solid #eee;
		background: #f9f9f9;
	}

	.assist-header h4 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 16px;
		color: #666;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 2px;
	}

	.close-btn:hover {
		background: #eee;
		color: #000;
	}

	.assist-categories {
		display: flex;
		gap: 4px;
		padding: 6px;
		border-bottom: 1px solid #eee;
		background: #fafafa;
		flex-wrap: wrap;
	}

	.category-btn {
		background: white;
		border: 1px solid #ddd;
		border-radius: 3px;
		padding: 4px 8px;
		font-size: 10px;
		cursor: pointer;
		color: #666;
		transition: all 0.2s;
	}

	.category-btn:hover {
		background: #f0f0f0;
		color: #333;
	}

	.category-btn.active {
		background: #0066cc;
		color: white;
		border-color: #0066cc;
	}

	.assist-suggestions {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow-y: auto;
		padding: 6px;
		flex: 1;
	}

	.suggestion-term {
		background: none;
		border: none;
		padding: 4px 6px;
		text-align: left;
		cursor: pointer;
		color: #0066cc;
		border-radius: 2px;
		font-size: 11px;
		transition: background 0.15s;
	}

	.suggestion-term:hover {
		background: #e6f0ff;
	}

	.suggestion-term:active {
		background: #cce0ff;
	}
</style>
