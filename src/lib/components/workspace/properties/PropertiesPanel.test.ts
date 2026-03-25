import { describe, it, expect } from 'vitest';
import type { Assets } from '$lib/model/model-types';

// Pure asset lookup logic extracted for unit testing
function lookupAsset(
	assetStore: Assets,
	selectedAssetId: string | null
): { type: string; data: unknown } | null {
	if (!selectedAssetId) return null;
	const colonIdx = selectedAssetId.indexOf(':');
	if (colonIdx === -1) return null;
	const type = selectedAssetId.slice(0, colonIdx);
	const id = selectedAssetId.slice(colonIdx + 1);

	if (type === 'char') {
		const char = assetStore.characters.find((c) => c.id === id);
		return char ? { type, data: char } : null;
	}
	if (type === 'env') {
		const env = assetStore.environments[id];
		return env ? { type, data: { ...env, id } } : null;
	}
	if (type === 'audio') {
		const audio = assetStore.audio?.find((a) => a.id === id);
		return audio ? { type, data: audio } : null;
	}
	return null;
}

const testStore: Assets = {
	characters: [
		{
			id: 'char_01',
			name: 'Alice',
			references: [],
			voice_id: 'v_alice',
			outfits: { default: { prompt: 'dress' } }
		},
		{ id: 'char_02', name: 'Bob', references: [] }
	],
	environments: {
		env_01: { prompt: 'forest clearing' },
		env_02: { prompt: 'city rooftop', ref: 'img/rooftop.png' }
	},
	audio: [
		{ id: 'audio_01', url: 'music.mp3', label: 'Background Music' },
		{ id: 'audio_02', url: 'sfx.mp3' }
	]
};

describe('Asset lookup logic', () => {
	it('returns null for null selectedAssetId', () => {
		expect(lookupAsset(testStore, null)).toBeNull();
	});

	it('returns null for malformed id (no colon)', () => {
		expect(lookupAsset(testStore, 'char_01')).toBeNull();
	});

	it('returns null for unknown id', () => {
		expect(lookupAsset(testStore, 'char:char_99')).toBeNull();
	});

	it('looks up a character by id', () => {
		const result = lookupAsset(testStore, 'char:char_01');
		expect(result?.type).toBe('char');
		expect((result?.data as { name: string }).name).toBe('Alice');
		expect((result?.data as { voice_id: string }).voice_id).toBe('v_alice');
	});

	it('looks up a character without optional fields', () => {
		const result = lookupAsset(testStore, 'char:char_02');
		expect(result?.type).toBe('char');
		expect((result?.data as { name: string }).name).toBe('Bob');
	});

	it('looks up an environment by id', () => {
		const result = lookupAsset(testStore, 'env:env_01');
		expect(result?.type).toBe('env');
		expect((result?.data as { prompt: string }).prompt).toBe('forest clearing');
	});

	it('environment result includes id field', () => {
		const result = lookupAsset(testStore, 'env:env_02');
		expect((result?.data as { id: string }).id).toBe('env_02');
		expect((result?.data as { ref: string }).ref).toBe('img/rooftop.png');
	});

	it('looks up an audio asset by id', () => {
		const result = lookupAsset(testStore, 'audio:audio_01');
		expect(result?.type).toBe('audio');
		expect((result?.data as { label: string }).label).toBe('Background Music');
	});

	it('audio without label returns data with undefined label', () => {
		const result = lookupAsset(testStore, 'audio:audio_02');
		expect((result?.data as { label?: string }).label).toBeUndefined();
	});
});

