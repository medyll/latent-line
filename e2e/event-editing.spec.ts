import { test, expect } from '@playwright/test';

test.describe('Shot editing', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await page.getByRole('button', { name: 'Add shot' }).waitFor();
	});

	test('opens the current shot editor from a storyboard card', async ({ page }) => {
		const shot = page.locator('[data-testid^="shot-"]').first();
		await shot.dblclick();

		const editor = page.getByRole('dialog', { name: 'Edit shot' });
		await expect(editor).toBeVisible();
		await expect(editor.getByLabel('Duration (frames)')).toBeVisible();
	});

	test('edits and saves dialogue text', async ({ page }) => {
		const shot = page.locator('[data-testid^="shot-"]').first();
		await shot.dblclick();

		const editor = page.getByRole('dialog', { name: 'Edit shot' });
		await editor.getByLabel('Dialogue').fill('Updated speech text');
		await editor.getByRole('button', { name: 'Save' }).click();

		await expect(shot).toContainText('Updated speech text');
	});

	test('selects and deselects a shot', async ({ page }) => {
		const shot = page.locator('[data-testid^="shot-"]').first();

		await shot.click();
		await expect(shot).toHaveAttribute('aria-pressed', 'true');

		await shot.click();
		await expect(shot).toHaveAttribute('aria-pressed', 'false');
	});

	test('selection moves between shots', async ({ page }) => {
		const shots = page.locator('[data-testid^="shot-"]');
		await expect(shots).toHaveCount(12);

		const first = shots.nth(0);
		const second = shots.nth(1);
		await first.click();
		await second.click();

		await expect(first).toHaveAttribute('aria-pressed', 'false');
		await expect(second).toHaveAttribute('aria-pressed', 'true');
	});
});
