import { describe, it, expect } from 'vitest';
import { buildZip } from './export-zip';

describe('buildZip', () => {
	it('returns a Uint8Array', () => {
		const zip = buildZip([{ name: 'hello.txt', content: 'Hello, world!' }]);
		expect(zip).toBeInstanceOf(Uint8Array);
	});

	it('starts with PK local file header signature', () => {
		const zip = buildZip([{ name: 'a.txt', content: 'test' }]);
		// Local file header: 0x50 0x4b 0x03 0x04
		expect(zip[0]).toBe(0x50);
		expect(zip[1]).toBe(0x4b);
		expect(zip[2]).toBe(0x03);
		expect(zip[3]).toBe(0x04);
	});

	it('ends with end-of-central-directory signature', () => {
		const zip = buildZip([{ name: 'a.txt', content: 'test' }]);
		const len = zip.length;
		// EOCD signature at offset -22: 0x50 0x4b 0x05 0x06
		expect(zip[len - 22]).toBe(0x50);
		expect(zip[len - 21]).toBe(0x4b);
		expect(zip[len - 20]).toBe(0x05);
		expect(zip[len - 19]).toBe(0x06);
	});

	it('handles multiple files', () => {
		const zip = buildZip([
			{ name: 'a.txt', content: 'aaa' },
			{ name: 'b.txt', content: 'bbb' },
			{ name: 'c.json', content: '{}' }
		]);
		expect(zip.length).toBeGreaterThan(100);
		// EOCD: total entries = 3 (bytes at len-8, len-7 as u16 LE)
		const len = zip.length;
		const totalEntries = zip[len - 12] | (zip[len - 11] << 8);
		expect(totalEntries).toBe(3);
	});

	it('handles empty file list', () => {
		const zip = buildZip([]);
		// Should still have valid EOCD
		expect(zip.length).toBe(22);
		expect(zip[0]).toBe(0x50);
		expect(zip[1]).toBe(0x4b);
	});

	it('encodes file content correctly (content is ASCII-recoverable)', () => {
		const content = 'Hello ZIP!';
		const zip = buildZip([{ name: 'test.txt', content }]);
		// The content starts after local header (30 + filename length)
		const filenameLen = 'test.txt'.length; // 8
		const headerSize = 30 + filenameLen;
		const enc = new TextEncoder();
		const expected = enc.encode(content);
		const actual = zip.slice(headerSize, headerSize + content.length);
		expect(actual).toEqual(expected);
	});
});
