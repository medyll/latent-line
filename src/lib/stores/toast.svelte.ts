/**
 * Toast notification store.
 * Usage: toast.success('Saved!') / toast.error('Failed') / toast.info('...')
 */

export interface ToastItem {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	duration: number;
}

function createToastStore() {
	let items = $state<ToastItem[]>([]);

	function add(message: string, type: ToastItem['type'] = 'info', duration = 3000) {
		const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		items = [...items, { id, type, message, duration }];
		setTimeout(() => remove(id), duration);
	}

	function remove(id: string) {
		items = items.filter((t) => t.id !== id);
	}

	return {
		get items() {
			return items;
		},
		success: (msg: string, duration?: number) => add(msg, 'success', duration),
		error: (msg: string, duration?: number) => add(msg, 'error', duration),
		info: (msg: string, duration?: number) => add(msg, 'info', duration),
		warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
		remove
	};
}

export const toast = createToastStore();
