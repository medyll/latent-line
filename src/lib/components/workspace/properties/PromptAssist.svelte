<script lang="ts">
	import { PROMPT_VOCABULARY, getCategories } from '$lib/data/prompt-vocabulary';

	let {
		onSelect,
		onClose,
		currentMood,
		previousScene
	}: {
		onSelect: (term: string) => void;
		onClose: () => void;
		currentMood?: string;
		previousScene?: string;
	} = $props();

	const categories = getCategories();
	let selectedCategory = $state(categories[0] ?? 'Movement');

	// Mood → priority categories mapping
	const MOOD_PRIORITY: Record<string, string[]> = {
		anxious: ['Movement', 'Emotion', 'Cinematic'],
		joyful: ['Movement', 'Emotion', 'Environment'],
		melancholic: ['Emotion', 'Cinematic', 'Environment'],
		serene: ['Environment', 'Emotion', 'Cinematic'],
		curious: ['Cinematic', 'Movement', 'Environment']
	};

	// Contextual suggestions: top terms from priority categories for this mood
	const contextualSuggestions = $derived(() => {
		if (!currentMood) return [];
		const priorities = MOOD_PRIORITY[currentMood] ?? [];
		const terms: string[] = [];
		for (const cat of priorities) {
			const vocab = PROMPT_VOCABULARY[cat] ?? [];
			terms.push(...vocab.slice(0, 4));
			if (terms.length >= 10) break;
		}
		return terms.slice(0, 10);
	});

	const hasContext = $derived(!!currentMood || !!previousScene);

	const currentSuggestions = $derived(PROMPT_VOCABULARY[selectedCategory] ?? []);
</script>

<div class="prompt-assist-panel">
	<div class="assist-header">
		<h4>Prompt Suggestions</h4>
		<button onclick={onClose} class="close-btn" aria-label="Close prompt assist" title="Close">
			✕
		</button>
	</div>

	{#if hasContext}
		<div class="context-section">
			{#if currentMood}
				<div class="context-label">
					<span class="context-dot"></span>
					Suggestions · <strong>{currentMood}</strong>
				</div>
			{/if}
			{#if previousScene}
				<div class="context-scene">↑ {previousScene}</div>
			{/if}
			{#if contextualSuggestions().length > 0}
				<div class="assist-suggestions context-suggestions">
					{#each contextualSuggestions() as term}
						<button
							class="suggestion-term suggestion-term--context"
							onclick={() => onSelect(term)}
							title={`Add "${term}"`}
						>
							{term}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

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
				onclick={() => onSelect(term)}
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
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		box-shadow: 0 4px 16px oklch(0 0 0 / 0.3);
		width: 280px;
		max-height: 420px;
		display: flex;
		flex-direction: column;
		z-index: 1000;
		font-size: 11px;
	}

	.assist-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 10px;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-alt, var(--color-surface));
		border-radius: 6px 6px 0 0;
	}

	.assist-header h4 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text);
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 14px;
		color: var(--color-text-muted);
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 3px;
	}

	.close-btn:hover {
		background: var(--color-surface-hover, var(--color-surface-2));
		color: var(--color-text);
	}

	/* Contextual section */
	.context-section {
		padding: 8px 10px;
		border-bottom: 1px solid var(--color-border);
		background: oklch(0.65 0.25 280 / 0.05);
	}

	.context-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 10px;
		color: var(--color-text-muted);
		margin-bottom: 6px;
	}

	.context-label strong {
		color: oklch(0.75 0.2 280);
	}

	.context-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: oklch(0.65 0.25 280);
		flex-shrink: 0;
	}

	.context-scene {
		font-size: 10px;
		color: var(--color-text-muted);
		font-style: italic;
		margin-bottom: 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.context-suggestions {
		flex-direction: row !important;
		flex-wrap: wrap;
		gap: 4px;
		overflow: visible;
		padding: 0;
	}

	.suggestion-term--context {
		background: oklch(0.65 0.25 280 / 0.08) !important;
		color: oklch(0.75 0.2 280) !important;
		border: 1px solid oklch(0.65 0.25 280 / 0.25) !important;
		border-radius: 20px !important;
		padding: 3px 8px !important;
	}

	.suggestion-term--context:hover {
		background: oklch(0.65 0.25 280 / 0.15) !important;
	}

	.assist-categories {
		display: flex;
		gap: 4px;
		padding: 6px;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-alt, var(--color-surface));
		flex-wrap: wrap;
	}

	.category-btn {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 4px 8px;
		font-size: 10px;
		cursor: pointer;
		color: var(--color-text-muted);
		transition: all 0.15s;
	}

	.category-btn:hover {
		background: var(--color-surface-hover, var(--color-surface-2));
		color: var(--color-text);
	}

	.category-btn.active {
		background: oklch(0.65 0.25 280);
		color: white;
		border-color: oklch(0.65 0.25 280);
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
		color: oklch(0.65 0.25 280);
		border-radius: 3px;
		font-size: 11px;
		transition: background 0.15s;
	}

	.suggestion-term:hover {
		background: oklch(0.65 0.25 280 / 0.08);
	}
</style>
