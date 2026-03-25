/** Trigger a file download from a Blob or string content. */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function downloadText(
	content: string,
	filename: string,
	mimeType = 'text/plain;charset=utf-8'
): void {
	downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function downloadBytes(
	bytes: Uint8Array,
	filename: string,
	mimeType = 'application/octet-stream'
): void {
	downloadBlob(new Blob([bytes], { type: mimeType }), filename);
}

/** Format today as YYYY-MM-DD for filenames. */
export function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}
