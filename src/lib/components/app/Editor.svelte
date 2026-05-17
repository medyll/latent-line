<!-- Editor.svelte — Main editor: sidebar + storyboard grid + docked timeline -->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { Model, TimelineEvent } from '$lib/model/model-types';
	import { MODEL_STORE_KEY, PLAYBACK_CONTEXT_KEY } from '$lib/context/keys';
	import type { PlaybackStore } from '$lib/context/playback-context.svelte';

	import Sidebar from '$lib/components/ds/Sidebar.svelte';
	import Card from '$lib/components/ds/Card.svelte';
	import Timeline from '$lib/components/ds/Timeline.svelte';
	import Waveform from '$lib/components/ds/Waveform.svelte';
	import Button from '$lib/components/ds/Button.svelte';
	import Icon from '$lib/components/ds/Icon.svelte';

	let {
		selectedTime = $bindable<number | null>(null),
		onadd,
		onboardingActive = false
	}: {
		selectedTime?: number | null;
		onadd?: (sectionId: string) => void;
		onboardingActive?: boolean;
	} = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);
	const playback = getContext<PlaybackStore>(PLAYBACK_CONTEXT_KEY);

	let sidebarCollapsed = $state(false);
	let search = $state('');
	let zoom = $state(1);
	let playheadTime = $state(0);

	const timeline = $derived([...model.timeline].sort((a, b) => a.time - b.time));
	const maxTime = $derived(
		timeline.length ? Math.max(...timeline.map((e) => e.time + (e.duration ?? 48))) : 600
	);

	// Deterministic character color from id
	function charColor(id: string): string {
		let hash = 0;
		for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
		const h = Math.abs(hash) % 360;
		return `oklch(0.6 0.2 ${h})`;
	}

	function getCharacter(ev: TimelineEvent) {
		const first = ev.frame.actors?.[0];
		if (!first) return undefined;
		const char = model.assets.characters.find((c) => c.id === first.id);
		if (!char) return undefined;
		return {
			initials: char.name
				.split(' ')
				.map((w) => w[0])
				.join('')
				.slice(0, 2)
				.toUpperCase(),
			name: char.name,
			color: charColor(char.id)
		};
	}

	function getMood(ev: TimelineEvent) {
		const mood = ev.frame.actors?.[0]?.speech?.mood;
		if (!mood) return undefined;
		const map: Record<string, { label: string; icon: string; color: string }> = {
			joyful: { label: 'joyful', icon: 'sun', color: '#d97706' },
			melancholic: { label: 'melancholic', icon: 'moon', color: '#6366f1' },
			anxious: { label: 'anxious', icon: 'warning', color: '#dc2626' },
			serene: { label: 'serene', icon: 'info', color: '#0891b2' },
			curious: { label: 'curious', icon: 'sparkle', color: '#7c3aed' }
		};
		return map[mood];
	}

	function getDialogue(ev: TimelineEvent) {
		return ev.frame.actors?.[0]?.speech?.text;
	}

	function getAction(ev: TimelineEvent) {
		return ev.frame.actors?.[0]?.action;
	}

	// Sidebar sections derived from model assets
	const sidebarSections = $derived([
		{
			id: 'characters',
			label: 'Characters',
			items: model.assets.characters.map((c) => ({
				id: c.id,
				label: c.name,
				badge: c.name
					.split(' ')
					.map((w) => w[0])
					.join('')
					.slice(0, 2)
					.toUpperCase(),
				badgeColor: charColor(c.id)
			}))
		},
		{
			id: 'environments',
			label: 'Environments',
			items: Object.entries(model.assets.environments).map(([id, env]) => ({
				id,
				label: id.replace(/_/g, ' '),
				subLabel: env.prompt.slice(0, 40) + '…'
			}))
		},
		{
			id: 'audio',
			label: 'Audio',
			items: model.assets.audio.map((a) => ({
				id: a.id,
				label: a.label || a.id,
				subLabel: a.url
			}))
		}
	]);

	// Timeline events for the track
	const trackEvents = $derived(
		timeline.map((ev) => ({
			time: ev.time,
			duration: ev.duration ?? 48,
			label: `F${ev.time}`,
			actors: ev.frame.actors?.length ?? 0,
			selected: selectedTime === ev.time,
			active: playheadTime >= ev.time && playheadTime < ev.time + (ev.duration ?? 48)
		}))
	);

	const markers = $derived(
		(model.markers ?? []).map((m) => ({
			time: m.time,
			label: m.label.slice(0, 6),
			color: m.color || undefined
		}))
	);

	function selectEvent(time: number) {
		selectedTime = selectedTime === time ? null : time;
	}

	function handleTrackSeek(frame: number) {
		playheadTime = frame;
		playback.playheadTime = frame;
	}

	function handlePlayToggle() {
		playback.isPlaying = !playback.isPlaying;
	}

	function handleResize(time: number, newDuration: number) {
		const ev = model.timeline.find((e) => e.time === time);
		if (ev) {
			ev.duration = Math.max(12, Math.round(newDuration));
		}
	}

	const _syncPlayhead = $derived.by(() => {
		playheadTime = playback.playheadTime;
		return playheadTime;
	});

	// ── Drag & drop reorder ───────────────────────────────────────
	let dragOverIndex = $state<number | null>(null);

	function handleDragStart(e: DragEvent, index: number) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(index));
		(e.currentTarget as HTMLElement).classList.add('dragging');
	}

	function handleDragEnd(e: DragEvent) {
		(e.currentTarget as HTMLElement).classList.remove('dragging');
		dragOverIndex = null;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault();
		const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1', 10);
		if (fromIndex < 0 || fromIndex === dropIndex) return;

		// Reorder model.timeline in place
		const [moved] = model.timeline.splice(fromIndex, 1);
		model.timeline.splice(dropIndex, 0, moved);

		// Recalculate times to maintain contiguous order
		let t = 0;
		for (const ev of model.timeline) {
			ev.time = t;
			t += ev.duration ?? 48;
		}

		dragOverIndex = null;
	}

	// ── Shot editor panel ─────────────────────────────────────────
	let editingShot = $state<TimelineEvent | null>(null);
	let editorOpen = $state(false);

	function openEditor(ev: TimelineEvent) {
		const shot = structuredClone(ev) as TimelineEvent;
		if (!shot.duration) shot.duration = 48;
		if (!shot.frame.actors) shot.frame.actors = [];
		if (!shot.frame.actors[0]) shot.frame.actors[0] = { id: '' };
		if (!shot.frame.actors[0].speech) shot.frame.actors[0].speech = { text: '' };
		editingShot = shot;
		editorOpen = true;
	}

	function closeEditor() {
		editingShot = null;
		editorOpen = false;
	}

	function saveEditor() {
		if (!editingShot) return;
		const idx = model.timeline.findIndex((e) => e.time === editingShot!.time);
		if (idx >= 0) {
			model.timeline[idx] = editingShot as TimelineEvent;
		}
		closeEditor();
	}

	function deleteShot(time: number) {
		const idx = model.timeline.findIndex((e) => e.time === time);
		if (idx >= 0) {
			model.timeline.splice(idx, 1);
			// Recalc times
			let t = 0;
			for (const ev of model.timeline) {
				ev.time = t;
				t += ev.duration ?? 48;
			}
		}
		if (selectedTime === time) selectedTime = null;
		closeEditor();
	}
