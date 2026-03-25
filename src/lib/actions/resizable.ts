/**
 * resizable Svelte action — adds a drag handle to resize a panel.
 *
 * Usage:
 *   <div use:resizable={{ key: 'left-panel', defaultWidth: 260, min: 160, max: 500 }}>
 *
 * A `col-resize` handle is injected at the right edge of the element.
 * Width is persisted to localStorage under `latent-line:layout`.
 */

const STORAGE_KEY = 'latent-line:layout';

function loadLayout(): Record<string, number> {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
	} catch {
		return {};
	}
}

function saveLayout(data: Record<string, number>) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {}
}

export interface ResizableOptions {
	key: string;
	defaultWidth: number;
	min?: number;
	max?: number;
	side?: 'right' | 'left';
}

export function resizable(node: HTMLElement, options: ResizableOptions) {
	const { key, defaultWidth, min = 160, max = 800, side = 'right' } = options;

	// Apply persisted or default width
	const layout = loadLayout();
	const initial = layout[key] ?? defaultWidth;
	node.style.width = `${initial}px`;
	node.style.flexShrink = '0';
	node.style.flexGrow = '0';

	// Create handle
	const handle = document.createElement('div');
	handle.setAttribute('aria-hidden', 'true');
	handle.style.cssText = `
		position:absolute;
		top:0;bottom:0;
		${side === 'right' ? 'right:-3px' : 'left:-3px'};
		width:6px;
		cursor:col-resize;
		z-index:50;
		background:transparent;
	`;
	handle.addEventListener('mouseenter', () => {
		handle.style.background = 'var(--color-primary)';
		handle.style.opacity = '0.3';
	});
	handle.addEventListener('mouseleave', () => {
		handle.style.background = 'transparent';
	});

	// Ensure node is positioned
	if (getComputedStyle(node).position === 'static') {
		node.style.position = 'relative';
	}
	node.appendChild(handle);

	let startX = 0;
	let startWidth = 0;

	function onPointerMove(e: PointerEvent) {
		const delta = side === 'right' ? e.clientX - startX : startX - e.clientX;
		const newWidth = Math.min(max, Math.max(min, startWidth + delta));
		node.style.width = `${newWidth}px`;
	}

	function onPointerUp(e: PointerEvent) {
		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		handle.releasePointerCapture(e.pointerId);
		const w = parseInt(node.style.width, 10);
		const data = loadLayout();
		data[key] = w;
		saveLayout(data);
	}

	function onPointerDown(e: PointerEvent) {
		e.preventDefault();
		startX = e.clientX;
		startWidth = node.offsetWidth;
		handle.setPointerCapture(e.pointerId);
		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
	}

	function onDblClick() {
		node.style.width = `${defaultWidth}px`;
		const data = loadLayout();
		data[key] = defaultWidth;
		saveLayout(data);
	}

	handle.addEventListener('pointerdown', onPointerDown);
	handle.addEventListener('dblclick', onDblClick);

	return {
		destroy() {
			handle.removeEventListener('pointerdown', onPointerDown);
			handle.removeEventListener('dblclick', onDblClick);
			handle.remove();
		}
	};
}
