<script lang="ts">
	import { getContext } from 'svelte';
	import { TEMPLATES_CONTEXT_KEY, MODEL_STORE_KEY } from '$lib/context/keys';
	import type { TemplatesStore } from '$lib/stores/templates.svelte';
	import type { Model, TimelineFrame } from '$lib/model/model-types';
	import { getMoodColor } from '$lib/model/mood-palette';

	const { templates, deleteTemplate } = getContext<TemplatesStore>(TEMPLATES_CONTEXT_KEY);
	const model = getContext<Model>(MODEL_STORE_KEY);

	const DEFAULT_DURATION = 24;

	// Built-in inspiration templates (shown when store is empty)
	const INSPIRATION: Array<{ id: string; name: string; frame: TimelineFrame }> = [
		{
			id: '__insp_1',
			name: 'Confrontation nocturne',
			frame: {
				prompt: 'Two figures facing each other under neon lights, tense atmosphere, cinematic',
				actors: [{ id: 'hero', action: 'stands firm', speech: { text: '', mood: 'anxious' } }],
				lighting: { type: 'studio' }
			}
		},
		{
			id: '__insp_2',
			name: 'Révélation douce',
			frame: {
				prompt: 'Close-up on a face with soft golden light, emotional reveal, film grain',
				actors: [{ id: 'hero', action: 'looks up', speech: { text: '', mood: 'serene' } }],
				lighting: { type: 'dusk' }
			}
		},
		{
			id: '__insp_3',
			name: 'Course haletante',
			frame: {
				prompt: 'Running through crowded streets, motion blur, urban chase, high energy',
				actors: [{ id: 'hero', action: 'runs', speech: { text: '', mood: 'anxious' } }],
				lighting: { type: 'daylight' }
			}
		}
	];

	const allTemplates = $derived(templates.length > 0 ? templates : INSPIRATION);

	function applyTemplate(tplId: string) {
		const tpl = allTemplates.find((t) => t.id === tplId);
		if (!tpl) return;
		const maxT = model.timeline.reduce((max, ev) => Math.max(max, ev.time), -1);
		const newTime = maxT >= 0 ? maxT + 10 : 0;
		model.timeline.push({
			time: newTime,
			duration: DEFAULT_DURATION,
			frame: structuredClone(tpl.frame)
		});
	}

	function getMood(frame: TimelineFrame): string | undefined {
		return frame.actors?.[0]?.speech?.mood;
	}

	function getDescription(frame: TimelineFrame): string {
		if (frame.prompt) return frame.prompt.length > 80 ? frame.prompt.slice(0, 78) + '…' : frame.prompt;
		if (frame.actors?.[0]?.action) return frame.actors[0].action;
		return '';
	}
</script>

<section class="sidebar-group">
	<div class="group-header">
		<h2 class="header-title">Templates</h2>
		{#if templates.length === 0}
			<span class="inspiration-tag">Inspiration</span>
		{/if}
	</div>
	<div class="templates-grid">
		{#each allTemplates as tpl (tpl.id)}
			{@const mood = getMood(tpl.frame)}
			{@const moodColor = getMoodColor(mood)}
			{@const desc = getDescription(tpl.frame)}
			<div
				class="tpl-card"
				data-testid={`template-${tpl.id}`}
				style={moodColor ? `border-top: 2px solid ${moodColor.border};` : ''}
			>
				<div class="tpl-card-header">
					{#if moodColor}
						<span class="tpl-mood-dot" style="background:{moodColor.border};" title={mood}></span>
					{/if}
					<span class="tpl-name">{tpl.name}</span>
				</div>
				{#if desc}
					<p class="tpl-desc">{desc}</p>
				{/if}
				<div class="tpl-actions">
					<button
						onclick={() => applyTemplate(tpl.id)}
						class="tpl-btn tpl-btn--apply"
						aria-label={`Utiliser ${tpl.name}`}
						title="Ajouter à la timeline"
					>＋ Utiliser</button>
					{#if !tpl.id.startsWith('__insp_')}
						<button
							onclick={() => deleteTemplate(tpl.id)}
							class="tpl-btn tpl-btn--delete"
							aria-label={`Supprimer ${tpl.name}`}
							title="Supprimer"
						>🗑</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.templates-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		padding: 4px 0;
	}

	.tpl-card {
		background: var(--color-surface-alt, var(--color-surface));
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		transition: border-color 0.15s;
	}

	.tpl-card:hover {
		border-color: oklch(0.65 0.25 280 / 0.4);
	}

	.tpl-card-header {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tpl-mood-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tpl-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text);
		line-height: 1.3;
	}

	.tpl-desc {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		margin: 0;
		font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
	}

	.tpl-actions {
		display: flex;
		gap: 4px;
		margin-top: auto;
	}

	.tpl-btn {
		flex: 1;
		padding: 3px 6px;
		font-size: 0.65rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s;
	}

	.tpl-btn:hover {
		background: var(--color-surface-hover, var(--color-surface-2));
		color: var(--color-text);
	}

	.tpl-btn--apply {
		border-color: oklch(0.65 0.25 280 / 0.3);
		color: oklch(0.75 0.2 280);
	}

	.tpl-btn--apply:hover {
		background: oklch(0.65 0.25 280 / 0.1);
	}

	.tpl-btn--delete {
		flex: 0;
		padding: 3px 6px;
	}

	.inspiration-tag {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: oklch(0.72 0.18 195);
		background: oklch(0.72 0.18 195 / 0.08);
		border: 1px solid oklch(0.72 0.18 195 / 0.2);
		padding: 1px 6px;
		border-radius: 20px;
	}
</style>
