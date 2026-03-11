import { test, expect } from '@playwright/test';

test.describe('Timeline creation & flows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/timeline', { waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor();
	});

	test('creates a timeline event and selects it', async ({ page }) => {
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

		const rows = assetManager.locator('[aria-label^="Character "]');
		await expect(rows).toHaveCount(initialCount + 1);
		await expect(rows.last()).toContainText('New Character');
	});

	test('exports model JSON as a download', async ({ page }) => {
		const exportBtn = page.locator('button[aria-label="Export JSON"]');
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
