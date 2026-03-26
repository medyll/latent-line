import { describe, it, expect } from 'vitest';
import { exportAsJSONLD, jsonldToNTriples } from './export-jsonld';
import type { Model } from '$lib/model/model-template';

describe('export-jsonld', () => {
	const sampleModel: Model = {
		id: 'test-model',
		assets: {
			characters: [
				{
					id: 'char_1',
					name: 'Bob',
					voice_id: 'v_male_01',
					outfits: { default: { prompt: 'casual' } }
				}
			],
			environments: {
				env_1: { prompt: 'beach', ref: 'beach.jpg' }
			}
		},
		timeline: {
			duration: 5000,
			events: [
				{
					id: 'evt_1',
					time: 0,
					label: 'Scene 1',
					assets: [{ asset_id: 'char_1', variant: 'default' }],
					comfyui_settings: { enabled: true, custom_positive: 'sunny' }
				}
			]
		},
		config: {
			id: 'test-model',
			title: 'Beach Timeline',
			description: 'A beach scene'
		}
	};

	it('exports model to JSON-LD format', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		expect(jsonld['@context']).toBeDefined();
		expect(jsonld['@type']).toBe('CreativeWork');
		expect(jsonld.name).toBe('Beach Timeline');
		expect(jsonld.description).toBe('A beach scene');
	});

	it('includes @id and semantic structure', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		expect(jsonld['@id']).toContain('timeline');
		expect(jsonld['@context']['@vocab']).toBe('https://schema.org/');
		expect(jsonld.creator['@type']).toBe('SoftwareApplication');
	});

	it('exports duration in ISO 8601 format', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		expect(jsonld.duration).toMatch(/^PT\d+S$/);
	});

	it('includes timeline events as actions', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		expect(Array.isArray(jsonld.hasPart)).toBe(true);
		expect(jsonld.hasPart.length).toBeGreaterThan(0);

		const event = jsonld.hasPart[0];
		expect(event['@type']).toBe('Action');
		expect(event.name).toBe('Scene 1');
		expect(event.startTime).toMatch(/^PT\d+S$/);
	});

	it('includes asset references in events', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		const event = jsonld.hasPart[0];
		expect(event.object).toBeDefined();
		expect(Array.isArray(event.object)).toBe(true);
	});

	it('includes characters in mentions', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		expect(jsonld.mentions).toBeDefined();
		expect(jsonld.mentions.containsPlace).toBeDefined();
		const chars = jsonld.mentions.containsPlace.filter((p: any) => p['@type'] === 'Person');
		expect(chars.length).toBeGreaterThan(0);
		expect(chars[0].name).toBe('Bob');
	});

	it('includes environments in mentions', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		const envs = jsonld.mentions.containsPlace.filter((p: any) => p['@type'] === 'Place');
		expect(envs.length).toBeGreaterThan(0);
		expect(envs[0].description).toBe('beach');
	});

	it('includes ComfyUI settings in event', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		const event = jsonld.hasPart[0];
		expect(event['latent:comfyui']).toBeDefined();
		expect(event['latent:comfyui'].enabled).toBe(true);
		expect(event['latent:comfyui'].positivePrompt).toBe('sunny');
	});

	it('converts to N-Triples RDF format', () => {
		const jsonld = exportAsJSONLD(sampleModel);
		const ntriples = jsonldToNTriples(jsonld);

		expect(ntriples).toContain('<');
		expect(ntriples).toContain('> <');
		expect(ntriples).toContain('>');
		// N-Triples format: each line ends with " ."
		expect(ntriples.split('\n').some(line => line.endsWith(' .'))).toBe(true);
		// Should be valid RDF triple format
		const lines = ntriples.split('\n').filter(l => l.trim());
		expect(lines.length).toBeGreaterThan(0);
		lines.forEach(line => {
			expect(line).toMatch(/<.*?> <.*?> .*? \.$/);
		});
	});

	it('handles models without ComfyUI settings', () => {
		const modelNoComfyUI: Model = {
			...sampleModel,
			timeline: {
				duration: 1000,
				events: [
					{
						id: 'evt_1',
						time: 0,
						label: 'Event',
						assets: [],
						comfyui_settings: { enabled: false }
					}
				]
			}
		};
		const jsonld = exportAsJSONLD(modelNoComfyUI);
		expect(jsonld.hasPart[0]['latent:comfyui']).toBeUndefined();
	});

	it('handles empty timeline gracefully', () => {
		const emptyModel: Model = {
			id: 'empty',
			assets: { characters: [], environments: {} },
			timeline: { duration: 10000, events: [] },
			config: { id: 'empty', title: 'Empty' }
		};
		const jsonld = exportAsJSONLD(emptyModel);
		expect(jsonld['@type']).toBe('CreativeWork');
		expect(jsonld.hasPart.length).toBe(0);
	});

	it('formats various durations correctly', () => {
		const tests = [
			{ ms: 1000, expected: 'PT1S' },
			{ ms: 60000, expected: 'PT1M' },
			{ ms: 90000, expected: 'PT1M30S' },
			{ ms: 3600000, expected: 'PT1H' },
			{ ms: 3661000, expected: 'PT1H1M1S' }
		];

		tests.forEach(({ ms, expected }) => {
			const model: Model = {
				...sampleModel,
				timeline: { ...sampleModel.timeline, duration: ms }
			};
			const jsonld = exportAsJSONLD(model);
			expect(jsonld.duration).toBe(expected);
		});
	});

	it('escapes special characters in N-Triples', () => {
		const modelWithQuotes: Model = {
			...sampleModel,
			config: {
				id: 'test',
				title: 'Timeline with "quotes"',
				description: ''
			}
		};
		const jsonld = exportAsJSONLD(modelWithQuotes);
		const ntriples = jsonldToNTriples(jsonld);
		expect(ntriples).toContain('\\"');
	});
});
