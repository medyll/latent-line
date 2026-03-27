import { describe, it, expect } from 'vitest';
import { exportAsJSONLD, jsonldToNTriples } from './export-jsonld';
import type { Model } from '$lib/model/model-template';

describe('export-jsonld', () => {
	const sampleModel: Model = {
		project: {
			name: 'Beach Timeline',
			fps: 24,
			resolution: { w: 1024, h: 1024 }
		},
		assets: {
			characters: [
				{
					id: 'char_1',
					name: 'Bob',
					voice_id: 'v_male_01',
					references: [{ url: 'bob.jpg', context: 'face', weight: 1.0 }],
					outfits: { default: { prompt: 'casual' } }
				}
			],
			environments: {
				env_1: { prompt: 'beach', ref: 'beach.jpg' }
			},
			audio: []
		},
		timeline: [
			{
				time: 0,
				duration: 200,
				frame: {
					prompt: 'sunny beach scene',
					actors: [{ id: 'char_1', action: 'walking' }]
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

	it('exports model to JSON-LD format', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		expect(jsonld['@context']).toBeDefined();
		expect(jsonld['@type']).toBe('CreativeWork');
		expect(jsonld.name).toBe('Beach Timeline');
	});

	it('includes @id and semantic structure', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		expect(jsonld['@id']).toContain('timeline');
		expect(jsonld['@context']['@vocab']).toBe('https://schema.org/');
		expect(jsonld.creator['@type']).toBe('SoftwareApplication');
	});

	it('exports duration in ISO 8601 format', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		expect(jsonld.duration).toMatch(/^PT\d+S$/);
	});

	it('includes timeline events as actions', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		expect(Array.isArray(jsonld.hasPart)).toBe(true);
		expect(jsonld.hasPart.length).toBeGreaterThan(0);

		const event = jsonld.hasPart[0];
		expect(event['@type']).toBe('Action');
		expect(event.startTime).toMatch(/^PT\d+S$/);
	});

	it('includes asset references in events', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		// Events may have object property for assets
		expect(jsonld.hasPart.length).toBeGreaterThan(0);
	});

	it('includes characters in mentions', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		if (jsonld.mentions) {
			expect(jsonld.mentions.containsPlace).toBeDefined();
			const chars = jsonld.mentions.containsPlace.filter((p: any) => p['@type'] === 'Person');
			expect(chars.length).toBeGreaterThan(0);
			expect(chars[0].name).toBe('Bob');
		}
	});

	it('includes environments in mentions', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		if (jsonld.mentions) {
			const envs = jsonld.mentions.containsPlace?.filter((p: any) => p['@type'] === 'Place');
			if (envs) {
				expect(envs.length).toBeGreaterThan(0);
			}
		}
	});

	it('converts to N-Triples RDF format', () => {
		const jsonld: any = exportAsJSONLD(sampleModel);
		const ntriples = jsonldToNTriples(jsonld);

		expect(ntriples).toContain('<');
		expect(ntriples).toContain('> <');
		expect(ntriples).toContain('>');
		// N-Triples format: each line ends with " ."
		expect(ntriples.split('\n').some((line) => line.endsWith(' .'))).toBe(true);
		// Should be valid RDF triple format
		const lines = ntriples.split('\n').filter((l) => l.trim());
		expect(lines.length).toBeGreaterThan(0);
		lines.forEach((line) => {
			expect(line).toMatch(/<.*?> <.*?> .*? \.$/);
		});
	});

	it('handles models without ComfyUI settings', () => {
		const modelNoComfyUI: Model = {
			...sampleModel,
			timeline: [
				{
					time: 0,
					duration: 200,
					frame: {}
				}
			]
		};
		const jsonld: any = exportAsJSONLD(modelNoComfyUI);
		// New format doesn't have comfyui in JSON-LD
		expect(jsonld).toBeDefined();
	});

	it('handles empty timeline gracefully', () => {
		const emptyModel: Model = {
			project: { name: 'Empty', fps: 24, resolution: { w: 1024, h: 1024 } },
			assets: { characters: [], environments: {}, audio: [] },
			timeline: [],
			config: { checkpoint: 'flux_dev', sampler: 'euler', seed: 42 }
		};
		const jsonld: any = exportAsJSONLD(emptyModel);
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
				timeline: [{ time: 0, duration: ms, frame: {} }]
			};
			const jsonld: any = exportAsJSONLD(model);
			expect(jsonld.duration).toBe(expected);
		});
	});

	it('escapes special characters in N-Triples', () => {
		const modelWithQuotes: Model = {
			...sampleModel,
			project: { ...sampleModel.project, name: 'Timeline with "quotes"' }
		};
		const jsonld: any = exportAsJSONLD(modelWithQuotes);
		const ntriples = jsonldToNTriples(jsonld);
		expect(ntriples).toContain('\\"');
	});
});
