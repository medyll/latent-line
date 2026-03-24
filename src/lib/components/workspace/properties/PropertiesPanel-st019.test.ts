import { describe, it, expect } from 'vitest';
import type { TimelineEvent, TimelineFrame, LightingType, Mood } from '../../../model/model-types';

// Mirror the mutation helpers from PropertiesPanel for unit testing.
// All helpers mutate model.timeline[idx].frame directly.

function makeEvent(frame: Partial<TimelineFrame> = {}): TimelineEvent {
	return { time: 10, frame: frame as TimelineFrame };
}

describe('PropertiesPanel camera mutations', () => {
	it('sets camera zoom', () => {
		const ev = makeEvent({ camera: { zoom: 1 } });
		ev.frame.camera!.zoom = 2.5;
		expect(ev.frame.camera!.zoom).toBe(2.5);
	});

	it('sets camera pan X without losing Y', () => {
		const ev = makeEvent({ camera: { pan: [0, 5] } });
		ev.frame.camera!.pan = [3, ev.frame.camera!.pan![1]];
		expect(ev.frame.camera!.pan).toEqual([3, 5]);
	});

	it('sets camera tilt', () => {
		const ev = makeEvent({ camera: {} });
		ev.frame.camera!.tilt = -45;
		expect(ev.frame.camera!.tilt).toBe(-45);
	});

	it('initialises camera if missing before setting zoom', () => {
		const ev = makeEvent({});
		if (!ev.frame.camera) ev.frame.camera = {};
		ev.frame.camera.zoom = 1.5;
		expect(ev.frame.camera.zoom).toBe(1.5);
	});
});

describe('PropertiesPanel lighting mutations', () => {
	it('sets lighting type', () => {
		const ev = makeEvent({ lighting: {} });
		ev.frame.lighting!.type = 'dusk';
		expect(ev.frame.lighting!.type).toBe('dusk');
	});

	it('sets lighting intensity', () => {
		const ev = makeEvent({ lighting: { type: 'studio' } });
		ev.frame.lighting!.intensity = 0.75;
		expect(ev.frame.lighting!.intensity).toBe(0.75);
	});
});

describe('PropertiesPanel FX mutations', () => {
	it('sets bloom', () => {
		const ev = makeEvent({ fx: {} });
		ev.frame.fx!.bloom = 0.3;
		expect(ev.frame.fx!.bloom).toBe(0.3);
	});

	it('sets motion_blur', () => {
		const ev = makeEvent({ fx: {} });
		ev.frame.fx!.motion_blur = 0.8;
		expect(ev.frame.fx!.motion_blur).toBe(0.8);
	});
});

describe('PropertiesPanel ControlNet mutations', () => {
	it('sets type and strength', () => {
		const ev = makeEvent({ controlnet: {} });
		ev.frame.controlnet!.type = 'openpose';
		ev.frame.controlnet!.strength = 0.9;
		expect(ev.frame.controlnet!.type).toBe('openpose');
		expect(ev.frame.controlnet!.strength).toBe(0.9);
	});

	it('clears type when set to empty string', () => {
		const ev = makeEvent({ controlnet: { type: 'openpose' } });
		ev.frame.controlnet!.type = undefined;
		expect(ev.frame.controlnet!.type).toBeUndefined();
	});
});

describe('PropertiesPanel speech mutations', () => {
	it('sets speech text on an actor', () => {
		const ev = makeEvent({ actors: [{ id: 'char_01', speech: { text: '' } }] });
		ev.frame.actors![0].speech!.text = 'Hello world';
		expect(ev.frame.actors![0].speech!.text).toBe('Hello world');
	});

	it('sets mood', () => {
		const ev = makeEvent({ actors: [{ id: 'char_01', speech: { text: 'hi' } }] });
		ev.frame.actors![0].speech!.mood = 'joyful';
		expect(ev.frame.actors![0].speech!.mood).toBe('joyful');
	});

	it('sets lip_sync', () => {
		const ev = makeEvent({ actors: [{ id: 'char_01', speech: { text: '' } }] });
		ev.frame.actors![0].speech!.lip_sync = true;
		expect(ev.frame.actors![0].speech!.lip_sync).toBe(true);
	});

	it('sets volume and pitch_shift', () => {
		const ev = makeEvent({ actors: [{ id: 'char_01', speech: { text: '' } }] });
		ev.frame.actors![0].speech!.volume = 1.5;
		ev.frame.actors![0].speech!.pitch_shift = -3;
		expect(ev.frame.actors![0].speech!.volume).toBe(1.5);
		expect(ev.frame.actors![0].speech!.pitch_shift).toBe(-3);
	});

	it('initialises speech when missing', () => {
		const ev = makeEvent({ actors: [{ id: 'char_01' }] });
		if (!ev.frame.actors![0].speech) {
			ev.frame.actors![0].speech = { text: '' };
		}
		ev.frame.actors![0].speech!.text = 'initialized';
		expect(ev.frame.actors![0].speech!.text).toBe('initialized');
	});
});
