/**
 * shortcuts-config.ts
 *
 * Keyboard shortcuts configuration and management.
 * Supports customization, presets, and conflict detection.
 */

export interface ShortcutConfig {
	[action: string]: string;
}

export interface ShortcutPreset {
	name: string;
	shortcuts: ShortcutConfig;
}

// Default shortcuts
export const DEFAULT_SHORTCUTS: ShortcutConfig = {
	// File operations
	'file.save': 'Ctrl+S',
	'file.export': 'Ctrl+E',
	'file.import': 'Ctrl+I',
	
	// Editing
	'edit.undo': 'Ctrl+Z',
	'edit.redo': 'Ctrl+Y',
	'edit.duplicate': 'Ctrl+D',
	'edit.delete': 'Delete',
	'edit.select-all': 'Ctrl+A',
	
	// Playback
	'playback.play-pause': 'Space',
	'playback.stop': 'Escape',
	'playback.go-to-start': 'Home',
	'playback.go-to-end': 'End',
	
	// Navigation
	'nav.search': 'Ctrl+F',
	'nav.zoom-in': 'Ctrl+=',
	'nav.zoom-out': 'Ctrl+-',
	'nav.reset-zoom': 'Ctrl+0',
	
	// View
	'view.toggle-inspector': 'Ctrl+I',
	'view.toggle-settings': 'Ctrl+,',
	'view.toggle-help': 'F1',
	
	// Timeline
	'timeline.add-event': 'N',
	'timeline.split-event': 'Ctrl+K',
	'timeline.snap-to-grid': 'Ctrl+Shift+G'
};

// Preset configurations
export const SHORTCUT_PRESETS: ShortcutPreset[] = [
	{
		name: 'Default',
		shortcuts: DEFAULT_SHORTCUTS
	},
	{
		name: 'Vim-style',
		shortcuts: {
			...DEFAULT_SHORTCUTS,
			'playback.play-pause': 'K',
			'playback.stop': 'H',
			'nav.zoom-in': 'L',
			'nav.zoom-out': 'H'
		}
	},
	{
		name: 'Blender-style',
		shortcuts: {
			...DEFAULT_SHORTCUTS,
			'edit.duplicate': 'Shift+D',
			'edit.delete': 'X',
			'playback.play-pause': 'Space',
			'nav.search': 'F3'
		}
	},
	{
		name: 'Adobe-style',
		shortcuts: {
			...DEFAULT_SHORTCUTS,
			'edit.undo': 'Ctrl+Alt+Z',
			'playback.play-pause': 'L',
			'playback.stop': 'K',
			'nav.search': 'Ctrl+Shift+F'
		}
	}
];

/**
 * Parse keyboard shortcut string to normalized format
 */
export function parseShortcut(shortcut: string): string {
	const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
	const modifiers: string[] = [];
	const key = parts.pop();
	
	// Collect modifiers
	parts.forEach(p => {
		if (p === 'ctrl' || p === 'control') modifiers.push('Ctrl');
		else if (p === 'alt') modifiers.push('Alt');
		else if (p === 'shift') modifiers.push('Shift');
		else if (p === 'meta' || p === 'cmd' || p === 'command') modifiers.push('Meta');
	});
	
	// Normalize key
	const normalizedKey = key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
	
	return [...modifiers, normalizedKey].join('+');
}

/**
 * Check if two shortcuts conflict
 */
export function shortcutsConflict(shortcut1: string, shortcut2: string): boolean {
	return parseShortcut(shortcut1) === parseShortcut(shortcut2);
}

/**
 * Detect conflicts in shortcut configuration
 */
export function detectConflicts(config: ShortcutConfig): Array<{
	action1: string;
	action2: string;
	shortcut: string;
}> {
	const conflicts: Array<{ action1: string; action2: string; shortcut: string }> = [];
	const shortcutMap = new Map<string, string>();
	
	Object.entries(config).forEach(([action, shortcut]) => {
		const normalized = parseShortcut(shortcut);
		const existing = shortcutMap.get(normalized);
		
		if (existing) {
			conflicts.push({
				action1: existing,
				action2: action,
				shortcut: normalized
			});
		} else {
			shortcutMap.set(normalized, action);
		}
	});
	
	return conflicts;
}

/**
 * Validate shortcut format
 */
export function isValidShortcut(shortcut: string): boolean {
	const pattern = /^(Ctrl\+)?(Alt\+)?(Shift\+)?(Meta\+)?[A-Z0-9]+$/;
	return pattern.test(parseShortcut(shortcut));
}

/**
 * Load shortcuts from localStorage
 */
export function loadShortcuts(): ShortcutConfig {
	try {
		const stored = localStorage.getItem('latent-line:shortcuts');
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {
		// Ignore storage errors
	}
	return { ...DEFAULT_SHORTCUTS };
}

/**
 * Save shortcuts to localStorage
 */
export function saveShortcuts(config: ShortcutConfig): void {
	try {
		localStorage.setItem('latent-line:shortcuts', JSON.stringify(config));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Load preset by name
 */
export function loadPreset(name: string): ShortcutConfig {
	const preset = SHORTCUT_PRESETS.find(p => p.name === name);
	if (preset) {
		return { ...preset.shortcuts };
	}
	return { ...DEFAULT_SHORTCUTS };
}

/**
 * Export shortcuts as JSON
 */
export function exportShortcuts(config: ShortcutConfig): string {
	return JSON.stringify(config, null, 2);
}

/**
 * Import shortcuts from JSON
 */
export function importShortcuts(json: string): ShortcutConfig | null {
	try {
		const config = JSON.parse(json);
		if (typeof config === 'object' && config !== null) {
			return config;
		}
	} catch {
		// Invalid JSON
	}
	return null;
}

/**
 * Get human-readable shortcut description
 */
export function formatShortcut(shortcut: string): string {
	return parseShortcut(shortcut)
		.replace('Ctrl', '⌃')
		.replace('Alt', '⌥')
		.replace('Shift', '⇧')
		.replace('Meta', '⌘');
}
