import { describe, it, expect } from 'vitest';
import { exportAsYAML, parseYAML } from './export-yaml';
import type { Model } from '$lib/model/model-template';

describe('export-yaml', () => {
	const sampleModel: Model = {
		id: 'test-model',
		assets: {
			characters: [
				{
					id: 'char_1',
					name: 'Alice',
					voice_id: 'v_female_01',
					outfits: {
						default: { prompt: 'casual wear' },
						formal: { prompt: 'business suit' }
					}
				}
			],
			environments: {
				env_1: { prompt: 'modern office', ref: 'office.jpg' }
			}
		},
		timeline: {
			duration: 5000,
			events: [
				{
					id: 'evt_1',
					time: 0,
					label: 'Opening',
					description: 'Scene starts',
					assets: [{ asset_id: 'char_1', variant: 'default' }],
					comfyui_settings: { enabled: false }
				},
				{
					id: 'evt_2',
					time: 2000,
					label: 'Action',
					assets: [],
					comfyui_settings: {
						enabled: true,
						custom_positive: 'detailed, high quality',
						custom_negative: 'blurry'
					}
				}
			]
		},
		config: {
			id: 'test-model',
			title: 'Test Timeline',
			description: 'A test timeline for YAML export'
		}
	};

	it('exports model to YAML format', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('# Latent-Line Timeline Export');
		expect(yaml).toContain('name: "Test Timeline"');
		expect(yaml).toContain('characters:');
		expect(yaml).toContain('Alice');
		expect(yaml).toContain('environments:');
		expect(yaml).toContain('events:');
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
		expect(yaml).toContain('id: env_1');
		expect(yaml).toContain('prompt: "modern office"');
		expect(yaml).toContain('ref: "office.jpg"');
	});

	it('includes timeline events in YAML', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('events:');
		expect(yaml).toContain('id: "evt_1"');
		expect(yaml).toContain('time: 0');
		expect(yaml).toContain('label: "Opening"');
		expect(yaml).toContain('description: "Scene starts"');
		expect(yaml).toContain('assets:');
	});

	it('includes ComfyUI settings in YAML', () => {
		const yaml = exportAsYAML(sampleModel);
		expect(yaml).toContain('comfyui_enabled: true');
		expect(yaml).toContain('comfyui_positive: "detailed, high quality"');
		expect(yaml).toContain('comfyui_negative: "blurry"');
	});

	it('escapes special characters in YAML strings', () => {
		const modelWithSpecialChars: Model = {
			...sampleModel,
			config: {
				id: 'test',
				title: 'Timeline with "quotes"',
				description: 'Line 1\nLine 2'
			}
		};
		const yaml = exportAsYAML(modelWithSpecialChars);
		expect(yaml).toContain('\\"');
		expect(yaml).toContain('\\n');
	});

	it('parses YAML back to model structure', () => {
		const yaml = exportAsYAML(sampleModel);
		const parsed = parseYAML(yaml);

		expect(parsed.config?.title).toBe('Test Timeline');
		expect(parsed.config?.description).toBe('A test timeline for YAML export');
		expect(parsed.timeline?.duration).toBe(5000);
	});

	it('handles empty assets gracefully', () => {
		const emptyModel: Model = {
			id: 'empty',
			assets: { characters: [], environments: {} },
			timeline: { duration: 10000, events: [] },
			config: { id: 'empty', title: 'Empty' }
		};
		const yaml = exportAsYAML(emptyModel);
		expect(yaml).toContain('name: "Empty"');
		// Should not crash, and should be valid YAML
		expect(yaml.length > 0).toBe(true);
	});

	it('handles events without assets', () => {
		const modelWithBareEvents: Model = {
			id: 'bare',
			assets: { characters: [], environments: {} },
			timeline: {
				duration: 1000,
				events: [
					{
						id: 'evt_1',
						time: 500,
						label: 'Event',
						assets: [],
						comfyui_settings: { enabled: false }
					}
				]
			},
			config: { id: 'bare', title: 'Bare Events' }
		};
		const yaml = exportAsYAML(modelWithBareEvents);
		expect(yaml).toContain('Event');
		expect(yaml).toContain('time: 500');
	});
});