</script>

<div class="editor">
	<Sidebar sections={sidebarSections} bind:search bind:collapsed={sidebarCollapsed} />

	<div class="editor-main">
		<!-- Storyboard grid -->
		<div class="storyboard">
			{#if timeline.length === 0 && !onboardingActive}
				<div class="empty-state" role="status" aria-live="polite">
					<div class="empty-icon">
						<Icon name="image" size={48} />
					</div>
					<h3>No shots yet</h3>
					<p>Drag characters from the sidebar or click below to create your first shot.</p>
					<Button
						variant="primary"
						label="Add first shot"
						icon="plus"
						onclick={() => onadd?.('characters')}
					/>
				</div>
			{:else if timeline.length > 0}
				<div class="shot-grid">
					{#each timeline as ev, i (ev.time)}
						{@const isDragOver = dragOverIndex === i}
						<div
							class="shot-wrapper"
							class:drag-over={isDragOver}
							draggable="true"
							ondragstart={(e) => handleDragStart(e, i)}
							ondragend={handleDragEnd}
							ondragover={(e) => handleDragOver(e, i)}
							ondrop={(e) => handleDrop(e, i)}
							role="listitem"
							aria-grabbed="true"
						>
							<Card
								frame={ev.time}
								start={ev.time}
								end={ev.time + (ev.duration ?? 48)}
								character={getCharacter(ev)}
								dialogue={getDialogue(ev)}
								mood={getMood(ev)}
								action={getAction(ev)}
								selected={selectedTime === ev.time}
								onselect={() => selectEvent(ev.time)}
								onedit={() => openEditor(ev)}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Docked timeline + audio -->
		<div class="timeline-dock">
			<Timeline
				events={trackEvents}
				bind:playheadTime
				bind:zoom
				{maxTime}
				{selectedTime}
				{markers}
				oneventclick={selectEvent}
				onplayheadseek={handleTrackSeek}
				onplaytoggle={handlePlayToggle}
				onresize={handleResize}
			/>
			<div class="audio-wave">
				<Waveform bars={160} height={28} animated={playback.isPlaying} />
			</div>
		</div>
	</div>
</div>

<!-- Shot Editor Slide-in Panel -->
{#if editorOpen && editingShot}
	<div class="editor-overlay" onclick={closeEditor} role="presentation"></div>
	<aside class="shot-editor" class:open={editorOpen}>
		<div class="se-header">
			<h3>Edit Shot</h3>
			<button class="se-close" onclick={closeEditor} aria-label="Close">
				<Icon name="close" size={18} />
			</button>
		</div>

		<div class="se-body">
			<div class="se-field">
				<label for="se-frame">Frame</label>
				<span id="se-frame" class="se-readonly">{editingShot.time}</span>
			</div>

			<div class="se-field">
				<label for="se-duration">Duration (frames)</label>
				<input
					id="se-duration"
					type="number"
					min="1"
					max="600"
					bind:value={editingShot.duration}
					class="se-input"
				/>
			</div>

			<div class="se-field">
				<label for="se-dialogue">Dialogue</label>
				<textarea
					id="se-dialogue"
					class="se-textarea"
					rows="3"
					bind:value={editingShot.frame.actors[0].speech.text}
				></textarea>
			</div>

			<div class="se-field">
				<label for="se-action">Action</label>
				<input
					id="se-action"
					type="text"
					class="se-input"
					bind:value={editingShot.frame.actors[0].action}
				/>
			</div>

			<div class="se-field">
				<label for="se-mood">Mood</label>
				<select id="se-mood" class="se-select" bind:value={editingShot.frame.actors[0].speech.mood}>
					<option value="joyful">joyful</option>
					<option value="melancholic">melancholic</option>
					<option value="anxious">anxious</option>
					<option value="serene">serene</option>
					<option value="curious">curious</option>
				</select>
			</div>

			<div class="se-field">
				<label for="se-notes">Notes</label>
				<textarea id="se-notes" class="se-textarea" rows="2" bind:value={editingShot.notes}
				></textarea>
			</div>
		</div>

		<div class="se-footer">
			<Button
				variant="danger"
				size="sm"
				icon="trash"
				label="Delete"
				onclick={() => deleteShot(editingShot.time)}
			/>
			<div class="se-actions">
				<Button variant="ghost" size="sm" label="Cancel" onclick={closeEditor} />
				<Button variant="primary" size="sm" icon="check" label="Save" onclick={saveEditor} />
			</div>
		</div>
	</aside>
{/if}

<style>
	.editor {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}

	.editor-main {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.storyboard {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: var(--pad-md);
		background: var(--bg);
	}

	.shot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--gap-md);
		align-content: start;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.shot-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: var(--gap-sm);
		}
		.storyboard {
			padding: var(--gap-sm);
		}
	}

	@media (max-width: 480px) {
		.shot-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--gap-sm);
		height: 100%;
		color: var(--text-muted);
		text-align: center;
	}

	.empty-state .empty-icon {
		color: var(--text-muted);
		opacity: 0.4;
		margin-bottom: 0.5rem;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}

	.empty-state h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text);
	}

	.empty-state p {
		margin: 0;
		font-size: 0.8125rem;
		max-width: 280px;
	}

	.timeline-dock {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	.audio-wave {
		background: var(--surface2);
		border-top: 1px solid var(--border);
		padding: 0.25rem 0;
	}

	/* Drag & drop */
	.shot-wrapper {
		transition: transform 0.15s ease;
	}

	.shot-wrapper.drag-over {
		position: relative;
	}

	.shot-wrapper.drag-over::before {
		content: '';
		position: absolute;
		inset: -4px;
		border: 2px dashed var(--accent2);
		border-radius: var(--radius-md);
		pointer-events: none;
		z-index: 2;
	}

	/* Shot Editor Panel */
	.editor-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 90;
		animation: fadeIn 0.2s ease;
	}

	.shot-editor {
		position: fixed;
		top: 0;
		right: 0;
		width: 360px;
		max-width: 90vw;
		height: 100%;
		background: var(--surface);
		border-left: 1px solid var(--border);
		z-index: 100;
		display: flex;
		flex-direction: column;
		transform: translateX(100%);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.shot-editor.open {
		transform: translateX(0);
	}

	.se-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.se-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text);
	}

	.se-close {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-dim);
		cursor: pointer;
		transition: background 0.15s;
	}

	.se-close:hover {
		background: var(--surface2);
		color: var(--text);
	}

	.se-body {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.se-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.se-field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.se-readonly {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--text-muted);
		padding: 0.5rem 0;
	}

	.se-input,
	.se-select,
	.se-textarea {
		background: var(--surface2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-family: inherit;
		font-size: 0.8125rem;
		padding: 0.5rem 0.625rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.se-input:focus,
	.se-select:focus,
	.se-textarea:focus {
		border-color: var(--accent2);
	}

	.se-textarea {
		resize: vertical;
		min-height: 60px;
	}

	.se-select {
		cursor: pointer;
	}

	.se-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
		gap: 0.75rem;
	}

	.se-actions {
		display: flex;
		gap: 0.5rem;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
