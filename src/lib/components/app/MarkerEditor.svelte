<script lang="ts">
	import type { TimelineMarker, MarkerType } from '$lib/model/marker-types';
	import { MARKER_COLORS, MARKER_LABELS } from '$lib/model/marker-types';

	let {
		marker,
		currentTime = 0,
		onSave,
		onCancel
	}: {
		marker?: TimelineMarker;
		currentTime?: number;
		onSave: (marker: TimelineMarker) => void;
		onCancel: () => void;
	} = $props();

	let label = $state(marker?.label ?? '');
	let type = $state<MarkerType>(marker?.type ?? 'note');
	let color = $state(marker?.color ?? '');
	let notes = $state(marker?.notes ?? '');
	let time = $state(marker?.time ?? currentTime);

	function handleSubmit() {
		if (!label.trim()) return;

		onSave({
			id: marker?.id ?? `marker_${Date.now()}`,
			label: label.trim(),
			type,
			color: color || undefined,
			notes: notes.trim() || undefined,
			time,
			createdAt: marker?.createdAt ?? Date.now(),
			updatedAt: Date.now()
		});
	}

	function handleTypeChange(newType: MarkerType) {
		type = newType;
		if (!marker?.color) {
			// Only update color if not manually overridden
			color = MARKER_COLORS[newType];
		}
	}
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="marker-editor-title">
	<div class="modal-content">
		<h2 id="marker-editor-title">{marker ? 'Edit' : 'Add'} Marker</h2>

		<form onsubmit={(e) => e.preventDefault() || handleSubmit()}>
			<div class="form-group">
				<label for="marker-time">Time (ms)</label>
				<input
					id="marker-time"
					type="number"
					value={time}
					oninput={(e) => (time = parseInt((e.target as HTMLInputElement).value) || 0)}
					required
					min="0"
					step="100"
				/>
			</div>

			<div class="form-group">
				<label for="marker-label">Label</label>
				<input
					id="marker-label"
					type="text"
					value={label}
					oninput={(e) => (label = (e.target as HTMLInputElement).value)}
					required
					placeholder="Chapter 1, Beat, etc."
					maxlength="50"
				/>
			</div>

			<div class="form-group">
				<label for="marker-type">Type</label>
				<select
					id="marker-type"
					value={type}
					onchange={(e) => handleTypeChange((e.target as HTMLSelectElement).value as MarkerType)}
				>
					<option value="chapter">{MARKER_LABELS.chapter}</option>
					<option value="beat">{MARKER_LABELS.beat}</option>
					<option value="note">{MARKER_LABELS.note}</option>
					<option value="cue">{MARKER_LABELS.cue}</option>
				</select>
			</div>

			<div class="form-group">
				<label for="marker-color">Color (optional)</label>
				<div class="color-input">
					<input
						id="marker-color"
						type="color"
						value={color || MARKER_COLORS[type]}
						oninput={(e) => (color = (e.target as HTMLInputElement).value)}
					/>
					<span class="color-preview" style="background-color: {color || MARKER_COLORS[type]}"></span>
				</div>
				<small>Default: {MARKER_COLORS[type]}</small>
			</div>

			<div class="form-group">
				<label for="marker-notes">Notes</label>
				<textarea
					id="marker-notes"
					value={notes}
					oninput={(e) => (notes = (e.target as HTMLTextAreaElement).value)}
					rows="3"
					placeholder="Additional notes..."
					maxlength="500"
				/>
			</div>

			<div class="form-actions">
				<button type="button" onclick={onCancel}>Cancel</button>
				<button type="submit" class="primary">Save</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 150ms ease;
	}

	.modal-content {
		background-color: var(--color-surface-2);
		border-radius: 8px;
		padding: 24px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
		animation: slideUp 200ms ease;
	}

	h2 {
		margin: 0 0 20px;
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
	}

	.form-group {
		margin-bottom: 16px;
	}

	label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}

	input[type='text'],
	input[type='number'],
	select,
	textarea {
		width: 100%;
		padding: 8px 12px;
		font-size: 14px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background-color: var(--color-surface-3);
		color: var(--color-text);
	}

	input[type='text']:focus,
	input[type='number']:focus,
	select:focus,
	textarea:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	textarea {
		resize: vertical;
	}

	.color-input {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	input[type='color'] {
		width: 50px;
		height: 36px;
		padding: 2px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
	}

	.color-preview {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

	small {
		display: block;
		margin-top: 4px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	button {
		padding: 8px 16px;
		font-size: 14px;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background-color: var(--color-surface-2);
		color: var(--color-text);
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	button:hover {
		background-color: var(--color-surface-3);
	}

	button.primary {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	button.primary:hover {
		background-color: var(--color-primary-dark);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
