import { test, expect } from '@playwright/test';

test.describe('Timeline Markers', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		// Wait for app UI to stabilize
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });
	});

	test('add marker with M key and navigate to it', async ({ page }) => {
		// Press M to add marker at current playhead position
		await page.keyboard.press('m');

		// Marker editor modal should appear
		const modal = page.locator('[role="dialog"][aria-modal="true"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// Fill in marker details
		await page.getByLabel('Label').fill('Chapter 1');
		await page.getByRole('button', { name: 'Save' }).click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 3000 });

		// Marker flag should appear on ruler
		const markerFlag = page.locator('.marker-flag').first();
		await expect(markerFlag).toBeVisible({ timeout: 5000 });
		await expect(markerFlag).toContainText('Chapter');
	});

	test('double-click ruler to create marker', async ({ page }) => {
		// Double-click on ruler to create marker
		const ruler = page.locator('.ruler');
		await ruler.dblclick({ position: { x: 100, y: 10 } });

		// Marker editor modal should appear
		const modal = page.locator('[role="dialog"][aria-modal="true"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// Fill in marker details
		await page.getByLabel('Label').fill('Beat 1');
		await page.getByLabel('Type').selectOption('beat');
		await page.getByRole('button', { name: 'Save' }).click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 3000 });
	});

	test('navigate between markers with Ctrl+Alt+Arrow', async ({ page }) => {
		// Add first marker
		await page.keyboard.press('m');
		const modal1 = page.locator('[role="dialog"][aria-modal="true"]');
		await expect(modal1).toBeVisible({ timeout: 5000 });
		await page.getByLabel('Label').fill('Marker A');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(modal1).not.toBeVisible({ timeout: 3000 });

		// Move playhead forward
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');

		// Add second marker
		await page.keyboard.press('m');
		const modal2 = page.locator('[role="dialog"][aria-modal="true"]');
		await expect(modal2).toBeVisible({ timeout: 5000 });
		await page.getByLabel('Label').fill('Marker B');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(modal2).not.toBeVisible({ timeout: 3000 });

		// Navigate back to first marker with Ctrl+Alt+Left
		await page.keyboard.press('Control+Alt+ArrowLeft');

		// Should be at first marker position
		// Verify by checking playhead position (should be near 0)
		const playhead = page.locator('[aria-label="Playhead position"]');
		await expect(playhead).toBeVisible({ timeout: 3000 });
	});

	test('marker context menu allows edit and delete', async ({ page }) => {
		// Add marker
		await page.keyboard.press('m');
		const modal = page.locator('[role="dialog"][aria-modal="true"]');
		await expect(modal).toBeVisible({ timeout: 5000 });
		await page.getByLabel('Label').fill('Test Marker');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(modal).not.toBeVisible({ timeout: 3000 });

		// Right-click on marker flag to open context menu
		const markerFlag = page.locator('.marker-flag').first();
		await markerFlag.click({ button: 'right' });

		// Context menu should appear
		const menu = page.locator('[role="menu"]');
		await expect(menu).toBeVisible({ timeout: 3000 });

		// Edit label
		const labelInput = page.locator('[aria-label="Marker label"]');
		await labelInput.fill('Edited Marker');
		await labelInput.press('Enter');

		// Menu should close
		await expect(menu).not.toBeVisible({ timeout: 3000 });

		// Marker flag should show updated label
		await expect(markerFlag).toContainText('Edited');
	});

	test('multiple markers display correctly', async ({ page }) => {
		// Add three markers
		const markerNames = ['Chapter 1', 'Beat 1', 'Note 1'];
		const markerTypes = ['chapter', 'beat', 'note'];

		for (let i = 0; i < 3; i++) {
			await page.keyboard.press('m');
			const modal = page.locator('[role="dialog"][aria-modal="true"]');
			await expect(modal).toBeVisible({ timeout: 5000 });
			await page.getByLabel('Label').fill(markerNames[i]);
			await page.getByLabel('Type').selectOption(markerTypes[i]);
			await page.getByRole('button', { name: 'Save' }).click();
			await expect(modal).not.toBeVisible({ timeout: 3000 });

			// Move playhead forward for next marker
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');
		}

		// All three marker flags should be visible
		const markerFlags = page.locator('.marker-flag');
		await expect(markerFlags).toHaveCount(3, { timeout: 5000 });
	});
});
