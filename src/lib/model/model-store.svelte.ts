import { onMount } from 'svelte';
import type { Model, TimelineMarker } from '$lib/model/model-types';
import { createMarker } from '$lib/model/marker-types';
import exampleModel from '$lib/model/model-example';
import {
	loadModelFromLocalStorage,
	saveModelToLocalStorage,
	createDebouncedSave
} from '$lib/utils/persistence';
import { createModelHistory } from '$lib/context/history.svelte';
import { chunkModel, loadChunks, type LoadProgress } from '$lib/utils/model-chunker';

/**
 * createModelStore — Svelte 5 external reactive store for the app model.
 *
 * Must be called during component initialisation (top-level <script>) so that
 * $effect and onMount are bound to the correct component lifecycle.
 *
 * Encapsulates:
 *  - reactive $state<Model>
 *  - auto-snapshot on change (undo history)
 *  - persistence to localStorage
 *  - SSR-safe hydration via onMount
 *  - undo / redo
 */
export function createModelStore() {
	const model = $state<Model>(structuredClone(exampleModel));
	const history = createModelHistory();
	const saveStatus = $state({ value: 'saved' as 'saved' | 'unsaved' | 'saving' });
	const debouncedSave = createDebouncedSave(saveModelToLocalStorage, 500);
	
	// Chunked loading state
	let isLoadingLarge = $state(false);
	let loadProgress = $state<LoadProgress | null>(null);
	let chunkSize = $state(100); // Default: 100 events per chunk

	let previousJson = JSON.stringify(model);
	let isApplyingSnapshot = false;

	function applySnapshot(snapshot: Model) {
		isApplyingSnapshot = true;
		Object.assign(model.project, snapshot.project);
		model.assets.characters = snapshot.assets.characters;
		model.assets.environments = snapshot.assets.environments;
		model.assets.audio = snapshot.assets.audio;
		// Mutate array in place to preserve reactivity references held by child components
		model.timeline.length = 0;
		model.timeline.push(...snapshot.timeline);
		model.config = snapshot.config;
		previousJson = JSON.stringify(snapshot);
	}

	// Auto-snapshot: push old state to history whenever model changes
	$effect(() => {
		const currentJson = JSON.stringify(model);
		if (!isApplyingSnapshot && currentJson !== previousJson) {
			history.push(JSON.parse(previousJson) as Model);
			previousJson = currentJson;
		}
		isApplyingSnapshot = false;
	});

	// Persist model to localStorage with 500ms debounce
	$effect(() => {
		const _ = JSON.stringify(model);
		if (!isApplyingSnapshot) {
			saveStatus.value = 'unsaved';
			debouncedSave.schedule(model);
			saveStatus.value = 'saved';
		}
	});

	// Load persisted model on client only (localStorage unavailable during SSR)
	onMount(() => {
		const saved = loadModelFromLocalStorage();
		if (saved) applySnapshot(saved);
		// Flush pending save before page unload to prevent data loss
		window.addEventListener('beforeunload', () => debouncedSave.flush());
	});

	function undo() {
		const prev = history.undo(JSON.parse(JSON.stringify(model)) as Model);
		if (prev) applySnapshot(prev);
	}

	function redo() {
		const next = history.redo(JSON.parse(JSON.stringify(model)) as Model);
		if (next) applySnapshot(next);
	}

	// Marker CRUD operations
	function addMarker(marker: TimelineMarker): void {
		model.markers = [...(model.markers ?? []), marker];
	}

	function updateMarker(id: string, updates: Partial<TimelineMarker>): void {
		model.markers = (model.markers ?? []).map((m) =>
			m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
		);
	}

	function deleteMarker(id: string): void {
		model.markers = (model.markers ?? []).filter((m) => m.id !== id);
	}

	function getMarkerAtTime(time: number, tolerance = 100): TimelineMarker | undefined {
		return (model.markers ?? []).find((m) => Math.abs(m.time - time) < tolerance);
	}
	
	/**
	 * Load a large model progressively in chunks
	 * Prevents UI freeze when loading 1000+ events
	 */
	async function loadLargeModel(newModel: Model, size: number = chunkSize): Promise<void> {
		isLoadingLarge = true;
		loadProgress = null;
		
		// Split model into chunks
		const chunked = chunkModel(newModel, size);
		
		// Load chunks progressively
		const allEvents = await loadChunks(chunked, (progress) => {
			loadProgress = progress;
		});
		
		// Final update with all events
		model.timeline = allEvents;
		isLoadingLarge = false;
		loadProgress = null;
	}
	
	/**
	 * Check if a model is large enough to warrant chunked loading
	 */
	function isLargeModel(newModel: Model): boolean {
		return (newModel.timeline?.length || 0) > 200;
	}

	return { 
		model, 
		history, 
		undo, 
		redo, 
		saveStatus, 
		addMarker, 
		updateMarker, 
		deleteMarker, 
		getMarkerAtTime,
		loadLargeModel,
		isLargeModel,
		isLoadingLarge,
		loadProgress,
		chunkSize
	};
}
