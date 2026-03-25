import { describe, it, expect } from 'vitest';
import type { PresentationState } from './presentation';
import {
	getEventDurationMs,
	handlePresentationKeydown,
	getNextEventIndex,
	formatEventForPresentation,
	generatePresentationUrl,
	parsePresentationUrl
} from './presentation';
import type { TimelineEvent } from '$lib/model/model-types';

describe('presentation utility', () => {
	// Test data
	const mockEvent: TimelineEvent = {
		time: 0,
		duration: 24, // 1 second at 24fps
		notes: 'Test event',
		frame: {
			actors: [
				{
					id: 'alice',
					action: 'walking',
					speech: {
						text: 'Hello world',
						mood: 'joyful'
					}
				}
			]
		}
	};

	describe('getEventDurationMs', () => {
		it('should calculate duration from event frames', () => {
			const duration = getEventDurationMs(mockEvent, 24);
			// 24 frames at 24 fps = 1 second = 1000 ms
			expect(duration).toBe(1000);
		});

		it('should use default 3 seconds for null event', () => {
			const duration = getEventDurationMs(null, 24);
			expect(duration).toBe(3000);
		});

		it('should default to 1 frame if event has no duration', () => {
			const event: TimelineEvent = {
				time: 0,
				frame: {}
			};
			const duration = getEventDurationMs(event, 24);
			// 1 frame at 24 fps ≈ 41.67 ms, but clamped to minimum 1000 ms
			expect(duration).toBe(1000);
		});

		it('should clamp minimum to 1 second', () => {
			const event: TimelineEvent = {
				time: 0,
				duration: 0.5, // way too short
				frame: {}
			};
			const duration = getEventDurationMs(event, 24);
			expect(duration).toBe(1000);
		});

		it('should clamp maximum to 30 seconds', () => {
			const event: TimelineEvent = {
				time: 0,
				duration: 1000, // way too long
				frame: {}
			};
			const duration = getEventDurationMs(event, 24);
			expect(duration).toBe(30000);
		});

		it('should handle different fps rates', () => {
			const event: TimelineEvent = {
				time: 0,
				duration: 30, // 1 second at 30 fps
				frame: {}
			};
			const duration = getEventDurationMs(event, 30);
			expect(duration).toBe(1000);
		});
	});

	describe('handlePresentationKeydown', () => {
		const baseState: PresentationState = {
			currentIndex: 2,
			isPlaying: false,
			progress: 0.5,
			duration: 3000
		};

		it('should move to previous event on arrow left', () => {
			const result = handlePresentationKeydown('ArrowLeft', baseState, 10);
			expect(result.currentIndex).toBe(1);
			expect(result.progress).toBe(0);
			expect(result.isPlaying).toBe(false);
		});

		it('should not go below index 0 on arrow left', () => {
			const state = { ...baseState, currentIndex: 0 };
			const result = handlePresentationKeydown('ArrowLeft', state, 10);
			expect(result.currentIndex).toBeUndefined();
		});

		it('should move to next event on arrow right', () => {
			const result = handlePresentationKeydown('ArrowRight', baseState, 10);
			expect(result.currentIndex).toBe(3);
			expect(result.progress).toBe(0);
			expect(result.isPlaying).toBe(false);
		});

		it('should not go beyond last event on arrow right', () => {
			const state = { ...baseState, currentIndex: 9 };
			const result = handlePresentationKeydown('ArrowRight', state, 10);
			expect(result.currentIndex).toBeUndefined();
		});

		it('should toggle playback on p key', () => {
			const result = handlePresentationKeydown('p', baseState, 10);
			expect(result.isPlaying).toBe(true);
		});

		it('should toggle playback on P key (uppercase)', () => {
			const result = handlePresentationKeydown('P', baseState, 10);
			expect(result.isPlaying).toBe(true);
		});

		it('should toggle playback on spacebar', () => {
			const result = handlePresentationKeydown(' ', baseState, 10);
			expect(result.isPlaying).toBe(true);
		});

		it('should ignore unknown keys', () => {
			const result = handlePresentationKeydown('x', baseState, 10);
			expect(Object.keys(result).length).toBe(0);
		});
	});

	describe('getNextEventIndex', () => {
		it('should advance to next event', () => {
			const next = getNextEventIndex(2, 10, true);
			expect(next).toBe(3);
		});

		it('should pause at last event when stopAtEnd is true', () => {
			const next = getNextEventIndex(9, 10, true);
			expect(next).toBe(9);
		});

		it('should loop back to start when stopAtEnd is false', () => {
			const next = getNextEventIndex(9, 10, false);
			expect(next).toBe(0);
		});

		it('should handle single event timeline', () => {
			const next = getNextEventIndex(0, 1, true);
			expect(next).toBe(0);
		});
	});

	describe('formatEventForPresentation', () => {
		it('should format event with all fields', () => {
			const formatted = formatEventForPresentation(mockEvent);
			expect(formatted).toEqual({
				action: 'walking',
				character: 'alice',
				mood: 'joyful',
				speech: 'Hello world',
				notes: 'Test event'
			});
		});

		it('should handle event without actors', () => {
			const event: TimelineEvent = {
				time: 0,
				frame: {},
				notes: 'Scene setup'
			};
			const formatted = formatEventForPresentation(event);
			expect(formatted).toEqual({
				action: 'Scene',
				character: '',
				mood: '',
				speech: '',
				notes: 'Scene setup'
			});
		});

		it('should handle null event', () => {
			const formatted = formatEventForPresentation(null);
			expect(formatted.action).toBe('The End');
			expect(formatted.character).toBe('');
		});

		it('should use actor id as character fallback', () => {
			const event: TimelineEvent = {
				time: 0,
				frame: {
					actors: [
						{
							id: 'character-id',
							position: { x: 0, y: 0 }
						}
					]
				}
			};
			const formatted = formatEventForPresentation(event);
			expect(formatted.character).toBe('character-id');
		});
	});

	describe('generatePresentationUrl', () => {
		it('should generate valid presentation URL', () => {
			const model = Buffer.from(JSON.stringify({ test: 'data' })).toString('base64');
			const url = generatePresentationUrl('http://localhost:5173', model, 0);

			expect(url).toContain('/present');
			expect(url).toContain('model=');
			expect(url).toContain('index=0');
		});

		it('should encode model as base64 parameter', () => {
			const model = 'dGVzdA=='; // 'test' in base64
			const url = generatePresentationUrl('http://localhost:5173', model, 1);

			expect(url).toContain('model=dGVzdA%3D%3D'); // URL-encoded base64
		});

		it('should set start index parameter', () => {
			const model = 'test';
			const url = generatePresentationUrl('http://localhost:5173', model, 5);

			expect(url).toContain('index=5');
		});
	});

	describe('parsePresentationUrl', () => {
		it('should parse model parameter', () => {
			const params = new URLSearchParams('model=dGVzdA==&index=0');
			const parsed = parsePresentationUrl(params);

			expect(parsed.modelBase64).toBe('dGVzdA==');
		});

		it('should parse start index parameter', () => {
			const params = new URLSearchParams('model=test&index=5');
			const parsed = parsePresentationUrl(params);

			expect(parsed.startIndex).toBe(5);
		});

		it('should default to index 0 if not provided', () => {
			const params = new URLSearchParams('model=test');
			const parsed = parsePresentationUrl(params);

			expect(parsed.startIndex).toBe(0);
		});

		it('should return null model if not provided', () => {
			const params = new URLSearchParams('index=3');
			const parsed = parsePresentationUrl(params);

			expect(parsed.modelBase64).toBeNull();
			expect(parsed.startIndex).toBe(3);
		});

		it('should handle non-numeric index gracefully', () => {
			const params = new URLSearchParams('model=test&index=abc');
			const parsed = parsePresentationUrl(params);

			expect(Number.isNaN(parsed.startIndex)).toBe(true);
		});
	});
});
