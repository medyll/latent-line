<script lang="ts">
	import type { Model } from '$lib/model/model-types';
	import { getMoodColor } from '$lib/model/mood-palette';

	let { model, onComplete }: { model: Model; onComplete?: () => void } = $props();

	const MOODS = ['joyful', 'melancholic', 'anxious', 'serene', 'curious'] as const;

	let step = $state(1);
	let projectName = $state('');
	let selectedMood = $state<string | undefined>();
	let characterName = $state('');
	let firstPrompt = $state('');

	function goNext() {
		if (step === 1 && projectName.trim()) {
			if (projectName.trim()) model.project.name = projectName.trim();
			step = 2;
		} else if (step === 2) {
			if (characterName.trim()) {
				model.assets.characters.push({
					id: `char_${Date.now()}`,
					name: characterName.trim(),
					references: []
				});
			}
			step = 3;
		} else if (step === 3) {
			if (firstPrompt.trim()) {
				model.timeline.push({
					time: 0,
					duration: 24,
					frame: {
						prompt: firstPrompt.trim(),
						actors: selectedMood
							? [{ id: model.assets.characters[0]?.id ?? 'hero', speech: { text: '', mood: selectedMood as any } }]
							: []
					}
				});
			}
			onComplete?.();
		}
	}

	function skip() {
		onComplete?.();
	}

	const canProceed = $derived(
		step === 1 ? !!projectName.trim() : step === 2 ? true : !!firstPrompt.trim()
	);
</script>

<div class="onboarding-backdrop">
	<div class="onboarding-card">
		<!-- Stepper -->
		<div class="steps">
			{#each [1, 2, 3] as s}
				<div class="step-dot {step === s ? 'active' : ''} {step > s ? 'done' : ''}">
					{step > s ? '✓' : s}
				</div>
				{#if s < 3}
					<div class="step-line {step > s ? 'done' : ''}"></div>
				{/if}
			{/each}
		</div>

		{#if step === 1}
			<div class="step-content">
				<h2 class="step-title">Ton film commence ici</h2>
				<p class="step-sub">Donne un nom à ton projet et choisis l'ambiance principale.</p>
				<div class="field">
					<label for="proj-name" class="field-label">Titre du projet</label>
					<input
						id="proj-name"
						type="text"
						class="field-input"
						placeholder="Ex: La Fugue, Nuit Blanche…"
						bind:value={projectName}
						onkeydown={(e) => e.key === 'Enter' && canProceed && goNext()}
					/>
				</div>
				<div class="field">
					<span class="field-label">Ambiance générale</span>
					<div class="mood-grid">
						{#each MOODS as mood}
							{@const mc = getMoodColor(mood)}
							<button
								class="mood-btn {selectedMood === mood ? 'selected' : ''}"
								style={mc ? `--mood-border: ${mc.border}; --mood-bg: ${mc.bg};` : ''}
								onclick={() => (selectedMood = selectedMood === mood ? undefined : mood)}
							>
								{mood}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{:else if step === 2}
			<div class="step-content">
				<h2 class="step-title">Qui joue dans ton film ?</h2>
				<p class="step-sub">Crée ton premier personnage. Tu pourras en ajouter d'autres ensuite.</p>
				<div class="field">
					<label for="char-name" class="field-label">Nom du personnage</label>
					<input
						id="char-name"
						type="text"
						class="field-input"
						placeholder="Ex: Léa, Marcus, L'Inconnu…"
						bind:value={characterName}
						onkeydown={(e) => e.key === 'Enter' && goNext()}
					/>
				</div>
				<p class="step-hint">Optionnel — tu peux passer cette étape.</p>
			</div>
		{:else}
			<div class="step-content">
				<h2 class="step-title">Décris ta première scène</h2>
				<p class="step-sub">Un prompt suffit pour commencer. L'AI fera le reste.</p>
				<div class="field">
					<label for="first-prompt" class="field-label">Prompt de la scène</label>
					<textarea
						id="first-prompt"
						class="field-input field-textarea"
						placeholder="Ex: A woman running through a dark alley at night, cinematic, film grain…"
						rows="3"
						bind:value={firstPrompt}
					></textarea>
				</div>
			</div>
		{/if}

		<div class="onboarding-actions">
			<button class="btn-skip" onclick={skip}>Passer</button>
			<button class="btn-next" disabled={!canProceed} onclick={goNext}>
				{step < 3 ? 'Suivant →' : '🎬 Créer le projet'}
			</button>
		</div>
	</div>
</div>

<style>
	.onboarding-backdrop {
		position: fixed;
		inset: 0;
		background: oklch(0 0 0 / 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.onboarding-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		padding: 36px 40px;
		width: min(480px, 90vw);
		display: flex;
		flex-direction: column;
		gap: 28px;
		box-shadow: 0 0 0 1px oklch(0.65 0.25 280 / 0.2), 0 24px 48px oklch(0 0 0 / 0.4);
	}

	/* Stepper */
	.steps {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.step-dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 700;
		background: var(--color-surface-alt, var(--color-surface));
		border: 2px solid var(--color-border);
		color: var(--color-text-muted);
		flex-shrink: 0;
		transition: all 0.2s;
	}

	.step-dot.active {
		background: oklch(0.65 0.25 280);
		border-color: oklch(0.65 0.25 280);
		color: #fff;
	}

	.step-dot.done {
		background: oklch(0.72 0.18 150 / 0.15);
		border-color: oklch(0.72 0.18 150);
		color: oklch(0.72 0.18 150);
	}

	.step-line {
		flex: 1;
		height: 2px;
		background: var(--color-border);
		transition: background 0.2s;
	}

	.step-line.done {
		background: oklch(0.72 0.18 150);
	}

	/* Content */
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.step-title {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.02em;
		margin: 0;
	}

	.step-sub {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.5;
	}

	.step-hint {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		margin: -8px 0 0;
		opacity: 0.7;
	}

	/* Fields */
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.field-input {
		width: 100%;
		padding: 10px 12px;
		background: var(--color-surface-alt, var(--color-surface));
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text);
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.field-input:focus {
		border-color: oklch(0.65 0.25 280 / 0.6);
		box-shadow: 0 0 0 3px oklch(0.65 0.25 280 / 0.1);
	}

	.field-textarea {
		resize: vertical;
		font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
		font-size: 0.8rem;
	}

	/* Mood grid */
	.mood-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.mood-btn {
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mood-btn:hover {
		border-color: var(--mood-border, oklch(0.65 0.25 280));
		color: var(--color-text);
	}

	.mood-btn.selected {
		background: var(--mood-bg);
		border-color: var(--mood-border);
		color: var(--color-text);
		font-weight: 600;
	}

	/* Actions */
	.onboarding-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-skip {
		padding: 10px 20px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn-skip:hover {
		color: var(--color-text);
		background: var(--color-surface-hover, var(--color-surface-2));
	}

	.btn-next {
		padding: 10px 24px;
		border-radius: 8px;
		border: none;
		background: oklch(0.65 0.25 280);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-next:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-next:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
