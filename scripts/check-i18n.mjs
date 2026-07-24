/**
 * CI check ensuring the French and English catalogues expose identical keys.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const messagesDirectory = resolve(scriptDirectory, '../src/lib/i18n/messages');

function load(language) {
	return JSON.parse(readFileSync(resolve(messagesDirectory, `${language}.json`), 'utf-8'));
}

const englishKeys = new Set(Object.keys(load('en')));
const frenchKeys = new Set(Object.keys(load('fr')));

const missingInFrench = [...englishKeys].filter((key) => !frenchKeys.has(key));
const missingInEnglish = [...frenchKeys].filter((key) => !englishKeys.has(key));

if (missingInFrench.length > 0) {
	console.error(`\nKeys in EN but missing in FR (${missingInFrench.length}):`);
	missingInFrench.forEach((key) => console.error(`  - ${key}`));
}

if (missingInEnglish.length > 0) {
	console.error(`\nKeys in FR but missing in EN (${missingInEnglish.length}):`);
	missingInEnglish.forEach((key) => console.error(`  - ${key}`));
}

if (missingInFrench.length > 0 || missingInEnglish.length > 0) {
	process.exit(1);
}

console.log(`i18n parity OK — ${englishKeys.size} keys in both EN and FR`);
