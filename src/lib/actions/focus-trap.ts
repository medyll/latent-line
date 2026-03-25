/**
 * focus-trap Svelte action
 * Traps Tab/Shift+Tab within a container and focuses the first focusable element on mount.
 * Press Escape to optionally call an onEscape callback.
 */

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
	onEscape?: () => void;
}

export function focusTrap(node: HTMLElement, options: FocusTrapOptions = {}) {
	const getFocusable = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));

	// Focus first focusable element
	const first = getFocusable()[0];
	first?.focus();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			options.onEscape?.();
			return;
		}
		if (e.key !== 'Tab') return;

		const focusable = getFocusable();
		if (!focusable.length) return;

		const firstEl = focusable[0];
		const lastEl = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === firstEl) {
				e.preventDefault();
				lastEl.focus();
			}
		} else {
			if (document.activeElement === lastEl) {
				e.preventDefault();
				firstEl.focus();
			}
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		update(newOptions: FocusTrapOptions) {
			options = newOptions;
		},
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