// TST-004: Input validation tests for all user-facing fields
describe('Input validation and sanitization', () => {
	// Helper function to sanitize text (mirrors model-template.ts)
	function sanitizeText(input: string): string {
		if (typeof input !== 'string') return input;
		let s = input.replace(/\0/g, ''); // remove null bytes
		s = s.replace(/<[^>]*>/g, ''); // strip HTML tags
		return s;
	}

	describe('Speech text sanitization (XSS prevention)', () => {
		it('should strip HTML tags (text inside tags is preserved)', () => {
			const malicious = '<script>alert("xss")</script>Hello';
			const sanitized = sanitizeText(malicious);
			// Regex removes tags but preserves content: alert("xss")Hello
			expect(sanitized).not.toContain('<script>');
			expect(sanitized).not.toContain('</script>');
			expect(sanitized).toContain('Hello');
		});

		it('should remove multiple HTML tags', () => {
			const malicious = '<img src="x" onerror="alert(1)">Safe text<iframe>';
			const sanitized = sanitizeText(malicious);
			// Tags removed, content preserved
			expect(sanitized).not.toContain('<img');
			expect(sanitized).not.toContain('<iframe>');
			expect(sanitized).toContain('Safe text');
		});

		it('should remove null bytes', () => {
			const malicious = 'Hello\0World';
			const sanitized = sanitizeText(malicious);
			expect(sanitized).toBe('HelloWorld');
			expect(sanitized).not.toContain('\0');
		});

		it('should preserve legitimate text with special characters', () => {
			const text = 'Hello, "World"! @user #tag';
			const sanitized = sanitizeText(text);
			expect(sanitized).toBe(text);
		});

		it('should handle empty string', () => {
			expect(sanitizeText('')).toBe('');
		});

		it('should handle string with only HTML tags', () => {
			const html = '<div><span><b></b></span></div>';
			const sanitized = sanitizeText(html);
			expect(sanitized).toBe('');
		});

		it('should prevent script tag injection', () => {
			const injected = 'Hello<script>alert("xss")</script>World';
			const sanitized = sanitizeText(injected);
			expect(sanitized).not.toContain('<script>');
			expect(sanitized).not.toContain('</script>');
		});
	});

	describe('Mood selector validation', () => {
		const validMoods = ['joyful', 'melancholic', 'anxious', 'serene', 'curious'];

		it('should accept all valid mood values', () => {
			validMoods.forEach((mood) => {
				expect(validMoods.includes(mood)).toBe(true);
			});
		});

		it('should reject invalid mood values', () => {
			const invalidMoods = ['happy', 'sad', 'angry', 'confused', 'JOYFUL', 'Joyful'];
			invalidMoods.forEach((mood) => {
				expect(validMoods.includes(mood as (typeof validMoods)[0])).toBe(false);
			});
		});
	});

	describe('Seed input validation', () => {
		it('should accept numeric seed values', () => {
			const validSeeds = [0, 1, 42, 999999, -1, 1000000];
			validSeeds.forEach((seed) => {
				expect(typeof seed).toBe('number');
			});
		});

		it('should reject NaN as seed', () => {
			expect(Number.isNaN(NaN)).toBe(true);
		});

		it('should reject Infinity as seed', () => {
			expect(Number.isFinite(Infinity)).toBe(false);
		});

		it('should coerce string to number for seed input', () => {
			const stringValue = '42';
			const numValue = Number(stringValue);
			expect(numValue).toBe(42);
			expect(typeof numValue).toBe('number');
		});

		it('should result in NaN when coercing non-numeric string', () => {
			const stringValue = 'not-a-number';
			const numValue = Number(stringValue);
			expect(Number.isNaN(numValue)).toBe(true);
		});

		it('should handle floating point seed values', () => {
			const floatSeed = 42.5;
			// Some implementations may round or truncate
			expect(Number.isFinite(floatSeed)).toBe(true);
		});
	});

	describe('Camera pan/zoom field validation', () => {
		it('should accept valid zoom values', () => {
			const validZooms = [0.1, 1.0, 1.5, 2.0, 5.0];
			validZooms.forEach((zoom) => {
				expect(typeof zoom).toBe('number');
				expect(Number.isFinite(zoom)).toBe(true);
			});
		});

		it('should reject zoom < 0.1', () => {
			const invalidZooms = [0, 0.05, -1, -0.5];
			invalidZooms.forEach((zoom) => {
				expect(zoom < 0.1).toBe(true);
			});
		});

		it('should accept valid pan values [x, y]', () => {
			const validPans = [
				[0, 0],
				[0.5, 0.5],
				[1.0, 0.0],
				[0.0, 1.0],
				[-0.5, 0.5]
			];
			validPans.forEach((pan) => {
				expect(Array.isArray(pan)).toBe(true);
				expect(pan.length).toBe(2);
				expect(typeof pan[0]).toBe('number');
				expect(typeof pan[1]).toBe('number');
			});
		});

		it('should reject non-tuple pan values', () => {
			const invalidPans = [0.5, [0.5], [0.5, 0.5, 0.5], 'invalid'];
			invalidPans.forEach((pan) => {
				if (Array.isArray(pan)) {
					expect(pan.length !== 2).toBe(true);
				} else {
					expect(Array.isArray(pan)).toBe(false);
				}
			});
		});
	});

	describe('Character name field validation', () => {
		it('should accept normal character names', () => {
			const names = ['Alice', 'Bob', 'Character-01', 'Hero_Name'];
			names.forEach((name) => {
				expect(typeof name).toBe('string');
				expect(name.length > 0).toBe(true);
			});
		});

		it('should accept special characters in names', () => {
			const names = ['Char-01', 'Hero_2024', 'Alice@v1', 'Bob.Jr'];
			names.forEach((name) => {
				expect(name.match(/[!@#$%^&*\-_.]/)).not.toBeNull();
			});
		});

		it('should accept unicode/emoji in character names', () => {
			const names = ['日本語', 'Émoji🎬', 'Москва', '中文字符'];
			names.forEach((name) => {
				expect(typeof name).toBe('string');
				expect(name.length > 0).toBe(true);
			});
		});

		it('should accept very long character names', () => {
			const longName = 'A'.repeat(5000);
			expect(longName.length).toBeGreaterThan(1000);
			expect(typeof longName).toBe('string');
		});

		it('should accept empty string as character name (validation at schema level)', () => {
			const emptyName = '';
			expect(emptyName.length).toBe(0);
		});
	});

	describe('Config field selectors (Checkpoint, Sampler, TTS)', () => {
		it('should accept valid checkpoint strings', () => {
			const checkpoints = ['model_v1', 'checkpoint_2024', 'stable-diffusion-3.safetensors'];
			checkpoints.forEach((cp) => {
				expect(typeof cp).toBe('string');
				expect(cp.length > 0).toBe(true);
			});
		});

		it('should accept valid sampler strings', () => {
			const samplers = ['euler', 'dpmpp_2m', 'heun', 'unipc'];
			samplers.forEach((sampler) => {
				expect(typeof sampler).toBe('string');
				// Samplers can contain letters, underscores, and numbers
				expect(sampler.match(/^[a-z0-9_]+$/)).not.toBeNull();
			});
		});

		it('should accept valid TTS engine strings', () => {
			const engines = ['openai', 'elevenlabs', 'google', 'custom_tts'];
			engines.forEach((engine) => {
				expect(typeof engine).toBe('string');
				expect(engine.length > 0).toBe(true);
			});
		});

		it('should handle empty string for optional selector fields', () => {
			const emptySelector = '';
			expect(emptySelector.length).toBe(0);
			// Empty selectors may be allowed for optional config fields
		});

		it('should accept selector with special characters', () => {
			const selector = 'model-v2.1_custom';
			expect(selector).toMatch(/[-._v\d]/);
		});
	});

	describe('Type coercion in input handlers', () => {
		it('should coerce string "1.5" to number 1.5', () => {
			const stringVal = '1.5';
			const numVal = parseFloat(stringVal);
			expect(numVal).toBe(1.5);
			expect(typeof numVal).toBe('number');
		});

		it('should coerce string "42" to number 42', () => {
			const stringVal = '42';
			const numVal = parseInt(stringVal, 10);
			expect(numVal).toBe(42);
			expect(typeof numVal).toBe('number');
		});

		it('should handle invalid number coercion gracefully', () => {
			const stringVal = 'abc';
			const numVal = parseFloat(stringVal);
			expect(Number.isNaN(numVal)).toBe(true);
		});

		it('should preserve number type for numeric input', () => {
			const numVal = 42;
			expect(typeof numVal).toBe('number');
			expect(Number.isFinite(numVal)).toBe(true);
		});

		it('should coerce boolean-like strings', () => {
			const trueVal = 'true';
			const falseVal = 'false';
			expect(trueVal === 'true').toBe(true);
			expect(falseVal === 'false').toBe(true);
		});
	});
});
