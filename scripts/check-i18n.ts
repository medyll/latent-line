/**
 * check-i18n.ts — CI script to verify FR and EN message files have matching keys.
 * Usage: npx tsx scripts/check-i18n.ts
 * Exit code 1 if any keys are missing in either locale.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = resolve(__dirname, '../src/lib/i18n/messages');

function load(lang: string): Record<string, string> {
	return JSON.parse(readFileSync(resolve(base, `${lang}.json`), 'utf-8'));
}

const en = load('en');
const fr = load('fr');

const enKeys = new Set(Object.keys(en));
const frKeys = new Set(Object.keys(fr));

const missingInFr = [...enKeys].filter((k) => !frKeys.has(k));
const missingInEn = [...frKeys].filter((k) => !enKeys.has(k));

let hasError = false;

if (missingInFr.length) {
	console.error(`\n❌ Keys in EN but missing in FR (${missingInFr.length}):`);
	missingInFr.forEach((k) => console.error(`  - ${k}`));
	hasError = true;
}

if (missingInEn.length) {
	console.error(`\n❌ Keys in FR but missing in EN (${missingInEn.length}):`);
	missingInEn.forEach((k) => console.error(`  - ${k}`));
	hasError = true;
}

if (!hasError) {
	console.log(`✅ i18n parity OK — ${enKeys.size} keys in both EN and FR`);
	process.exit(0);
} else {
	process.exit(1);
}
