<script lang="ts">
	import { getContext } from 'svelte';
	import { TEMPLATES_CONTEXT_KEY, MODEL_STORE_KEY } from '$lib/context/keys';
	import type { TemplatesStore } from '$lib/stores/templates.svelte';
	import type { Model } from '$lib/model/model-types';

	const { templates, deleteTemplate } = getContext<TemplatesStore>(TEMPLATES_CONTEXT_KEY);
	const model = getContext<Model>(MODEL_STORE_KEY);

	const DEFAULT_DURATION = 24;

	function applyTemplate(tplId: string) {
		const tpl = templates.find((t) => t.id === tplId);
		if (!tpl) return;
		const maxT = model.timeline.reduce((max, ev) => Math.max(max, ev.time), -1);
		const newTime = maxT + 10;
		model.timeline.push({
			time: newTime,
			duration: DEFAULT_DURATION,
			frame: structuredClone(tpl.frame)
		});
	}
</script>

<section class="sidebar-group">
	<div class="group-header">
		<h2 class="header-title">Templates</h2>
	</div>
	<div class="group-actions">
		{#if templates.length === 0}
			<div class="empty-state">
				<p>Aucun template</p>
				<small>Clic droit sur un event → "Sauvegarder comme template"</small>
			</div>
		{:else}
			<ul class="menu-list" role="list">
				{#each templates as tpl (tpl.id)}
					<li class="menu-item" data-testid={`template-${tpl.id}`}>
						<div class="item-info" style="flex:1;min-width:0;">
							<div class="info-main">{tpl.name}</div>
							<div class="info-light">{new Date(tpl.createdAt).toLocaleDateString()}</div>
						</div>
						<button
							onclick={() => applyTemplate(tpl.id)}
							title="Utiliser ce template"
							class="btn-icon"
							aria-label={`Apply template ${tpl.name}`}>＋</button
						>
						<button
							onclick={() => deleteTemplate(tpl.id)}
							title="Supprimer"
							class="btn-icon"
							aria-label={`Delete template ${tpl.name}`}>🗑</button
						>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
