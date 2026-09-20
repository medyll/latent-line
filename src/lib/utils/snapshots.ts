import { serializeModel, deserializeModel } from './export-import';
import type { Model } from '$lib/model/model-types';

const SNAPSHOT_KEY = 'latent-line:snapshots:v1';
const MAX_SNAPSHOTS = 100;

/** A saved copy of the document, held as serialized JSON. */
export interface Snapshot {
	id: string;
	name: string;
	timestamp: string; // ISO
	json: string; // serialized model JSON
}

function readSnapshots(): Snapshot[] {
	try {
		const raw = localStorage.getItem(SNAPSHOT_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as Snapshot[];
	} catch {
		return [];
	}
}

function writeSnapshots(list: Snapshot[]) {
	try {
		localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
	} catch {
		// ignore storage errors
	}
}

/** All stored snapshots, newest first. */
export function listSnapshots(): Snapshot[] {
	return readSnapshots();
}

/**
 * Serializes and stores the model as a new snapshot.
 *
 * Fails without storing anything when the model does not validate. Only the most
 * recent 100 snapshots are kept; older ones fall off the end.
 */
export function saveSnapshot(
	model: unknown,
	name?: string
): { success: true; snapshot: Snapshot } | { success: false; errors: string[] } {
	const ser = serializeModel(model);
	if (!ser.success) return { success: false, errors: ser.errors };
	const now = new Date();
	const defaultName = `Snapshot ${now.toISOString()}`;
	const snap: Snapshot = {
		id: String(now.getTime()),
		name: name ?? defaultName,
		timestamp: now.toISOString(),
		json: ser.json
	};
	const list = readSnapshots();
	list.unshift(snap);
	if (list.length > MAX_SNAPSHOTS) list.length = MAX_SNAPSHOTS;
	writeSnapshots(list);
	return { success: true, snapshot: snap };
}

/** Deletes a snapshot. Returns false when no snapshot has that id. */
export function deleteSnapshot(id: string): boolean {
	const list = readSnapshots();
	const idx = list.findIndex((s) => s.id === id);
	if (idx === -1) return false;
	list.splice(idx, 1);
	writeSnapshots(list);
	return true;
}

/** Looks a snapshot up by id. */
export function getSnapshot(id: string): Snapshot | undefined {
	return readSnapshots().find((s) => s.id === id);
}

/** Parses a snapshot back into a model. Fails when it is missing or no longer valid. */
export function restoreSnapshot(
	id: string
): { success: true; model: Model } | { success: false; errors: string[] } {
	const snap = getSnapshot(id);
	if (!snap) return { success: false, errors: ['Snapshot not found'] };
	const result = deserializeModel(snap.json);
	if (result.success) {
		return { success: true, model: result.data };
	}
	return { success: false, errors: result.errors };
}
