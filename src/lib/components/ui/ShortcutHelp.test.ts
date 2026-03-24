import { describe, it, expect } from 'vitest';
import { SHORTCUTS } from '$lib/utils/keyboard';

describe('Shortcut registry', () => {
	it('contains toggleShortcuts mapping', () => {
		expect(SHORTCUTS.some((s) => s.action === 'toggleShortcuts')).toBe(true);
	});
});
