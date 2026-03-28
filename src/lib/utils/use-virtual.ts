/**
 * useVirtual.ts
 *
 * Custom virtual scrolling hook for Svelte 5.
 * Lightweight alternative to @tanstack/virtual for Svelte.
 */

export interface VirtualItem {
	index: number;
	start: number;
	end: number;
	size: number;
}

export interface UseVirtualOptions {
	count: number;
	estimateSize: (index: number) => number;
	overscan?: number;
}

export function useVirtual(options: UseVirtualOptions) {
	const { count, estimateSize, overscan = 5 } = options;
	
	let scrollOffset = $state(0);
	let scrollSize = $state(0);
	
	// Calculate total size
	const totalSize = $derived(() => {
		let size = 0;
		for (let i = 0; i < count; i++) {
			size += estimateSize(i);
		}
		return size;
	});
	
	// Calculate visible range
	const virtualItems = $derived(() => {
		const items: VirtualItem[] = [];
		
		// Find start index
		let accumulatedSize = 0;
		let startIndex = 0;
		
		for (let i = 0; i < count; i++) {
			const size = estimateSize(i);
			if (accumulatedSize + size >= scrollOffset - (overscan * estimateSize(0))) {
				startIndex = Math.max(0, i - overscan);
				break;
			}
			accumulatedSize += size;
		}
		
		// Calculate items to render
		accumulatedSize = 0;
		for (let i = 0; i < startIndex; i++) {
			accumulatedSize += estimateSize(i);
		}
		
		const endIndex = Math.min(count, startIndex + Math.ceil(scrollSize / estimateSize(0)) + overscan * 2);
		
		for (let i = startIndex; i < endIndex; i++) {
			const size = estimateSize(i);
			items.push({
				index: i,
				start: accumulatedSize,
				end: accumulatedSize + size,
				size
			});
			accumulatedSize += size;
		}
		
		return items;
	});
	
	function setScroll(offset: number, size: number) {
		scrollOffset = offset;
		scrollSize = size;
	}
	
	return {
		virtualItems,
		totalSize,
		setScroll
	};
}
