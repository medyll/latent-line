/**
 * Central keyboard shortcut registry for latent-line.
 * Each entry maps a chord to an action label and description.
 */

export interface Shortcut {
	key: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	action: string;
	description: string;
}

export const SHORTCUTS: Shortcut[] = [
	{ key: 'z', ctrl: true, shift: false, action: 'undo', description: 'Undo last change' },
	{ key: 'y', ctrl: true, action: 'redo', description: 'Redo last undone change' },
	{ key: 'z', ctrl: true, shift: true, action: 'redo', description: 'Redo last undone change' },
	{ key: 'i', ctrl: true, action: 'toggleInspector', description: 'Toggle Model Inspector' },
	{ key: ' ', action: 'playPause', description: 'Play / Pause timeline' },
	{ key: 'Escape', action: 'stop', description: 'Stop playback / close panel' },
	{ key: '0', action: 'stop', description: 'Stop playback and reset' },
	{ key: 'Delete', action: 'delete', description: 'Delete selected timeline event' }
];

/**
 * Returns true if the keyboard event matches the given shortcut definition.
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: Shortcut): boolean {
	const ctrlOrMeta = e.ctrlKey || e.metaKey;
	if (shortcut.ctrl && !ctrlOrMeta) return false;
	if (!shortcut.ctrl && ctrlOrMeta) return false;
	if (shortcut.shift !== undefined && e.shiftKey !== shortcut.shift) return false;
	return e.key === shortcut.key;
}

/**
 * Find the action name for the given keyboard event, or null.
 */
export function resolveAction(e: KeyboardEvent): string | null {
	// redo: Ctrl+Z+Shift matches before plain Ctrl+Z — check shift variants first
	const sorted = [...SHORTCUTS].sort((a) => (a.shift ? -1 : 1));
	return sorted.find((s) => matchesShortcut(e, s))?.action ?? null;
}
