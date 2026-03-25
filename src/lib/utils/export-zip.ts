/**
 * Minimal ZIP writer — STORED method (no compression), text files only.
 * No external dependencies.
 */

const enc = new TextEncoder();

function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		crc ^= data[i];
		for (let j = 0; j < 8; j++) {
			crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): number[] {
	return [n & 0xff, (n >> 8) & 0xff];
}
function u32(n: number): number[] {
	return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

export interface ZipEntry {
	name: string;
	content: string;
}

/** Build a ZIP Uint8Array from text file entries (STORED, no compression). */
export function buildZip(files: ZipEntry[]): Uint8Array {
	const parts: Uint8Array[] = [];
	const centralDir: Uint8Array[] = [];
	const localOffsets: number[] = [];
	let offset = 0;

	const now = new Date();
	const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
	const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

	for (const file of files) {
		const nameBytes = enc.encode(file.name);
		const dataBytes = enc.encode(file.content);
		const crc = crc32(dataBytes);
		const size = dataBytes.length;

		localOffsets.push(offset);

		const localHeader = new Uint8Array([
			0x50,
			0x4b,
			0x03,
			0x04, // local file header signature
			...u16(20), // version needed
			...u16(0), // general purpose bit flag
			...u16(0), // compression method: STORED
			...u16(dosTime),
			...u16(dosDate),
			...u32(crc),
			...u32(size), // compressed size
			...u32(size), // uncompressed size
			...u16(nameBytes.length),
			...u16(0), // extra field length
			...nameBytes
		]);
		parts.push(localHeader, dataBytes);
		offset += localHeader.length + dataBytes.length;

		centralDir.push(
			new Uint8Array([
				0x50,
				0x4b,
				0x01,
				0x02, // central directory signature
				...u16(20), // version made by
				...u16(20), // version needed
				...u16(0), // flags
				...u16(0), // compression
				...u16(dosTime),
				...u16(dosDate),
				...u32(crc),
				...u32(size),
				...u32(size),
				...u16(nameBytes.length),
				...u16(0), // extra field
				...u16(0), // file comment
				...u16(0), // disk start
				...u16(0), // internal attrs
				...u32(0), // external attrs
				...u32(localOffsets[localOffsets.length - 1]),
				...nameBytes
			])
		);
	}

	const cdOffset = offset;
	let cdSize = 0;
	for (const cd of centralDir) {
		parts.push(cd);
		cdSize += cd.length;
	}

	parts.push(
		new Uint8Array([
			0x50,
			0x4b,
			0x05,
			0x06, // end of central directory signature
			...u16(0), // disk number
			...u16(0), // disk with start of CD
			...u16(files.length), // entries on disk
			...u16(files.length), // total entries
			...u32(cdSize),
			...u32(cdOffset),
			...u16(0) // comment length
		])
	);

	const total = parts.reduce((s, p) => s + p.length, 0);
	const result = new Uint8Array(total);
	let pos = 0;
	for (const part of parts) {
		result.set(part, pos);
		pos += part.length;
	}
	return result;
}
