import { resolveAction } from '$lib/utils/keyboard';

interface KeybindingCallbacks {
	undo: () => void;
	redo: () => void;
	toggleInspector: () => void;
	deleteSelected?: () => void;
}

/**
 * createKeybindingHandler — returns an onKeydown handler wired to app actions.
 * Uses the central SHORTCUTS registry from keyboard.ts.
 */
export function createKeybindingHandler(callbacks: KeybindingCallbacks) {
	return function onKeydown(e: KeyboardEvent) {
		const action = resolveAction(e);
		if (!action) return;
		switch (action) {
			case 'undo':            e.preventDefault(); callbacks.undo(); break;
			case 'redo':            e.preventDefault(); callbacks.redo(); break;
			case 'toggleInspector': e.preventDefault(); callbacks.toggleInspector(); break;
			case 'delete':          e.preventDefault(); callbacks.deleteSelected?.(); break;
		}
	};
}
