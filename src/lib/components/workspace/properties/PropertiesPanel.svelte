<script lang="ts">
	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Shows and edits properties for the selected timeline event.
	 *              Event mutations go directly to model.timeline via MODEL_STORE_KEY context.
	 * @example <PropertiesPanel {selectedEventId} />
	 */
	import { getContext, tick } from 'svelte';
	import type { Model, Assets, LightingType, Mood } from '$lib/model/model-types';
	import type { Preferences } from '$lib/stores/preferences.svelte';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY, PREFS_CONTEXT_KEY } from '$lib/context/keys';
	import CharacterField from '$lib/components/workspace/CharacterField.svelte';
	import PromptAssist from '$lib/components/workspace/properties/PromptAssist.svelte';
	import GenerateButton from '$lib/components/workspace/GenerateButton.svelte';

	const LIGHTING_TYPES: LightingType[] = ['dusk', 'daylight', 'studio', 'tungsten', 'ambient'];
	const MOODS: Mood[] = ['joyful', 'melancholic', 'anxious', 'serene', 'curious'];

	let {
		selectedEventId = $bindable(null)
	}: {
		selectedEventId?: string | null;
	} = $props();

	// Prompt Assist panel state
	let showPromptAssist = $state(false);
	let promptAssistActorIdx = $state<number | null>(null);

	const model = getContext<Model>(MODEL_STORE_KEY);
	const assetStore = getContext<Assets>(ASSET_STORE_KEY);
	const prefs = getContext<Preferences>(PREFS_CONTEXT_KEY);

	// --- Event selection (from model.timeline) ---
	const selectedEventIndex = $derived(
		// Support either a timeline time string (e.g. "120") or the local event id (e.g. "event_0")
		selectedEventId !== null
			? ((): number => {
					if (
						typeof selectedEventId === 'string' &&
						selectedEventId.startsWith &&
						selectedEventId.startsWith('event_')
					) {
						const parts = selectedEventId.split('_');
						const idx = parseInt(parts[1] ?? '', 10);
						return Number.isNaN(idx) ? -1 : idx;
					}
					return model.timeline.findIndex((ev) => String(ev.time) === selectedEventId);
				})()
			: -1
	);

	const selectedEvent = $derived(
		selectedEventIndex >= 0 ? model.timeline[selectedEventIndex] : null
	);

	// --- Mutation helpers (all write directly to model.timeline) ---

	function ensureCamera() {
		if (selectedEventIndex < 0) return;
		if (!model.timeline[selectedEventIndex].frame.camera) {
			model.timeline[selectedEventIndex].frame.camera = {};
		}
	}

	function ensureLighting() {
		if (selectedEventIndex < 0) return;
		if (!model.timeline[selectedEventIndex].frame.lighting) {
			model.timeline[selectedEventIndex].frame.lighting = {};
		}
	}

	function ensureFX() {
		if (selectedEventIndex < 0) return;
		if (!model.timeline[selectedEventIndex].frame.fx) {
			model.timeline[selectedEventIndex].frame.fx = {};
		}
	}

	function ensureControlNet() {
		if (selectedEventIndex < 0) return;
		if (!model.timeline[selectedEventIndex].frame.controlnet) {
			model.timeline[selectedEventIndex].frame.controlnet = {};
		}
	}

	function ensureActorSpeech(actorIdx: number) {
		if (selectedEventIndex < 0) return;
		const actor = model.timeline[selectedEventIndex].frame.actors?.[actorIdx];
		if (!actor) return;
		if (!actor.speech) {
			model.timeline[selectedEventIndex].frame.actors![actorIdx].speech = { text: '' };
		}
	}

	function updateCameraZoom(zoom: number) {
		ensureCamera();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.camera!.zoom = zoom;
	}

	function updateCameraPanX(x: number) {
		ensureCamera();
		if (selectedEventIndex < 0) return;
		const cam = model.timeline[selectedEventIndex].frame.camera!;
		cam.pan = [x, cam.pan?.[1] ?? 0];
	}

	function updateCameraPanY(y: number) {
		ensureCamera();
		if (selectedEventIndex < 0) return;
		const cam = model.timeline[selectedEventIndex].frame.camera!;
		cam.pan = [cam.pan?.[0] ?? 0, y];
	}

	function updateCameraTilt(tilt: number) {
		ensureCamera();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.camera!.tilt = tilt;
	}

	function updateLightingType(type: LightingType) {
		ensureLighting();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.lighting!.type = type;
	}

	function updateLightingIntensity(intensity: number) {
		ensureLighting();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.lighting!.intensity = intensity;
	}

	function updateFXBloom(bloom: number) {
		ensureFX();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.fx!.bloom = bloom;
	}

	function updateFXMotionBlur(motion_blur: number) {
		ensureFX();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.fx!.motion_blur = motion_blur;
	}

	function updateControlNetType(type: string) {
		ensureControlNet();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.controlnet!.type = type || undefined;
	}

	function updateControlNetStrength(strength: number) {
		ensureControlNet();
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.controlnet!.strength = strength;
	}

	function updateActorSpeechText(actorIdx: number, text: string) {
		ensureActorSpeech(actorIdx);
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.text = text;
	}

	function updateActorSpeechMood(actorIdx: number, mood: string) {
		ensureActorSpeech(actorIdx);
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.mood =
			(mood as Mood) || undefined;
	}

	function updateActorSpeechLipSync(actorIdx: number, lip_sync: boolean) {
		ensureActorSpeech(actorIdx);
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.lip_sync = lip_sync;
	}

	function updateActorSpeechVolume(actorIdx: number, volume: number) {
		ensureActorSpeech(actorIdx);
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.volume = volume;
	}

	function updateActorSpeechPitch(actorIdx: number, pitch_shift: number) {
		ensureActorSpeech(actorIdx);
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.pitch_shift = pitch_shift;
	}

	function updateActorAction(actorIdx: number, action: string) {
		if (selectedEventIndex < 0) return;
		const actor = model.timeline[selectedEventIndex].frame.actors?.[actorIdx];
		if (!actor) return;
		actor.action = action || undefined;
	}

	function appendToActorAction(actorIdx: number, term: string) {
		if (selectedEventIndex < 0) return;
		const actor = model.timeline[selectedEventIndex].frame.actors?.[actorIdx];
		if (!actor) return;
		const current = actor.action ?? '';
		actor.action = current ? `${current}, ${term}` : term;
	}

	function updateEventCharacter(characterId: string | null) {
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.character = characterId ?? undefined;
	}

	function updateEventNotes(text: string) {
		if (selectedEventIndex < 0) return;
		if (!text || text.trim() === '') {
			// remove empty notes to keep model lean
			delete (model.timeline[selectedEventIndex] as any).notes;
		} else {
			(model.timeline[selectedEventIndex] as any).notes = text;
		}
	}

	function getCharacterName(actorId: string): string {
		return assetStore?.characters.find((c) => c.id === actorId)?.name ?? actorId;
	}

	// Forward clicks through non-interactive areas of the properties panel to underlying timeline elements
	function forwardClick(e: MouseEvent) {
		if (typeof document === 'undefined') return;
		const target = e.target as HTMLElement | null;
		if (!target) return;
		// If the click landed on an interactive control, let it handle the event
		if (target.closest('input, textarea, select, button, [role="button"], [contenteditable]')) {
			return;
		}
		const panel = e.currentTarget as HTMLElement | null;
		if (!panel) return;
		const prev = panel.style.pointerEvents;
		// Temporarily hide the panel from hit-testing to find the underlying element
		panel.style.pointerEvents = 'none';
		const under = document.elementFromPoint(
			(e as MouseEvent).clientX,
			(e as MouseEvent).clientY
		) as HTMLElement | null;
		panel.style.pointerEvents = prev;
		if (!under) return;
		const timelineEl = under.closest('[aria-label^="Timeline event"]') as HTMLElement | null;
		if (timelineEl) {
			timelineEl.click();
			e.preventDefault();
			e.stopPropagation();
		}
	}
