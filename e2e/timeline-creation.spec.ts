import { test, expect } from '@playwright/test';

test.describe('Timeline creation & flows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/app', { waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor();
	});

	test('creates a timeline event and selects it', async ({ page }) => {
		await page.locator('button[aria-label="Add timeline event"]').waitFor({ timeout: 20000 });
		await page.locator('button[aria-label="Add timeline event"]').click();
		const frame = page.locator('[aria-label^="Frame "]').last();
		await expect(frame).toBeVisible();
		await expect(frame).toHaveAttribute('aria-selected', 'true');
	});

	test('adds a character asset', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = assetManager.locator('[aria-label="Add character"]');

		const initialCount = await assetManager.locator('[aria-label^="Character "]').count();
		await addBtn.click();
		const rows = assetManager.locator('ul[aria-label="Characters"] > li');
		// wait for the new inline input to appear and be visible
		await rows.last().locator('input[aria-label="Character name"]').waitFor({ timeout: 10000 }).catch(()=>{});
		// ensure PropertiesPanel settled too
		await page.waitForSelector('[data-testid="pp-sync-ready"][data-immediate="true"]', { timeout: 10000 }).catch(()=>{});
		const newCount = await rows.count();
		expect(newCount).toBeGreaterThan(initialCount);
		// The last row contains an input for the character name; ensure it's focusable and editable
		const lastRowText = await rows.last().innerText().catch(()=>'');
		if (!lastRowText || lastRowText.trim().length === 0) {
			// fallback: ensure the input exists
			await expect(rows.last().locator('input[aria-label="Character name"]')).toBeVisible();
		} else {
			await expect(rows.last()).toContainText('New Character');
		}
	});

	test('exports model JSON as a download', async ({ page }) => {
		const exportBtn = page.locator('button[aria-label="Export JSON"]');
		await exportBtn.waitFor({ timeout: 20000 });
		await expect(exportBtn).toBeVisible();

		const [download] = await Promise.all([
			page.waitForEvent('download'),
			exportBtn.click()
		]);

		const filename = await download.suggestedFilename();
		expect(filename).toBe('model.json');
		const filePath = await download.path();
		expect(filePath).toBeTruthy();
	});

	test('sets playhead when clicking the timeline track', async ({ page }) => {
		// Ensure there is at least one event so timeline area has content
		await page.locator('button[aria-label="Add timeline event"]').waitFor({ timeout: 20000 });
		await page.locator('button[aria-label="Add timeline event"]').click();
		const track = page.locator('[aria-label="Timeline track"]');
		await expect(track).toBeVisible();

		// Click at x=200 relative to the track
		await track.click({ position: { x: 200, y: 20 } });
		const playhead = page.locator('[aria-label^="Playhead at frame"]');
		await expect(playhead).toBeVisible();
		const label = await playhead.getAttribute('aria-label');
		expect(label).toMatch(/Playhead at frame \d+/);
	});
});
