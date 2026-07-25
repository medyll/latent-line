import { test, expect } from '@playwright/test';

test.describe('AssetManager CRUD', () => {
	const T = { ui: 20000 };

	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		// Wait for Asset Manager debug element to be visible to ensure stores initialized
		await page.locator('[data-testid="am-debug-visible"]').waitFor({ timeout: T.ui });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: T.ui });
	});

	test('add character creates new row with default name', async ({ page }) => {
		// use data-testid to ensure we click the native button
		const addBtn = page.locator('[data-testid="add-character"]');

		const characterRows = page.locator('[data-testid^="asset-char-"]');
		const initialCount = await characterRows.count();
		await addBtn.click();
		// wait for selection immediate marker to ensure DOM has settled
		await page
			.waitForSelector('[data-testid="pp-selection-ready"][data-immediate="true"]', {
				timeout: T.ui
			})
			.catch(() => {});

		// A new character option should be added
		await expect(characterRows).toHaveCount(initialCount + 1, { timeout: T.ui });
	});

	test('edit character name updates the displayed name', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// First add a character so we have a fresh one
		await page.locator('[data-testid="add-character"]').click();

		// Click the last character row to open its edit form
		const rows = page.locator('[data-testid^="asset-char-"]');
		const rowCount = await rows.count();
		const lastRow = rows.nth(rowCount - 1);
		await lastRow.click();
		const nameInput = lastRow.locator('input[aria-label="Character name"]');
		await expect(nameInput).toBeVisible({ timeout: T.ui });

		await nameInput.fill('Hero');
		// Trigger input event via tab/blur
		await nameInput.press('Tab');

		// The character row should now show "Hero" somewhere in the characters list
		await expect(assetManager.locator('ul[aria-label="Characters"]').getByText('Hero')).toBeVisible(
			{ timeout: T.ui }
		);
	});

	test('delete character removes it from the list', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// Add a character first
		await page.locator('[data-testid="add-character"]').click();
		// Delete the last character using its delete button and assert the specific row disappears
		const rows = page.locator('[data-testid^="asset-char-"]');
		const rowCount = await rows.count();
		const lastRow = rows.nth(rowCount - 1);
		const lastLabel = await lastRow.getAttribute('aria-label');
		const deleteBtn = lastRow.locator('button[title^="Delete"]');
		await deleteBtn.click();

		if (lastLabel) {
			await expect(
				assetManager.locator('[data-testid^="asset-char-"]').filter({ hasText: lastLabel })
			).toHaveCount(0, {
				timeout: T.ui
			});
		} else {
			// Fallback: ensure characters list no longer contains 'New Character'
			await expect(
				assetManager.locator('ul[aria-label="Characters"]').getByText('New Character')
			).toHaveCount(0, { timeout: T.ui });
		}
	});

	test('add environment creates new entry', async ({ page }) => {
		const addBtn = page.locator('[data-testid="add-environment"]');

		const environmentRows = page.locator('[data-testid^="asset-env-"]');
		const initialCount = await environmentRows.count();
		await addBtn.click();

		await expect(environmentRows).toHaveCount(initialCount + 1, { timeout: T.ui });
	});

	test('add audio asset creates new entry', async ({ page }) => {
		const addBtn = page.locator('[data-testid="add-audio"]');

		await addBtn.waitFor({ timeout: T.ui });
		await addBtn.scrollIntoViewIfNeeded();
		const audioRows = page.locator('[data-testid^="asset-audio-"]');
		const initialCount = await audioRows.count();
		// Use dispatchEvent to bypass Svelte 5 event delegation quirk with onpointerdown+onclick
		await addBtn.dispatchEvent('click');

		await expect(audioRows).toHaveCount(initialCount + 1, { timeout: T.ui });
	});

	test('selecting a character marks the row as selected', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// Ensure there is at least one character
		const chars = page.locator('[data-testid^="asset-char-"]');
		if ((await chars.count()) === 0) {
			await page.locator('[data-testid="add-character"]').click();
			await expect(chars).toHaveCount(1, { timeout: T.ui });
		}

		const firstCharacter = chars.first().getByRole('button', { name: /Character / });
		await firstCharacter.click();

		// The clicked row should be marked as selected
		await expect(firstCharacter).toHaveAttribute('aria-pressed', 'true', { timeout: T.ui });
	});
});