</script>

<!--
  PropertiesPanel Component
  Shows and edits the selected timeline event's frame properties.
-->
<div
	class="properties-panel flex flex-col gap-3 p-2"
	aria-label="Properties Panel"
	onclick={forwardClick}
>
	{#if selectedEvent}
		<!-- Timeline event selected — full editing -->
		<div>
			<div class="mb-3 text-sm font-semibold text-blue-600">
				Event {selectedEventIndex + 1} — Frame {selectedEvent.time}
			</div>

			<!-- ST-023: Character field -->
			<section class="mb-3">
				<CharacterField
					character={selectedEvent.frame.character}
					characters={assetStore?.characters ?? []}
					onchange={(id) => updateEventCharacter(id)}
				/>
			</section>

			<!-- Notes -->
			<section class="mb-3">
				<label class="text-xs text-gray-400 mb-1">Notes</label>
				<textarea
					value={selectedEvent.notes ?? ''}
					oninput={(e) => updateEventNotes((e.target as HTMLTextAreaElement).value)}
					rows={3}
					class="w-full rounded border border-gray-200 px-1 py-1 text-xs"
					aria-label="Event notes"
				></textarea>
			</section>

			<!-- Camera -->
			<section class="mb-3">
				<h3>Camera</h3>
				<div class="flex flex-col gap-1 rounded bg-gray-50 p-2">
					<!-- Zoom -->
					<div class="flex items-center gap-2">
						<label for="cam-zoom" class="w-16 shrink-0 text-xs text-gray-400">Zoom</label>
						<input
							id="cam-zoom"
							type="range"
							min="0.1"
							max="5.0"
							step="0.1"
							value={selectedEvent.frame.camera?.zoom ?? 1}
							oninput={(e) => updateCameraZoom(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Camera zoom"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{(selectedEvent.frame.camera?.zoom ?? 1).toFixed(1)}</span
						>
					</div>
					<!-- Pan X -->
					<div class="flex items-center gap-2">
						<label for="cam-panx" class="w-16 shrink-0 text-xs text-gray-400">Pan X</label>
						<input
							id="cam-panx"
							type="number"
							step="0.1"
							value={selectedEvent.frame.camera?.pan?.[0] ?? 0}
							oninput={(e) =>
								updateCameraPanX(parseFloat((e.target as HTMLInputElement).value) || 0)}
							class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
							aria-label="Camera pan X"
						/>
					</div>
					<!-- Pan Y -->
					<div class="flex items-center gap-2">
						<label for="cam-pany" class="w-16 shrink-0 text-xs text-gray-400">Pan Y</label>
						<input
							id="cam-pany"
							type="number"
							step="0.1"
							value={selectedEvent.frame.camera?.pan?.[1] ?? 0}
							oninput={(e) =>
								updateCameraPanY(parseFloat((e.target as HTMLInputElement).value) || 0)}
							class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
							aria-label="Camera pan Y"
						/>
					</div>
					<!-- Tilt -->
					<div class="flex items-center gap-2">
						<label for="cam-tilt" class="w-16 shrink-0 text-xs text-gray-400">Tilt</label>
						<input
							id="cam-tilt"
							type="range"
							min="-90"
							max="90"
							step="1"
							value={selectedEvent.frame.camera?.tilt ?? 0}
							oninput={(e) => updateCameraTilt(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Camera tilt"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{selectedEvent.frame.camera?.tilt ?? 0}°</span
						>
					</div>
				</div>
			</section>

			<!-- Lighting -->
			<section class="mb-3">
				<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Lighting</h3>
				<div class="flex flex-col gap-1 rounded bg-gray-50 p-2">
					<!-- Type -->
					<div class="flex items-center gap-2">
						<label for="light-type" class="w-16 shrink-0 text-xs text-gray-400">Type</label>
						<select
							id="light-type"
							value={selectedEvent.frame.lighting?.type ?? ''}
							onchange={(e) =>
								updateLightingType((e.target as HTMLSelectElement).value as LightingType)}
							class="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
							aria-label="Lighting type"
						>
							<option value="">— none —</option>
							{#each LIGHTING_TYPES as lt}
								<option value={lt}>{lt}</option>
							{/each}
						</select>
					</div>
					<!-- Intensity -->
					<div class="flex items-center gap-2">
						<label for="light-intensity" class="w-16 shrink-0 text-xs text-gray-400"
							>Intensity</label
						>
						<input
							id="light-intensity"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={selectedEvent.frame.lighting?.intensity ?? 1}
							oninput={(e) =>
								updateLightingIntensity(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Lighting intensity"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{(selectedEvent.frame.lighting?.intensity ?? 1).toFixed(2)}</span
						>
					</div>
				</div>
			</section>

			<!-- FX -->
			<section class="mb-3">
				<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">FX</h3>
				<div class="flex flex-col gap-1 rounded bg-gray-50 p-2">
					<!-- Bloom -->
					<div class="flex items-center gap-2">
						<label for="fx-bloom" class="w-16 shrink-0 text-xs text-gray-400">Bloom</label>
						<input
							id="fx-bloom"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={selectedEvent.frame.fx?.bloom ?? 0}
							oninput={(e) => updateFXBloom(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="FX bloom"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{(selectedEvent.frame.fx?.bloom ?? 0).toFixed(2)}</span
						>
					</div>
					<!-- Motion Blur -->
					<div class="flex items-center gap-2">
						<label for="fx-blur" class="w-16 shrink-0 text-xs text-gray-400">Blur</label>
						<input
							id="fx-blur"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={selectedEvent.frame.fx?.motion_blur ?? 0}
							oninput={(e) => updateFXMotionBlur(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="FX motion blur"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{(selectedEvent.frame.fx?.motion_blur ?? 0).toFixed(2)}</span
						>
					</div>
				</div>
			</section>

			<!-- ControlNet -->
			<section class="mb-3">
				<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">ControlNet</h3>
				<div class="flex flex-col gap-1 rounded bg-gray-50 p-2">
					<!-- Type -->
					<div class="flex items-center gap-2">
						<label for="cn-type" class="w-16 shrink-0 text-xs text-gray-400">Type</label>
						<input
							id="cn-type"
							type="text"
							value={selectedEvent.frame.controlnet?.type ?? ''}
							oninput={(e) => updateControlNetType((e.target as HTMLInputElement).value)}
							placeholder="e.g. openpose"
							class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
							aria-label="ControlNet type"
						/>
					</div>
					<!-- Strength -->
					<div class="flex items-center gap-2">
						<label for="cn-strength" class="w-16 shrink-0 text-xs text-gray-400">Strength</label>
						<input
							id="cn-strength"
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={selectedEvent.frame.controlnet?.strength ?? 1}
							oninput={(e) =>
								updateControlNetStrength(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="ControlNet strength"
						/>
						<span class="w-8 text-right text-xs tabular-nums"
							>{(selectedEvent.frame.controlnet?.strength ?? 1).toFixed(2)}</span
						>
					</div>
				</div>
			</section>

			<!-- Actors / Speech -->
			{#if selectedEvent.frame.actors?.length}
				<section class="mb-3">
					<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Actors</h3>
					{#each selectedEvent.frame.actors as actor, actorIdx (actor.id)}
						<div class="mb-2 rounded border border-gray-200 bg-gray-50 p-2">
							<div class="mb-1 text-xs font-semibold text-gray-600">
								{getCharacterName(actor.id)}
								<span class="font-normal text-gray-400">({actor.id})</span>
							</div>
							<!-- Speech -->
							<div class="flex flex-col gap-1">
								<label class="text-xs text-gray-400">Speech text</label>
								<textarea
									value={actor.speech?.text ?? ''}
									oninput={(e) =>
										updateActorSpeechText(actorIdx, (e.target as HTMLTextAreaElement).value)}
									rows={2}
									class="w-full rounded border border-gray-200 px-1 py-0.5 text-xs"
									aria-label={`Speech text for ${actor.id}`}
								></textarea>
								<!-- Mood -->
								<div class="flex items-center gap-2">
									<label for="mood-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400"
										>Mood</label
									>
									<select
										id="mood-{actor.id}"
										value={actor.speech?.mood ?? ''}
										onchange={(e) =>
											updateActorSpeechMood(actorIdx, (e.target as HTMLSelectElement).value)}
										class="flex-1 rounded border border-gray-200 bg-white px-1 py-0.5 text-xs"
										aria-label={`Mood for ${actor.id}`}
									>
										<option value="">— none —</option>
										{#each MOODS as m}
											<option value={m}>{m}</option>
										{/each}
									</select>
								</div>
								<!-- Lip sync -->
								<div class="flex items-center gap-2">
									<input
										id="lipsync-{actor.id}"
										type="checkbox"
										checked={actor.speech?.lip_sync ?? false}
										onchange={(e) =>
											updateActorSpeechLipSync(actorIdx, (e.target as HTMLInputElement).checked)}
										aria-label={`Lip sync for ${actor.id}`}
									/>
									<label for="lipsync-{actor.id}" class="text-xs text-gray-500">Lip sync</label>
								</div>
								<!-- Volume -->
								<div class="flex items-center gap-2">
									<label for="speech-vol-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400"
										>Vol</label
									>
									<input
										id="speech-vol-{actor.id}"
										type="range"
										min="0"
										max="2"
										step="0.01"
										value={actor.speech?.volume ?? 1}
										oninput={(e) =>
											updateActorSpeechVolume(
												actorIdx,
												parseFloat((e.target as HTMLInputElement).value)
											)}
										class="flex-1"
										aria-label={`Volume for ${actor.id}`}
									/>
									<span class="w-8 text-right text-xs tabular-nums"
										>{(actor.speech?.volume ?? 1).toFixed(2)}</span
									>
								</div>
								<!-- Pitch -->
								<div class="flex items-center gap-2">
									<label for="speech-pitch-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400"
										>Pitch</label
									>
									<input
										id="speech-pitch-{actor.id}"
										type="range"
										min="-12"
										max="12"
										step="0.5"
										value={actor.speech?.pitch_shift ?? 0}
										oninput={(e) =>
											updateActorSpeechPitch(
												actorIdx,
												parseFloat((e.target as HTMLInputElement).value)
											)}
										class="flex-1"
										aria-label={`Pitch shift for ${actor.id}`}
									/>
									<span class="w-8 text-right text-xs tabular-nums"
										>{(actor.speech?.pitch_shift ?? 0).toFixed(1)}</span
									>
								</div>

								<!-- S24-01: Action field with Assist button -->
								<div class="mt-2 flex flex-col gap-1 relative">
									<div class="flex items-center gap-2">
										<label for="action-{actor.id}" class="w-16 shrink-0 text-xs text-gray-400"
											>Action</label
										>
										<input
											id="action-{actor.id}"
											type="text"
											value={actor.action ?? ''}
											oninput={(e) => updateActorAction(actorIdx, (e.target as HTMLInputElement).value)}
											placeholder="e.g. standing, walking..."
											class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
											aria-label={`Action for ${actor.id}`}
										/>
										<button
											class="assist-btn"
											onclick={() => {
												showPromptAssist = !showPromptAssist;
												promptAssistActorIdx = showPromptAssist ? actorIdx : null;
											}}
											title="Open prompt suggestions"
											aria-label="Open prompt suggestions"
										>
											✨
										</button>
									</div>

									<!-- Prompt Assist panel -->
									{#if showPromptAssist && promptAssistActorIdx === actorIdx}
										<div class="assist-container">
											<PromptAssist
												onSelect={(term) => {
													appendToActorAction(actorIdx, term);
													showPromptAssist = false;
													promptAssistActorIdx = null;
												}}
												onClose={() => {
													showPromptAssist = false;
													promptAssistActorIdx = null;
												}}
											/>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</section>
			{/if}

			<!-- S24-04-UI: ComfyUI Generate Button -->
			<section class="mb-3">
				<GenerateButton
					eventId={selectedEventId ?? ''}
					prompt={selectedEvent.frame.prompt ?? ''}
					{prefs}
				/>
			</section>
		</div>
	{/if}
	<!-- Always in DOM: visible only when nothing is selected -->
	<div
		aria-label="No selection"
		style={selectedEvent ? 'display:none' : 'font-size:0.6rem;opacity:0.4;min-height:0.8rem;'}
	></div>
</div>

<style>
	.properties-panel {
		pointer-events: auto;
	}
	.properties-panel input,
	.properties-panel textarea,
	.properties-panel select,
	.properties-panel button,
	.properties-panel [role='button'] {
		pointer-events: auto;
	}

	.assist-btn {
		background: none;
		border: 1px solid #ddd;
		border-radius: 3px;
		padding: 4px 6px;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
	}

	.assist-btn:hover {
		background: #f0f0f0;
		border-color: #999;
	}

	.assist-btn:active {
		background: #e0e0e0;
	}

	.assist-container {
		margin-top: 8px;
		position: relative;
	}
</style>
