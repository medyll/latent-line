<script lang="ts">
	/**
	 * PropertiesPanel.svelte
	 *
	 * @component PropertiesPanel
	 * @description Shows contextual properties for the selected timeline event or asset.
	 *              - Event selected: full editing of camera, lighting, FX, ControlNet, speech per actor.
	 *              - Asset selected: read-only display of character / environment / audio.
	 *              Event mutations go directly to model.timeline via MODEL_STORE_KEY context.
	 * @example <PropertiesPanel {selectedEventId} {selectedAssetId} />
	 */
	import { getContext, tick } from 'svelte';
	import type {
		Model,
		Assets,
		Character,
		EnvironmentAsset,
		AudioAsset,
		LightingType,
		Mood
	} from '$lib/model/model-types';
	import { ASSET_STORE_KEY, MODEL_STORE_KEY, SELECTION_STORE_KEY } from '$lib/context/keys';
	import CharacterField from './CharacterField.svelte';

	const LIGHTING_TYPES: LightingType[] = ['dusk', 'daylight', 'studio', 'tungsten', 'ambient'];
	const MOODS: Mood[] = ['joyful', 'melancholic', 'anxious', 'serene', 'curious'];

	let {
		selectedEventId = null,
		selectedAssetId = null
	}: {
		selectedEventId?: string | null;
		selectedAssetId?: string | null;
	} = $props();

	const model = getContext<Model>(MODEL_STORE_KEY);
	const assetStore = getContext<Assets>(ASSET_STORE_KEY);
	// Subscribe to shared selectionStore for stronger sync guarantees
	const selectionStore = getContext(SELECTION_STORE_KEY) as { subscribe: (fn: (v: string | null) => void) => void } | undefined;
	let syncLabel: string | null = null;
	if (selectionStore) {
		selectionStore.subscribe((val) => {
			if (!val) {
				syncLabel = null;
				return;
			}
			if (val.startsWith('char:')) syncLabel = 'Character';
			else if (val.startsWith('env:')) syncLabel = 'Environment';
			else if (val.startsWith('audio:')) syncLabel = 'Audio';
			else if (val.startsWith('event_') || String(Number(val)) === val) syncLabel = 'Event';
			else syncLabel = 'Selection';
		});
	}

	// --- Asset selection ---
	const parsedAsset = $derived.by(() => {
		if (!selectedAssetId) return null;
		const colonIdx = selectedAssetId.indexOf(':');
		if (colonIdx === -1) return null;
		return { type: selectedAssetId.slice(0, colonIdx), id: selectedAssetId.slice(colonIdx + 1) };
	});

	const selectedCharacter = $derived.by((): Character | null => {
		if (!parsedAsset || parsedAsset.type !== 'char' || !assetStore) return null;
		return assetStore.characters.find((c) => c.id === parsedAsset.id) ?? null;
	});

	const selectedEnvironment = $derived.by((): (EnvironmentAsset & { id: string }) | null => {
		if (!parsedAsset || parsedAsset.type !== 'env' || !assetStore) return null;
		const env = assetStore.environments[parsedAsset.id];
		if (!env) return null;
		return { ...env, id: parsedAsset.id };
	});

	const selectedAudio = $derived.by((): AudioAsset | null => {
		if (!parsedAsset || parsedAsset.type !== 'audio' || !assetStore) return null;
		return assetStore.audio?.find((a) => a.id === parsedAsset.id) ?? null;
	});

	// --- Event selection (from model.timeline) ---
	const selectedEventIndex = $derived(
		// Support either a timeline time string (e.g. "120") or the local event id (e.g. "event_0")
		selectedEventId !== null
			? ((): number => {
				if (typeof selectedEventId === 'string' && selectedEventId.startsWith && selectedEventId.startsWith('event_')) {
					const parts = selectedEventId.split('_');
					const idx = parseInt(parts[1] ?? '', 10);
					return Number.isNaN(idx) ? -1 : idx;
				}
				return model.timeline.findIndex((ev) => String(ev.time) === selectedEventId);
			})()
			: -1
	);

	const selectedEvent = $derived(selectedEventIndex >= 0 ? model.timeline[selectedEventIndex] : null);

// Debug: log selection props for E2E troubleshooting
$effect(() => {
	console.log('[bmad-debug] PropertiesPanel props:', { selectedEventId, selectedEventIndex });
});

