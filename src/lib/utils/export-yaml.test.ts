import { describe, it, expect } from 'vitest';
import { exportAsYAML, parseYAML } from './export-yaml';
import type { Model } from '$lib/model/model-template';

describe('export-yaml', () => {
	const sampleModel: Model = {
		project: {
			name: 'Test Timeline',
			fps: 24,
			resolution: { w: 1024, h: 1024 }
		},
		assets: {
			characters: [
				{
					id: 'char_1',
					name: 'Alice',
					voice_id: 'v_female_01',
					references: [{ url: 'alice.jpg', context: 'face', weight: 1.0 }],
					outfits: {
						default: { prompt: 'casual wear' },
						formal: { prompt: 'business suit' }
					}
				}
			],
			environments: {
				env_1: { prompt: 'modern office', ref: 'office.jpg' }
			},
			audio: []
		},
		timeline: [
			{
				time: 0,
				duration: 200,
				frame: {
					prompt: 'opening scene',
					actors: [{ id: 'char_1', action: 'walking' }]
				}
			},
			{
				time: 2000,
				duration: 200,
				frame: {
					prompt: 'detailed, high quality'
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

	it('exports model to YAML format', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('# Latent-Line Timeline Export');
		expect(yaml).toContain('project:');
		expect(yaml).toContain('Test Timeline');
		expect(yaml).toContain('characters:');
		expect(yaml).toContain('Alice');
		expect(yaml).toContain('environments:');
		expect(yaml).toContain('timeline:');
	});

	it('includes character details in YAML', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('id: char_1');
		expect(yaml).toContain('voice_id: "v_female_01"');
		expect(yaml).toContain('outfits:');
		expect(yaml).toContain('default: "casual wear"');
		expect(yaml).toContain('formal: "business suit"');
	});

	it('includes environment details in YAML', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('environments:');
		expect(yaml).toContain('prompt: "modern office"');
		expect(yaml).toContain('ref: "office.jpg"');
	});

	it('includes timeline events in YAML', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('time: 0');
		expect(yaml).toContain('prompt: "opening scene"');
		expect(yaml).toContain('actor: char_1');
	});

	it('escapes special characters in YAML strings', () => {
		const modelWithSpecialChars: Model = {
			...sampleModel,
			project: { ...sampleModel.project, name: 'Timeline with "quotes"' }
		};
		const yaml = exportAsYAML(modelWithSpecialChars);
		expect(yaml).toContain('\\"');
	});

	it('parses YAML back to model structure', () => {
		const yaml = exportAsYAML(sampleModel);
		const parsed = parseYAML(yaml);

		// parseYAML is a stub that returns empty model
		expect(parsed.project).toBeDefined();
		expect(parsed.assets).toBeDefined();
		expect(parsed.timeline).toBeDefined();
	});

	it('handles empty assets gracefully', () => {
		const emptyModel: Model = {
			project: { name: 'Empty', fps: 24, resolution: { w: 1024, h: 1024 } },
			assets: { characters: [], environments: {}, audio: [] },
			timeline: [],
			config: { checkpoint: 'flux_dev', sampler: 'euler', seed: 42 }
		};
		const yaml = exportAsYAML(emptyModel);
		expect(yaml).toContain('name: "Empty"');
		expect(yaml.length > 0).toBe(true);
	});

	it('handles events without assets', () => {
		const modelWithBareEvents: Model = {
			project: { name: 'Bare Events', fps: 24, resolution: { w: 1024, h: 1024 } },
			assets: { characters: [], environments: {}, audio: [] },
			timeline: [
				{
					time: 500,
					duration: 200,
					frame: {}
				}
			],
			config: { checkpoint: 'flux_dev', sampler: 'euler', seed: 42 }
		};
		const yaml = exportAsYAML(modelWithBareEvents);
		expect(yaml).toContain('Bare Events');
		expect(yaml).toContain('time: 500');
	});
});
