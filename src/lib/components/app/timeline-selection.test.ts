import { describe, it, expect } from 'vitest';

describe('Timeline Selection Logic', () => {
	/**
	 * Simulates timeline event selection state management
	 */
	function simulateTimelineSelection() {
		let selectedEventId: string | null = null;

		function selectEvent(eventId: string) {
			// Toggle selection: clicking same event deselects it
			selectedEventId = selectedEventId === eventId ? null : eventId;
		}

		function isSelected(eventId: string): boolean {
			return selectedEventId === eventId;
		}

		return { selectEvent, isSelected, getSelectedId: () => selectedEventId };
	}

	describe('Event Selection', () => {
		it('should select an event when clicked', () => {
			const { selectEvent, isSelected } = simulateTimelineSelection();

			selectEvent('event_1');

			expect(isSelected('event_1')).toBe(true);
			expect(isSelected('event_2')).toBe(false);
		});

		it('should deselect an event when clicked again', () => {
			const { selectEvent, isSelected } = simulateTimelineSelection();

			selectEvent('event_1');
			expect(isSelected('event_1')).toBe(true);

			selectEvent('event_1');
			expect(isSelected('event_1')).toBe(false);
		});

		it('should switch selection from one event to another', () => {
			const { selectEvent, isSelected } = simulateTimelineSelection();

			selectEvent('event_1');
			expect(isSelected('event_1')).toBe(true);

			selectEvent('event_2');
			expect(isSelected('event_1')).toBe(false);
			expect(isSelected('event_2')).toBe(true);
		});

		it('should start with no selection', () => {
			const { getSelectedId } = simulateTimelineSelection();
			expect(getSelectedId()).toBeNull();
		});

		it('should handle multiple rapid selections', () => {
			const { selectEvent, getSelectedId } = simulateTimelineSelection();

			selectEvent('event_1');
			selectEvent('event_2');
			selectEvent('event_3');
			selectEvent('event_3'); // deselect

			expect(getSelectedId()).toBeNull();
		});
	});

	describe('Selection Display State', () => {
		interface TimelineEvent {
			id: string;
			label: string;
		}

		function computeEventClasses(eventId: string, selectedId: string | null): string[] {
			const classes: string[] = [];

			if (selectedId === eventId) {
				classes.push('ring-2', 'ring-blue-500', 'bg-blue-50');
			} else {
				classes.push('bg-white', 'hover:shadow-lg');
			}

			return classes;
		}

		it('should apply selected classes to active event', () => {
			const classes = computeEventClasses('event_1', 'event_1');
			expect(classes).toContain('ring-2');
			expect(classes).toContain('ring-blue-500');
			expect(classes).toContain('bg-blue-50');
		});

		it('should apply default classes to unselected events', () => {
			const classes = computeEventClasses('event_1', 'event_2');
			expect(classes).toContain('bg-white');
			expect(classes).toContain('hover:shadow-lg');
			expect(classes).not.toContain('ring-2');
		});

		it('should apply default classes when nothing is selected', () => {
			const classes = computeEventClasses('event_1', null);
			expect(classes).toContain('bg-white');
			expect(classes).not.toContain('ring-blue-500');
		});
	});

	describe('Selection with Timeline Events', () => {
		interface ExtendedTimelineEvent {
			id: string;
			label: string;
			start: number;
			end: number;
			timelineFrame?: any;
		}

		function findEventById(events: ExtendedTimelineEvent[], id: string): ExtendedTimelineEvent | null {
			return events.find((e) => e.id === id) || null;
		}

		it('should find selected event from timeline array', () => {
			const events: ExtendedTimelineEvent[] = [
				{ id: 'event_1', label: 'Event 1', start: 0, end: 10 },
				{ id: 'event_2', label: 'Event 2', start: 10, end: 20 }
			];

			const selectedId = 'event_1';
			const selected = findEventById(events, selectedId);

			expect(selected).toBeTruthy();
			expect(selected?.label).toBe('Event 1');
		});

		it('should return null when event not found', () => {
			const events: ExtendedTimelineEvent[] = [
				{ id: 'event_1', label: 'Event 1', start: 0, end: 10 }
			];

			const selected = findEventById(events, 'event_999');
			expect(selected).toBeNull();
		});

		it('should work with empty timeline', () => {
			const selected = findEventById([], 'event_1');
			expect(selected).toBeNull();
		});
	});
});
