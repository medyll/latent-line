import type { Model, Mood, LightingType } from '$lib/model/model-types';

/**
 * "La Reunion" — Court-metrage cinematique.
 *
 * Lieu : phare abandonne sur une falaise bretonne, soir de tempete.
 * Personnages : Lea (detective), Victor (informateur), Mara (agent double).
 * 24 fps — time exprime en frames.
 */
const exampleModel: Model = {
	project: {
		name: 'La_Reunion',
		fps: 24,
		resolution: { w: 1280, h: 720 }
	},

	assets: {
		characters: [
			{
				id: 'char_lea',
				name: 'Lea Marchand',
				voice_id: 'v_female_calm_01',
				references: [
					{ url: 'lea_face.jpg', context: 'face_id', weight: 1.0 },
					{ url: 'lea_profile.jpg', context: 'profile', weight: 0.7 }
				],
				outfits: {
					detective: { prompt: 'long beige trench coat, dark turtleneck, badge on belt', lora: 'cloth_v2.safetensors' },
					casual:    { prompt: 'grey hoodie, dark jeans', lora: 'cloth_v2.safetensors' }
				}
			},
			{
				id: 'char_victor',
				name: 'Victor Aumont',
				voice_id: 'v_male_nervous_02',
				references: [
					{ url: 'victor_face.jpg', context: 'face_id', weight: 1.0 }
				],
				outfits: {
					civilian: { prompt: 'worn olive field jacket, grey scarf, stubble beard' }
				}
			},
			{
				id: 'char_mara',
				name: 'Mara',
				voice_id: 'v_female_cold_03',
				references: [
					{ url: 'mara_face.jpg', context: 'face_id', weight: 1.0 },
					{ url: 'mara_silhouette.jpg', context: 'silhouette', weight: 0.6 }
				],
				outfits: {
					operative: { prompt: 'fitted black turtleneck, dark tailored trousers, silver earrings', lora: 'cloth_v2.safetensors' }
				}
			}
		],

		environments: {
			phare_exterieur: {
				prompt: 'abandoned lighthouse on a Breton cliff, stormy twilight sky, crashing waves below, wet rocks, cinematic',
				ref: 'env_phare_ext.png'
			},
			phare_interieur: {
				prompt: 'interior of abandoned lighthouse, cracked stone walls, old wooden stairs, flickering lantern light, dust motes, dramatic shadows',
				ref: 'env_phare_int.png'
			}
		},

		audio: [
			{ id: 'bgm_tension', url: 'tension_ambient.wav',  label: 'Ambient Tension' },
			{ id: 'bgm_reveal',  url: 'dramatic_sting.wav',   label: 'Dramatic Reveal' },
			{ id: 'sfx_wind',    url: 'storm_wind.mp3',       label: 'Storm Wind' },
			{ id: 'sfx_steps',   url: 'steps_stone.mp3',      label: 'Footsteps on Stone' },
			{ id: 'sfx_creak',   url: 'wood_creak.mp3',       label: 'Lighthouse Creak' }
		]
	},

	timeline: [
		// t=0 (0s) — Plan large exterieur : Lea approche sous la pluie
		{
			time: 0,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'walking against wind, hand on lapel',
						position: { x: 0.3, y: 0.6, scale: 0.7 }
					}
				],
				camera: { zoom: 0.8, pan: [0, 0], tilt: -5 },
				lighting: { type: 'dusk' as LightingType, intensity: 0.4 },
				fx: { bloom: 0.1, motion_blur: 0.2 },
				controlnet: { type: 'depth', strength: 0.85 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.5, start_ms: 0, fade_in: 2000 },
					{ id: 'sfx_wind',    volume: 0.7, loop: true, start_ms: 0 }
				]
			}
		},

		// t=48 (2s) — Lea pousse la porte du phare
		{
			time: 48,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'pushing heavy door, cautious',
						position: { x: 0.5, y: 0.5, scale: 1.1 }
					}
				],
				camera: { zoom: 1.2, pan: [0, 0.1] },
				lighting: { type: 'dusk' as LightingType, intensity: 0.3 },
				fx: { motion_blur: 0.15 },
				audio_tracks: [
					{ id: 'sfx_steps', volume: 0.6, start_ms: 0 },
					{ id: 'sfx_creak', volume: 0.9, start_ms: 500 },
					{ id: 'sfx_wind',  volume: 0.4, loop: true }
				]
			}
		},

		// t=96 (4s) — Interieur : Victor attend, nerveux
		{
			time: 96,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'pacing nervously, glancing at door',
						position: { x: 0.6, y: 0.5, scale: 1.0 }
					}
				],
				camera: { zoom: 1.4, tilt: 2 },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.6 },
				fx: { bloom: 0.3 },
				controlnet: { type: 'depth', strength: 0.7 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.6 },
					{ id: 'sfx_creak',   volume: 0.3, loop: true }
				]
			}
		},

		// t=144 (6s) — Lea entre. Victor se fige.
		{
			time: 144,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'entering, scanning room',
						position: { x: 0.25, y: 0.5, scale: 1.0 },
						speech: { text: "Victor. Tu as ce que j'ai demande ?", mood: 'serene' as Mood, style: 'low', lip_sync: true, volume: 0.9 }
					},
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'standing still, relieved but tense',
						position: { x: 0.7, y: 0.5, scale: 1.0 }
					}
				],
				camera: { zoom: 1.0, pan: [0, 0] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.55 },
				fx: { bloom: 0.25 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.4 },
					{ id: 'sfx_wind',    volume: 0.2, loop: true }
				]
			}
		},

		// t=192 (8s) — Victor tend une enveloppe
		{
			time: 192,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'reaching into jacket, pulling out envelope',
						position: { x: 0.6, y: 0.5, scale: 1.2 },
						speech: { text: 'Tout est la. Noms, dates, comptes offshore.', mood: 'anxious' as Mood, style: 'whisper', lip_sync: true, volume: 0.85 }
					},
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'stepping forward, hand outstretched',
						position: { x: 0.3, y: 0.5, scale: 1.1 }
					}
				],
				camera: { zoom: 1.6, pan: [0.1, 0] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.6 },
				fx: { bloom: 0.2 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.5 }
				]
			}
		},

		// t=240 (10s) — Un bruit en haut de l escalier. Les deux se figent.
		{
			time: 240,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'freezing, eyes up toward staircase',
						position: { x: 0.35, y: 0.55, scale: 1.0 }
					},
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'spinning toward stairs, panicked',
						position: { x: 0.65, y: 0.55, scale: 1.0 },
						speech: { text: 'On est pas seuls.', mood: 'anxious' as Mood, style: 'whisper', volume: 0.7 }
					}
				],
				camera: { zoom: 1.1, tilt: 5, pan: [0, -0.2] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.5 },
				fx: { bloom: 0.1, motion_blur: 0.1 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.7 },
					{ id: 'sfx_creak',   volume: 1.0, start_ms: 0 }
				]
			}
		},

		// t=288 (12s) — Mara descend l escalier, calme, sourire froid
		{
			time: 288,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'descending stairs slowly, hands visible, cold smile',
						position: { x: 0.5, y: 0.3, scale: 0.9 }
					},
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'stepping back, hand moving to holster',
						position: { x: 0.2, y: 0.6, scale: 1.0 }
					},
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'backing against wall',
						position: { x: 0.8, y: 0.6, scale: 0.95 }
					}
				],
				camera: { zoom: 0.9, tilt: -8, pan: [0, 0.15] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.45 },
				fx: { bloom: 0.35 },
				controlnet: { type: 'depth', strength: 0.9 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.8 },
					{ id: 'sfx_steps',   volume: 0.5, start_ms: 200 }
				]
			}
		},

		// t=336 (14s) — Confrontation. Mara parle.
		{
			time: 336,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'standing still at base of stairs, arms crossed',
						position: { x: 0.5, y: 0.45, scale: 1.15 },
						speech: { text: 'Cette enveloppe ne vous appartient pas, inspectrice.', mood: 'serene' as Mood, style: 'flat', lip_sync: true, volume: 1.0 }
					},
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'standing firm, hand on holster',
						position: { x: 0.25, y: 0.55, scale: 1.05 }
					}
				],
				camera: { zoom: 1.8, pan: [0.05, 0] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.5 },
				fx: { bloom: 0.2 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.6 }
				],
				audio_reactive: { target: 'fx.bloom', param: 'amplitude', strength: 1.2 }
			}
		},

		// t=384 (16s) — Victor tente de fuir vers la porte
		{
			time: 384,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'lunging toward exit door',
						position: { x: 0.15, y: 0.6, scale: 1.0 },
						speech: { text: 'Je sors de la !', mood: 'anxious' as Mood, style: 'shout', volume: 1.0, pitch_shift: 1.05 }
					},
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'grabbing Victors arm',
						position: { x: 0.3, y: 0.55, scale: 1.1 }
					},
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'raising hand in warning',
						position: { x: 0.55, y: 0.45, scale: 1.1 }
					}
				],
				camera: { zoom: 1.3, pan: [-0.1, 0] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.55 },
				fx: { motion_blur: 0.25, bloom: 0.15 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 1.0 },
					{ id: 'sfx_steps',   volume: 0.8 }
				]
			}
		},

		// t=432 (18s) — Lea degaine. Silence.
		{
			time: 432,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'drawing weapon, pointing at Mara',
						position: { x: 0.3, y: 0.5, scale: 1.2 },
						speech: { text: 'Personne ne bouge.', mood: 'serene' as Mood, style: 'command', lip_sync: true, volume: 0.95 }
					},
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'standing perfectly still, unperturbed',
						position: { x: 0.65, y: 0.45, scale: 1.1 }
					},
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'hands raised, pressed against door',
						position: { x: 0.1, y: 0.6, scale: 0.95 }
					}
				],
				camera: { zoom: 2.0, pan: [0, 0], tilt: 3 },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.6 },
				fx: { bloom: 0.1 },
				audio_tracks: [
					{ id: 'bgm_tension', volume: 0.3 },
					{ id: 'sfx_wind',    volume: 0.5, loop: true }
				]
			}
		},

		// t=480 (20s) — Mara revele son badge — elle est de la meme agence
		{
			time: 480,
			duration: 48,
			frame: {
				actors: [
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'slowly opening jacket, revealing badge',
						position: { x: 0.55, y: 0.45, scale: 1.3 },
						speech: { text: 'Division Noire. Je la protege depuis six mois.', mood: 'serene' as Mood, style: 'flat', lip_sync: true, volume: 0.9 }
					},
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'lowering weapon, stunned',
						position: { x: 0.25, y: 0.5, scale: 1.1 }
					}
				],
				camera: { zoom: 1.7, pan: [0.1, 0] },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.65 },
				fx: { bloom: 0.4 },
				controlnet: { type: 'depth', strength: 0.75 },
				audio_tracks: [
					{ id: 'bgm_reveal', volume: 0.8, start_ms: 0, fade_in: 500 },
					{ id: 'sfx_wind',   volume: 0.3, loop: true }
				],
				audio_reactive: { target: 'fx.bloom', param: 'amplitude', strength: 2.0 }
			}
		},

		// t=528 (22s) — Plan final. Les trois personnages, tableau immobile.
		{
			time: 528,
			duration: 72,
			frame: {
				actors: [
					{
						id: 'char_lea',
						outfit: 'detective',
						action: 'standing, weapon holstered, looking at Mara',
						position: { x: 0.2, y: 0.55, scale: 1.0 }
					},
					{
						id: 'char_victor',
						outfit: 'civilian',
						action: 'slumped against door, exhausted',
						position: { x: 0.1, y: 0.65, scale: 0.9 }
					},
					{
						id: 'char_mara',
						outfit: 'operative',
						action: 'standing upright, surveying both',
						position: { x: 0.6, y: 0.5, scale: 1.05 }
					}
				],
				camera: { zoom: 0.85, pan: [0, 0], tilt: 0 },
				lighting: { type: 'tungsten' as LightingType, intensity: 0.4 },
				fx: { bloom: 0.2 },
				audio_tracks: [
					{ id: 'bgm_reveal', volume: 0.5 },
					{ id: 'sfx_wind',   volume: 0.6, loop: true }
				]
			}
		}
	],

	config: {
		checkpoint: 'flux_dev.safetensors',
		sampler: 'euler',
		seed: 7391,
		tts_engine: 'elevenlabs_v2',
		audioLanes: [
			{ id: 'bgm_tension', name: 'BGM Tension',    muted: false, soloed: false },
			{ id: 'bgm_reveal',  name: 'BGM Reveal',     muted: false, soloed: false },
			{ id: 'sfx_wind',    name: 'SFX Vent',       muted: false, soloed: false },
			{ id: 'sfx_steps',   name: 'SFX Pas',        muted: false, soloed: false },
			{ id: 'sfx_creak',   name: 'SFX Grincement', muted: false, soloed: false }
		]
	}
};

export default exampleModel;