// Test-only: expose a DOM-ready marker that flips when selection-derived data is resolved
let selectionReady = $state(false);
$effect(async () => {
	// Wait a microtask to let derived values compute, then mark ready
	await tick();
	selectionReady = !!selectedEvent || !!selectedCharacter || !!selectedEnvironment || !!selectedAudio || selectedEventIndex >= 0;
	// clear marker after short delay to avoid permanent state (keeps DOM updates observable)
	setTimeout(() => (selectionReady = false), 1000);
});

// Immediate synchronous marker for tests: updated synchronously when props change
// Bind selectionImmediate via an effect so it toggles immediately when props change
let selectionImmediate = $state(false);
$effect(() => {
	// Use only the props for immediate signal; derived index can lag briefly
	selectionImmediate = !!selectedEventId || !!selectedAssetId;
});

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
		model.timeline[selectedEventIndex].frame.actors![actorIdx].speech!.mood = (mood as Mood) || undefined;
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

	function updateEventCharacter(characterId: string | null) {
		if (selectedEventIndex < 0) return;
		model.timeline[selectedEventIndex].frame.character = characterId ?? undefined;
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
	const under = document.elementFromPoint((e as MouseEvent).clientX, (e as MouseEvent).clientY) as HTMLElement | null;
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

<!-- Test-only debug hook: Playwright can wait for this element when selection changes -->
<div aria-hidden="true" data-testid="pp-selection-ready" style="display:none" data-ready={selectionReady} data-immediate={selectionImmediate} data-no-selection={!selectionImmediate}></div>
<!-- Immediate synchronous DOM marker for stronger test guarantees -->
<div aria-hidden="true" data-testid="pp-sync-ready" style="display:none" data-immediate={selectionImmediate}></div>



<style>
.properties-panel { pointer-events: auto; }
.properties-panel input,
.properties-panel textarea,
.properties-panel select,
.properties-panel button,
.properties-panel [role="button"] { pointer-events: auto; }
</style>

<!--
  PropertiesPanel Component
  Shows and edits the selected timeline event's frame properties.
  Asset selection shows read-only display.
-->
<div class="flex flex-col gap-3 p-2 properties-panel" aria-label="Properties Panel" onclick={forwardClick}>
	<h2 class="text-sm font-bold tracking-wide text-gray-500 uppercase">Properties</h2>

	<!-- Synchronous visible heading for tests: reflects basic selection immediately from props (minimizes derived lookups) -->
	{#if selectionImmediate}
		<div class="mb-1 text-sm font-semibold text-gray-600" data-testid="pp-sync-heading">
			{#if selectedAssetId}
				{#if selectedAssetId.startsWith('char:')}
					Character
				{:else if selectedAssetId.startsWith('env:')}
					Environment
				{:else if selectedAssetId.startsWith('audio:')}
					Audio
				{:else}
					Asset
				{/if}
			{:else if selectedEventId}
				Event
			{:else}
				Selection
			{/if}
		</div>
	{/if}

	<!-- Always-rendered synchronous label derived directly from props to maximize test-observable stability -->
	<!-- Always render sync label (helps tests observe selection immediately) -->
	<div aria-hidden="false" data-testid="pp-sync-label" aria-label="Sync selection label" class="text-xs text-gray-500 mb-1">
		{syncLabel ?? (selectedAssetId ? (selectedAssetId.startsWith('char:') ? 'Character' : selectedAssetId.startsWith('env:') ? 'Environment' : selectedAssetId.startsWith('audio:') ? 'Audio' : 'Asset') : (selectedEventId ? 'Event' : 'No selection'))}
	</div>

	{#if selectedCharacter}
		<!-- Character asset selected -->
		<div class="rounded border border-blue-200 bg-blue-50 p-3">
			<div class="mb-2 text-xs font-semibold text-blue-600 uppercase">Character</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedCharacter.id}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">Name</dt>
					<dd class="font-medium">{selectedCharacter.name}</dd>
				</div>
				{#if selectedCharacter.voice_id}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Voice</dt>
						<dd class="font-mono">{selectedCharacter.voice_id}</dd>
					</div>
				{/if}
				{#if selectedCharacter.outfits && Object.keys(selectedCharacter.outfits).length}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Outfits</dt>
						<dd class="flex flex-wrap gap-1">
							{#each Object.keys(selectedCharacter.outfits) as outfit}
								<span class="rounded bg-blue-100 px-1 py-0.5 font-mono text-blue-700">{outfit}</span>
							{/each}
						</dd>
					</div>
				{/if}
				{#if selectedCharacter.references?.length}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">References</dt>
						<dd>{selectedCharacter.references.length} ref{selectedCharacter.references.length > 1 ? 's' : ''}</dd>
					</div>
				{/if}
			</dl>
		</div>

	{:else if selectedEnvironment}
		<!-- Environment asset selected -->
		<div class="rounded border border-green-200 bg-green-50 p-3">
			<div class="mb-2 text-xs font-semibold text-green-600 uppercase">Environment</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedEnvironment.id}</dd>
				</div>
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">Prompt</dt>
					<dd class="leading-relaxed">{selectedEnvironment.prompt}</dd>
				</div>
				{#if selectedEnvironment.ref}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Ref</dt>
						<dd class="font-mono">{selectedEnvironment.ref}</dd>
					</div>
				{/if}
			</dl>
		</div>

	{:else if selectedAudio}
		<!-- Audio asset selected -->
		<div class="rounded border border-purple-200 bg-purple-50 p-3">
			<div class="mb-2 text-xs font-semibold text-purple-600 uppercase">Audio</div>
			<dl class="flex flex-col gap-1 text-xs">
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">ID</dt>
					<dd class="font-mono font-medium">{selectedAudio.id}</dd>
				</div>
				{#if selectedAudio.label}
					<div class="flex gap-2">
						<dt class="w-20 shrink-0 text-gray-400">Label</dt>
						<dd>{selectedAudio.label}</dd>
					</div>
				{/if}
				<div class="flex gap-2">
					<dt class="w-20 shrink-0 text-gray-400">URL</dt>
					<dd class="truncate font-mono text-gray-600">{selectedAudio.url || '—'}</dd>
				</div>
			</dl>
		</div>

	{:else if selectedEvent}
		<!-- Timeline event selected — full editing -->
		<div>
			<div class="mb-3 text-sm font-semibold text-blue-600">Event {selectedEventIndex + 1} — Frame {selectedEvent.time}</div>

			<!-- ST-023: Character field -->
			<section class="mb-3">
				<CharacterField
					character={selectedEvent.frame.character}
					characters={assetStore?.characters ?? []}
					onchange={(e) => updateEventCharacter(e.detail)}
				/>
			</section>

			<!-- Camera -->
			<section class="mb-3">
				<h3 class="mb-1 text-xs font-semibold text-gray-400 uppercase">Camera</h3>
				<div class="flex flex-col gap-1 rounded bg-gray-50 p-2">
					<!-- Zoom -->
					<div class="flex items-center gap-2">
						<label for="cam-zoom" class="w-16 shrink-0 text-xs text-gray-400">Zoom</label>
						<input
							id="cam-zoom"
							type="range" min="0.1" max="5.0" step="0.1"
							value={selectedEvent.frame.camera?.zoom ?? 1}
							oninput={(e) => updateCameraZoom(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Camera zoom"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{(selectedEvent.frame.camera?.zoom ?? 1).toFixed(1)}</span>
					</div>
					<!-- Pan X -->
					<div class="flex items-center gap-2">
						<label for="cam-panx" class="w-16 shrink-0 text-xs text-gray-400">Pan X</label>
						<input
							id="cam-panx"
							type="number" step="0.1"
							value={selectedEvent.frame.camera?.pan?.[0] ?? 0}
							oninput={(e) => updateCameraPanX(parseFloat((e.target as HTMLInputElement).value) || 0)}
							class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
							aria-label="Camera pan X"
						/>
					</div>
					<!-- Pan Y -->
					<div class="flex items-center gap-2">
						<label for="cam-pany" class="w-16 shrink-0 text-xs text-gray-400">Pan Y</label>
						<input
							id="cam-pany"
							type="number" step="0.1"
							value={selectedEvent.frame.camera?.pan?.[1] ?? 0}
							oninput={(e) => updateCameraPanY(parseFloat((e.target as HTMLInputElement).value) || 0)}
							class="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
							aria-label="Camera pan Y"
						/>
					</div>
					<!-- Tilt -->
					<div class="flex items-center gap-2">
						<label for="cam-tilt" class="w-16 shrink-0 text-xs text-gray-400">Tilt</label>
						<input
							id="cam-tilt"
							type="range" min="-90" max="90" step="1"
							value={selectedEvent.frame.camera?.tilt ?? 0}
							oninput={(e) => updateCameraTilt(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Camera tilt"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{selectedEvent.frame.camera?.tilt ?? 0}°</span>
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
							onchange={(e) => updateLightingType((e.target as HTMLSelectElement).value as LightingType)}
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
						<label for="light-intensity" class="w-16 shrink-0 text-xs text-gray-400">Intensity</label>
						<input
							id="light-intensity"
							type="range" min="0" max="1" step="0.01"
							value={selectedEvent.frame.lighting?.intensity ?? 1}
							oninput={(e) => updateLightingIntensity(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="Lighting intensity"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{(selectedEvent.frame.lighting?.intensity ?? 1).toFixed(2)}</span>
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
							type="range" min="0" max="1" step="0.01"
							value={selectedEvent.frame.fx?.bloom ?? 0}
							oninput={(e) => updateFXBloom(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="FX bloom"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{(selectedEvent.frame.fx?.bloom ?? 0).toFixed(2)}</span>
					</div>
					<!-- Motion Blur -->
					<div class="flex items-center gap-2">
						<label for="fx-blur" class="w-16 shrink-0 text-xs text-gray-400">Blur</label>
						<input
							id="fx-blur"
							type="range" min="0" max="1" step="0.01"
							value={selectedEvent.frame.fx?.motion_blur ?? 0}
							oninput={(e) => updateFXMotionBlur(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="FX motion blur"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{(selectedEvent.frame.fx?.motion_blur ?? 0).toFixed(2)}</span>
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
							type="range" min="0" max="1" step="0.01"
							value={selectedEvent.frame.controlnet?.strength ?? 1}
							oninput={(e) => updateControlNetStrength(parseFloat((e.target as HTMLInputElement).value))}
							class="flex-1"
							aria-label="ControlNet strength"
						/>
						<span class="w-8 text-right text-xs tabular-nums">{(selectedEvent.frame.controlnet?.strength ?? 1).toFixed(2)}</span>
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
								{getCharacterName(actor.id)} <span class="font-normal text-gray-400">({actor.id})</span>
							</div>
							<!-- Speech -->
							<div class="flex flex-col gap-1">
								<label class="text-xs text-gray-400">Speech text</label>
								<textarea
									value={actor.speech?.text ?? ''}
									oninput={(e) => updateActorSpeechText(actorIdx, (e.target as HTMLTextAreaElement).value)}
									rows={2}
									class="w-full rounded border border-gray-200 px-1 py-0.5 text-xs"
									aria-label={`Speech text for ${actor.id}`}
								></textarea>
								<!-- Mood -->
								<div class="flex items-center gap-2">
									<label for="mood-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400">Mood</label>
									<select
										id="mood-{actor.id}"
										value={actor.speech?.mood ?? ''}
										onchange={(e) => updateActorSpeechMood(actorIdx, (e.target as HTMLSelectElement).value)}
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
										onchange={(e) => updateActorSpeechLipSync(actorIdx, (e.target as HTMLInputElement).checked)}
										aria-label={`Lip sync for ${actor.id}`}
									/>
									<label for="lipsync-{actor.id}" class="text-xs text-gray-500">Lip sync</label>
								</div>
								<!-- Volume -->
								<div class="flex items-center gap-2">
									<label for="speech-vol-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400">Vol</label>
									<input
										id="speech-vol-{actor.id}"
										type="range" min="0" max="2" step="0.01"
										value={actor.speech?.volume ?? 1}
										oninput={(e) => updateActorSpeechVolume(actorIdx, parseFloat((e.target as HTMLInputElement).value))}
										class="flex-1"
										aria-label={`Volume for ${actor.id}`}
									/>
									<span class="w-8 text-right text-xs tabular-nums">{(actor.speech?.volume ?? 1).toFixed(2)}</span>
								</div>
								<!-- Pitch -->
								<div class="flex items-center gap-2">
									<label for="speech-pitch-{actor.id}" class="w-10 shrink-0 text-xs text-gray-400">Pitch</label>
									<input
										id="speech-pitch-{actor.id}"
										type="range" min="-12" max="12" step="0.5"
										value={actor.speech?.pitch_shift ?? 0}
										oninput={(e) => updateActorSpeechPitch(actorIdx, parseFloat((e.target as HTMLInputElement).value))}
										class="flex-1"
										aria-label={`Pitch shift for ${actor.id}`}
									/>
									<span class="w-8 text-right text-xs tabular-nums">{(actor.speech?.pitch_shift ?? 0).toFixed(1)}</span>
								</div>
							</div>
						</div>
					{/each}
				</section>
			{/if}
		</div>

	{:else}
		<!-- Nothing selected -->
		<div class="text-xs text-gray-400" aria-label="No selection">
			Select a timeline event or an asset to view its properties.
		</div>
	{/if}
</div>
