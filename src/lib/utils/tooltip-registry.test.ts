import { describe, it, expect } from 'vitest';
import {
	getTooltipText,
	registerShortcuts,
	getAllShortcuts
} from '$lib/utils/tooltip-registry';

describe('getTooltipText', () => {
	it('returns label with shortcut for known actions', () => {
		const text = getTooltipText('save');
		expect(text).toContain('Save');
		expect(text).toContain('Ctrl+S');
	});

	it('returns label without shortcut for unknown actions', () => {
		const text = getTooltipText('customAction');
		expect(text).toBe('Custom Action');
	});

	it('formats camelCase action labels', () => {
		const text = getTooltipText('addEvent');
		expect(text).toContain('Add Event');
	});
});

describe('registerShortcuts', () => {
	it('registers new shortcuts', () => {
		registerShortcuts({ custom: 'Ctrl+Shift+C' });
		const text = getTooltipText('custom');
		expect(text).toBe('Custom (Ctrl+Shift+C)');
	});

	it('overrides existing shortcuts', () => {
		registerShortcuts({ save: 'Cmd+S' });
		const text = getTooltipText('save');
		expect(text).toBe('Save (Cmd+S)');
		// Reset
		registerShortcuts({ save: 'Ctrl+S' });
	});
});

describe('getAllShortcuts', () => {
	it('returns copy of shortcuts', () => {
		const shortcuts = getAllShortcuts();
		expect(shortcuts.save).toBeDefined();
	});

	it('returns new object each time', () => {
		const s1 = getAllShortcuts();
		const s2 = getAllShortcuts();
		expect(s1).not.toBe(s2);
	});
});
