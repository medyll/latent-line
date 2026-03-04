import type { Model, Mood, LightingType } from '$lib/model/model-types';

const exampleModel: Model = {
	project: {
		name: 'LatentLine_MVP',
		fps: 24,
		resolution: { w: 1024, h: 1024 }
	},
	assets: {
		characters: [
			{
				id: 'char_01',
				name: 'Mydde',
				voice_id: 'v_male_deep_01',
				references: [
					{ url: 'face.jpg', context: 'face_id', weight: 1.0 },
					{ url: 'walking.jpg', context: 'walking', weight: 0.8 }
				],
				outfits: {
					casual: { prompt: 'leather jacket, jeans', lora: 'cloth_v1.safetensors' }
				}
			}
		],
		environments: {
			oasis: { prompt: 'bioluminescent desert oasis', ref: 'env_01.png' }
		},
		audio: [
			{ id: 'bgm_01', url: 'soundtrack_dark.wav', label: 'Main Theme' },
			{ id: 'sfx_01', url: 'water_ripples.mp3', label: 'Water SFX' }
		]
	},
	timeline: [
		{
			time: 0,
			frame: {
				actors: [
					{
						id: 'char_01',
						outfit: 'casual',
						action: 'walking slowly',
						position: { x: 0.5, y: 0.5, scale: 1.0 },
						speech: {
							text: "Enfin de l'eau...",
							mood: 'melancholic' as Mood,
							style: 'whisper',
							lip_sync: true,
							volume: 0.8
						}
					}
				],
				camera: { zoom: 1.0, pan: [0, 0], tilt: 0 },
				lighting: { type: 'dusk' as LightingType, intensity: 0.5 },
				fx: { bloom: 0.2, motion_blur: 0.1 },
				controlnet: { type: 'depth', strength: 0.8 },
				audio_tracks: [
					{ id: 'bgm_01', volume: 0.6, start_ms: 0, fade_in: 1000 },
					{ id: 'sfx_01', volume: 0.2, loop: true }
				],
				audio_reactive: { target: 'fx.bloom', param: 'amplitude', strength: 1.5 }
			}
		},
		{
			time: 120,
			frame: {
				actors: [
					{
						id: 'char_01',
						speech: {
							text: 'HA HA ! ON EST SAUVÉS !',
							mood: 'joyful' as Mood,
							style: 'shout',
							pitch_shift: 1.1
						}
					}
				],
				camera: { zoom: 2.5 },
				fx: { bloom: 0.8 },
				audio_tracks: [
					{ id: 'bgm_01', volume: 1.0 },
					{ id: 'sfx_01', volume: 0.8 }
				]
			}
		}
	],
	config: {
		checkpoint: 'flux_dev.safetensors',
		sampler: 'euler',
		seed: 42,
		tts_engine: 'elevenlabs_v2'
	}
};

export default exampleModel;
