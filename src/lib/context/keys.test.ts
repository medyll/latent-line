import { describe, it, expect } from 'vitest';
import { ASSET_STORE_KEY } from './keys';

describe('Context Keys', () => {
	it('ASSET_STORE_KEY is a Symbol', () => {
		expect(typeof ASSET_STORE_KEY).toBe('symbol');
	});

	it('ASSET_STORE_KEY has the correct description', () => {
		expect(ASSET_STORE_KEY.description).toBe('assetStore');
	});

	it('ASSET_STORE_KEY is unique (no two calls produce the same Symbol)', () => {
		const key2 = Symbol('assetStore');
		expect(ASSET_STORE_KEY).not.toBe(key2);
	});
});
