import { describe, it, expect } from 'vitest';
import { matchesShortcut, resolveAction, SHORTCUTS } from './keyboard';

function key(k: string, opts: { ctrl?: boolean; shift?: boolean } = {}): KeyboardEvent {
	return {
		key: k,
		ctrlKey: opts.ctrl ?? false,
		metaKey: false,
		shiftKey: opts.shift ?? false,
		preventDefault: () => {}
	} as unknown as KeyboardEvent;
}

describe('matchesShortcut (S13-02)', () => {
	it('matches Ctrl+Z for undo', () => {
		const shortcut = SHORTCUTS.find((s) => s.action === 'undo' && !s.shift)!;
		expect(matchesShortcut(key('z', { ctrl: true }), shortcut)).toBe(true);
	});

	it('does not match Ctrl+Z when shift is pressed', () => {
		const shortcut = SHORTCUTS.find((s) => s.action === 'undo')!;
		expect(matchesShortcut(key('z', { ctrl: true, shift: true }), shortcut)).toBe(false);
	});

	it('matches Ctrl+Y for redo', () => {
		const shortcut = SHORTCUTS.find((s) => s.action === 'redo' && s.key === 'y')!;
		expect(matchesShortcut(key('y', { ctrl: true }), shortcut)).toBe(true);
	});

	it('does not match plain Z (no ctrl)', () => {
		const shortcut = SHORTCUTS.find((s) => s.action === 'undo')!;
		expect(matchesShortcut(key('z'), shortcut)).toBe(false);
	});
});

describe('resolveAction (S13-02)', () => {
	it('resolves Ctrl+Z → undo', () => {
		expect(resolveAction(key('z', { ctrl: true }))).toBe('undo');
	});

	it('resolves Ctrl+Shift+Z → redo', () => {
		expect(resolveAction(key('z', { ctrl: true, shift: true }))).toBe('redo');
	});

	it('resolves Ctrl+Y → redo', () => {
		expect(resolveAction(key('y', { ctrl: true }))).toBe('redo');
	});

	it('resolves Ctrl+I → toggleInspector', () => {
		expect(resolveAction(key('i', { ctrl: true }))).toBe('toggleInspector');
	});

	it('resolves Space → playPause', () => {
		expect(resolveAction(key(' '))).toBe('playPause');
	});

	it('resolves Escape → stop', () => {
		expect(resolveAction(key('Escape'))).toBe('stop');
	});

	it('returns null for unknown key', () => {
		expect(resolveAction(key('q', { ctrl: true }))).toBeNull();
	});

	it('all shortcuts have unique action+chord combinations', () => {
		const seen = new Set<string>();
		for (const s of SHORTCUTS) {
			const chord = `${s.ctrl ? 'C' : ''}${s.shift ? 'S' : ''}+${s.key}`;
			expect(seen.has(chord)).toBe(false);
			seen.add(chord);
		}
	});
});
