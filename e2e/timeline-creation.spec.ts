import { test, expect } from '@playwright/test';

test.describe('Timeline creation and export flows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await page.getByRole('button', { name: 'Add shot' }).waitFor();
	});

	test('creates, edits and selects a shot', async ({ page }) => {
		const shots = page.locator('[data-testid^="shot-"]');
		const initialCount = await shots.count();

		await page.getByRole('button', { name: 'Add shot' }).click();
		const editor = page.getByRole('dialog', { name: 'Edit shot' });
		await expect(editor).toBeVisible();
		await editor.getByLabel('Notes').fill('Created from timeline test');
		await editor.getByRole('button', { name: 'Save' }).click();

		await expect(shots).toHaveCount(initialCount + 1);
		const created = shots.nth(initialCount);
		await expect(created).toHaveAttribute('aria-pressed', 'true');
	});

	test('adds a character asset', async ({ page }) => {
		const rows = page.locator('[data-testid^="asset-char-"]');
		const initialCount = await rows.count();

		await page.getByRole('button', { name: 'Add character' }).click();

		await expect(rows).toHaveCount(initialCount + 1);
		await expect(page.getByLabel('Character name')).toBeVisible();
	});

	test('exports all three video pipeline formats', async ({ page }) => {
		for (const format of [
			{ tab: 'Deforum', extension: '.json' },
			{ tab: 'FramePack', extension: '.jsonl' },
			{ tab: 'CogVideoX', extension: '.txt' }
		]) {
			await page.getByRole('button', { name: 'Exporter' }).click();
			const dialog = page.getByRole('dialog', { name: 'Export' });
			await dialog.getByRole('tab', { name: format.tab }).click();

			const downloadPromise = page.waitForEvent('download');
			await dialog.getByRole('button', { name: 'Télécharger' }).click();
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toContain(format.extension);
		}
	});

	test('seeks the timeline playhead', async ({ page }) => {
		const timeline = page.getByRole('application', { name: 'Timeline', exact: true });
		const timecode = page.locator('.tc-time').first();
		await expect(timecode).toHaveText('00:00:00');

		await timeline.click({ position: { x: 300, y: 40 } });
		await expect(timecode).not.toHaveText('00:00:00');
	});
});
