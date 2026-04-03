/**
 * Tooltip Registry
 * Maps actions to tooltip content with shortcut hints.
 */

export interface ShortcutMap {
	[key: string]: string;
}

// Default shortcut hints
const DEFAULT_SHORTCUTS: ShortcutMap = {
	save: 'Ctrl+S',
	export: 'Ctrl+E',
	import: 'Ctrl+I',
	undo: 'Ctrl+Z',
	redo: 'Ctrl+Y',
	duplicate: 'Ctrl+D',
	delete: 'Delete',
	play: 'Space',
	pause: 'Space',
	stop: 'Escape',
	search: 'Ctrl+F',
	settings: 'Ctrl+,',
	inspector: 'Ctrl+I',
	help: 'F1',
	addEvent: 'N',
	splitEvent: 'Ctrl+K',
	zoomIn: 'Ctrl++',
	zoomOut: 'Ctrl+-',
	marker: 'M'
};

/**
 * Get tooltip content with shortcut hint
 */
export function getTooltipText(action: string, customShortcuts?: ShortcutMap): string {
	const shortcuts = { ...DEFAULT_SHORTCUTS, ...customShortcuts };
	const shortcut = shortcuts[action];
	const label = formatActionLabel(action);

	if (shortcut) {
		return `${label} (${shortcut})`;
	}
	return label;
}

/**
 * Format action key to readable label
 */
function formatActionLabel(action: string): string {
	return action
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (s) => s.toUpperCase())
		.trim();
}

/**
 * Register custom shortcuts
 */
export function registerShortcuts(shortcuts: ShortcutMap): void {
	Object.assign(DEFAULT_SHORTCUTS, shortcuts);
}

/**
 * Get all registered shortcuts
 */
export function getAllShortcuts(): ShortcutMap {
	return { ...DEFAULT_SHORTCUTS };
}
