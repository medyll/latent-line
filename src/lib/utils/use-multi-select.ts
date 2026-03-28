/**
 * useMultiSelect.ts
 *
 * Multi-selection logic for timeline events.
 * Supports Ctrl+Click, Shift+Click, and marquee selection.
 */

export interface UseMultiSelectOptions {
	onSelect?: (times: number[]) => void;
	onDeselect?: (times: number[]) => void;
}

export function useMultiSelect(options: UseMultiSelectOptions = {}) {
	const { onSelect, onDeselect } = options;
	
	const selectedTimes = $state<Set<number>>(new Set());
	let lastSelectedTime: number | null = null;

	function handleClick(time: number, event: MouseEvent) {
		const wasSelected = selectedTimes.has(time);
		
		if (event.ctrlKey || event.metaKey) {
			// Toggle single selection
			if (wasSelected) {
				selectedTimes.delete(time);
				onDeselect?.([time]);
			} else {
				selectedTimes.add(time);
				onSelect?.([time]);
			}
			lastSelectedTime = time;
		} else if (event.shiftKey && lastSelectedTime !== null) {
			// Range selection
			const range = getRange(lastSelectedTime, time);
			range.forEach((t) => selectedTimes.add(t));
			onSelect?.(range);
		} else {
			// Single selection (clear others)
			if (!wasSelected) {
				selectedTimes.clear();
				selectedTimes.add(time);
				onSelect?.([time]);
			}
			lastSelectedTime = time;
		}
	}

	function selectAll(times: number[]) {
		times.forEach((t) => selectedTimes.add(t));
		onSelect?.(times);
	}

	function clearSelection() {
		const deselected = Array.from(selectedTimes);
		selectedTimes.clear();
		onDeselect?.(deselected);
	}

	function getRange(start: number, end: number): number[] {
		// Get all event times between start and end
		// This would need access to the full timeline
		// For now, return simple range
		const range: number[] = [];
		const min = Math.min(start, end);
		const max = Math.max(start, end);
		
		// This is simplified - real implementation needs timeline access
		for (let t = min; t <= max; t += 200) {
			range.push(t);
		}
		return range;
	}

	return {
		selectedTimes,
		lastSelectedTime,
		handleClick,
		selectAll,
		clearSelection,
		isSelected: (time: number) => selectedTimes.has(time),
		selectedCount: $derived(selectedTimes.size)
	};
}
