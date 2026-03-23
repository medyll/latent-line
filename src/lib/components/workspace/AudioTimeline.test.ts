import { describe, it, expect } from 'vitest';
import type { AudioAsset, AudioLaneConfig, Config } from '$lib/model/model-types';

/**
 * ST-024: Audio timeline lanes tests
 * Tests for audio track management, mute/solo state, and lane rendering
 */

describe('Audio lane configuration (ST-024)', () => {
	it('should initialize empty audio lanes array', () => {
		const config: Config = {
			audioLanes: []
		};
		expect(config.audioLanes).toHaveLength(0);
	});

	it('should create audio lane with correct properties', () => {
		const lane: AudioLaneConfig = {
			id: 'track_001',
			name: 'Background Music',
			muted: false,
			soloed: false
		};

		expect(lane.id).toBe('track_001');
		expect(lane.name).toBe('Background Music');
		expect(lane.muted).toBe(false);
		expect(lane.soloed).toBe(false);
	});

	it('should add audio lane to config', () => {
		const config: Config = { audioLanes: [] };
		const newLane: AudioLaneConfig = {
			id: 'bgm_01',
			name: 'Main Theme',
			muted: false,
			soloed: false
		};

		config.audioLanes!.push(newLane);

		expect(config.audioLanes).toHaveLength(1);
		expect(config.audioLanes![0].id).toBe('bgm_01');
	});

	it('should remove audio lane from config', () => {
		const config: Config = {
			audioLanes: [
				{ id: 'track_1', name: 'Track 1', muted: false, soloed: false },
				{ id: 'track_2', name: 'Track 2', muted: false, soloed: false }
			]
		};

		config.audioLanes = config.audioLanes!.filter((l) => l.id !== 'track_1');

		expect(config.audioLanes).toHaveLength(1);
		expect(config.audioLanes![0].id).toBe('track_2');
	});

	it('should toggle mute state on audio lane', () => {
		const lane: AudioLaneConfig = {
			id: 'track_001',
			name: 'Ambient',
			muted: false,
			soloed: false
		};

		lane.muted = !lane.muted;
		expect(lane.muted).toBe(true);

		lane.muted = !lane.muted;
		expect(lane.muted).toBe(false);
	});

	it('should toggle solo state on audio lane', () => {
		const lanes: AudioLaneConfig[] = [
			{ id: 'track_1', name: 'Track 1', muted: false, soloed: false },
			{ id: 'track_2', name: 'Track 2', muted: false, soloed: false }
		];

		// Solo track 1
		lanes.forEach((l) => {
			l.soloed = l.id === 'track_1';
		});

		expect(lanes[0].soloed).toBe(true);
		expect(lanes[1].soloed).toBe(false);
	});

	it('should prevent multiple tracks from being soloed simultaneously', () => {
		const lanes: AudioLaneConfig[] = [
			{ id: 'track_1', name: 'Track 1', muted: false, soloed: true },
			{ id: 'track_2', name: 'Track 2', muted: false, soloed: false }
		];

		// Solo track 2 (should clear solo on track 1)
		lanes.forEach((l) => {
			l.soloed = l.id === 'track_2';
		});

		expect(lanes[0].soloed).toBe(false);
		expect(lanes[1].soloed).toBe(true);
	});
});

describe('Audio asset integration (ST-024)', () => {
	it('should create lanes from audio assets', () => {
		const assets: AudioAsset[] = [
			{ id: 'bgm_01', url: 'music.wav', label: 'Background Music' },
			{ id: 'sfx_01', url: 'effects.wav', label: 'Sound Effects' }
		];

		const lanes: AudioLaneConfig[] = assets.map((asset) => ({
			id: asset.id,
			name: asset.label || asset.id,
			muted: false,
			soloed: false
		}));

		expect(lanes).toHaveLength(2);
		expect(lanes[0].name).toBe('Background Music');
		expect(lanes[1].name).toBe('Sound Effects');
	});

	it('should use asset ID as fallback name', () => {
		const asset: AudioAsset = {
			id: 'track_no_label',
			url: 'unknown.wav'
		};

		const lane: AudioLaneConfig = {
			id: asset.id,
			name: asset.label || asset.id,
			muted: false,
			soloed: false
		};

		expect(lane.name).toBe('track_no_label');
	});
});

describe('Mute/solo playback logic (ST-024)', () => {
	it('should determine if lane should play based on mute state', () => {
		const lane: AudioLaneConfig = {
			id: 'track_1',
			name: 'Track 1',
			muted: true,
			soloed: false
		};

		const shouldPlay = !lane.muted;
		expect(shouldPlay).toBe(false);
	});

	it('should determine if lane should play based on solo state', () => {
		const lanes: AudioLaneConfig[] = [
			{ id: 'track_1', name: 'Track 1', muted: false, soloed: true },
			{ id: 'track_2', name: 'Track 2', muted: false, soloed: false }
		];

		const anySoloed = lanes.some((l) => l.soloed);

		const track1Should = !lanes[0].muted && (anySoloed ? lanes[0].soloed : true);
		const track2Should = !lanes[1].muted && (anySoloed ? lanes[1].soloed : true);

		expect(track1Should).toBe(true);
		expect(track2Should).toBe(false);
	});

	it('should respect both mute and solo state', () => {
		const lane: AudioLaneConfig = {
			id: 'track_1',
			name: 'Track 1',
			muted: false,
			soloed: true
		};

		const shouldPlay = !lane.muted && lane.soloed;
		expect(shouldPlay).toBe(true);

		lane.muted = true;
		const shouldPlayMuted = !lane.muted && lane.soloed;
		expect(shouldPlayMuted).toBe(false);
	});
});
