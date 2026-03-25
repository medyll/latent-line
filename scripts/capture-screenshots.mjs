import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const baselineDir = path.join(projectRoot, '.github', 'screenshots', 'baseline');
const currentDir = path.join(projectRoot, '.github', 'screenshots', 'current');
const listPath = path.join(projectRoot, 'scripts', 'screenshot-list.json');

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

function isReachable(url) {
	return new Promise((resolve) => {
		try {
			const req = http.get(url, (res) => {
				res.resume();
				resolve(true);
			});
			req.on('error', () => resolve(false));
			req.setTimeout(2000, () => {
				req.destroy();
				resolve(false);
			});
		} catch (e) {
			resolve(false);
		}
	});
}

async function waitForServer(url, timeout = 60000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		const ok = await isReachable(url);
		if (ok) return;
		await sleep(500);
	}
	throw new Error(`Timed out waiting for ${url}`);
}

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function safeFilename(name) {
	return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

async function captureListTo(dir, list, baseUrl) {
	ensureDir(dir);

	const browser = await chromium.launch();
	try {
		for (const theme of ['light', 'dark']) {
			const context = await browser.newContext({
				viewport: { width: 1920, height: 1080 },
				colorScheme: theme
			});
			const page = await context.newPage();

			for (const item of list) {
				const name = item.name || 'component';
				const url = (item.url || '/').startsWith('http')
					? item.url || '/'
					: baseUrl.replace(/\/$/, '') + (item.url || '/');
				const filename = `${safeFilename(name)}-${theme}.png`;
				const outPath = path.join(dir, filename);

				try {
					console.log(`Navigating to ${url} for ${name} (${theme})`);
					await page.goto(url, { waitUntil: 'networkidle' });
					await page.waitForTimeout(300);

					if (item.selector) {
						const el = await page.$(item.selector);
						if (el) {
							await el.screenshot({ path: outPath });
							console.log(`Captured element ${item.selector} → ${outPath}`);
						} else {
							console.warn(
								`Selector not found: ${item.selector} on ${url}; falling back to full page`
							);
							await page.screenshot({ path: outPath, fullPage: true });
						}
					} else {
						await page.screenshot({ path: outPath, fullPage: true });
						console.log(`Captured full page → ${outPath}`);
					}
				} catch (err) {
					console.error(`Failed to capture ${name} at ${url}:`, err.message);
				}
			}

			await context.close();
		}
	} finally {
		await browser.close();
	}
}

async function main() {
	const mode = process.argv[2] || 'baseline'; // 'baseline' or 'current'
	const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
	let outDir = mode === 'current' ? currentDir : baselineDir;

	// Read list
	let list = [];
	if (fs.existsSync(listPath)) {
		try {
			list = JSON.parse(fs.readFileSync(listPath, 'utf-8'));
		} catch (e) {
			console.warn('Failed to read screenshot-list.json, falling back to defaults');
		}
	}

	if (!list || list.length === 0) {
		// sensible defaults (may need edits)
		list = [
			{ name: 'SequenceOrchestrator', url: '/timeline' },
			{ name: 'SynopticView', url: '/timeline' },
			{ name: 'TemporalSequencer', url: '/timeline' },
			{ name: 'AudioTimeline', url: '/timeline' },
			{ name: 'PropertiesPanel', url: '/timeline' },
			{ name: 'CharacterField', url: '/timeline' },
			{ name: 'AssetManager', url: '/timeline' },
			{ name: 'SystemFooter', url: '/timeline' },
			{ name: 'TimelineSelection', url: '/timeline' },
			{ name: 'CardEmptyState1', url: '/timeline' },
			{ name: 'CardEmptyState2', url: '/timeline' },
			{ name: 'CardEmptyState3', url: '/timeline' },
			{ name: 'TimelineHeader', url: '/timeline' },
			{ name: 'TimelineFooter', url: '/timeline' }
		];
	}

	// If server not reachable, start dev server
	let devProc = null;
	try {
		const reachable = await isReachable(baseUrl);
		if (!reachable) {
			console.log(`Dev server not reachable at ${baseUrl}; starting 'pnpm run dev'`);
			devProc = spawn('pnpm', ['run', 'dev'], { cwd: projectRoot, shell: true, stdio: 'inherit' });
			// wait for server
			await waitForServer(baseUrl, 60000);
			console.log('Dev server reachable');
			// small pause to ensure app mounted
			await sleep(500);
		}

		console.log(`Capturing screenshots to ${outDir} (baseUrl=${baseUrl})`);
		await captureListTo(outDir, list, baseUrl);

		console.log('Capture complete.');
		process.exit(0);
	} catch (err) {
		console.error('Error during capture:', err.message || err);
		process.exit(1);
	} finally {
		if (devProc) {
			try {
				console.log('Stopping dev server...');
				devProc.kill('SIGINT');
			} catch (e) {
				// ignore
			}
		}
	}
}

main();
