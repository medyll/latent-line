import type { TimelineEvent } from '$lib/model/model-types';

/**
 * Presentation mode state management
 * Handles keyboard navigation, playback timing, and fullscreen
 */

export interface PresentationState {
	currentIndex: number;
	isPlaying: boolean;
	progress: number; // 0-1 for current event display
	duration: number; // ms for current event
}

/**
 * Calculate duration in milliseconds for an event
 * Uses event.duration (in frames) or defaults to 3 seconds
 */
export function getEventDurationMs(event: TimelineEvent | null, fps: number = 24): number {
	if (!event) return 3000; // default: 3 seconds

	const frameDuration = event.duration || 1; // 1 frame minimum
	const durationMs = (frameDuration / fps) * 1000;

	// Clamp between 1 second and 30 seconds
	return Math.max(1000, Math.min(30000, durationMs));
}

/**
 * Keyboard event handler for presentation navigation
 * Returns the next state after handling the key press
 */
export function handlePresentationKeydown(
	key: string,
	currentState: PresentationState,
	totalEvents: number
): Partial<PresentationState> {
	const nextState: Partial<PresentationState> = {};

	switch (key.toLowerCase()) {
		case 'arrowleft':
			// Previous event
			if (currentState.currentIndex > 0) {
				nextState.currentIndex = currentState.currentIndex - 1;
				nextState.progress = 0;
				nextState.isPlaying = false; // pause on navigation
			}
			break;

		case 'arrowright':
			// Next event
			if (currentState.currentIndex < totalEvents - 1) {
				nextState.currentIndex = currentState.currentIndex + 1;
				nextState.progress = 0;
				nextState.isPlaying = false; // pause on navigation
			}
			break;

		case 'p':
			// Toggle playback
			nextState.isPlaying = !currentState.isPlaying;
			break;

		case ' ': // spacebar
			// Alternative play/pause toggle
			nextState.isPlaying = !currentState.isPlaying;
			break;

		case 'f':
			// Fullscreen toggle is handled in component (needs DOM context)
			break;

		case 'escape':
			// Exit presentation (handled in component)
			break;
	}

	return nextState;
}

/**
 * Calculate the next event index after auto-advance
 */
export function getNextEventIndex(
	currentIndex: number,
	totalEvents: number,
	stopAtEnd: boolean = true
): number {
	if (stopAtEnd && currentIndex >= totalEvents - 1) {
		return currentIndex; // pause at last event
	}

	if (currentIndex < totalEvents - 1) {
		return currentIndex + 1;
	}

	return 0; // loop back to start
}

/**
 * Format event for display in presentation mode
 */
export function formatEventForPresentation(event: TimelineEvent | null) {
	if (!event) {
		return {
			action: 'The End',
			character: '',
			mood: '',
			speech: '',
			notes: ''
		};
	}

	const frame = event.frame;
	const primaryActor = frame.actors?.[0];

	return {
		action: primaryActor?.action || 'Scene',
		character: primaryActor?.id || '',
		mood: primaryActor?.speech?.mood || '',
		speech: primaryActor?.speech?.text || '',
		notes: event.notes || ''
	};
}

/**
 * Generate shareable presentation URL
 */
export function generatePresentationUrl(
	baseUrl: string,
	modelBase64: string,
	startIndex: number = 0
): string {
	const url = new URL('/present', baseUrl);
	url.searchParams.set('model', modelBase64);
	url.searchParams.set('index', String(startIndex));
	return url.toString();
}

/**
 * Parse presentation URL parameters
 */
export function parsePresentationUrl(params: URLSearchParams): {
	modelBase64: string | null;
	startIndex: number;
} {
	const model = params.get('model');
	const index = params.get('index');

	return {
		modelBase64: model,
		startIndex: index ? parseInt(index, 10) : 0
	};
}
