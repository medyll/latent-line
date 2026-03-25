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
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		// use data-testid to ensure we click the native button
		const addBtn = page.locator('[data-testid="add-character"]');

		const initialCount = await assetManager
			.locator('ul[aria-label="Characters"] [role="option"]')
			.count();
		await addBtn.click();
		// wait for selection immediate marker to ensure DOM has settled
		await page
			.waitForSelector('[data-testid="pp-selection-ready"][data-immediate="true"]', {
				timeout: T.ui
			})
			.catch(() => {});

		// A new character option should be added
		await expect(assetManager.locator('ul[aria-label="Characters"] [role="option"]')).toHaveCount(
			initialCount + 1,
			{
				timeout: T.ui
			}
		);
	});

	test('edit character name updates the displayed name', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// First add a character so we have a fresh one
		await page.locator('[data-testid="add-character"]').click();

		// Click the last character row to open its edit form
		const lastRow = assetManager.locator('ul[aria-label="Characters"] [role="option"]').last();
		await lastRow.click();
		const nameInput = assetManager.locator('input[aria-label="Character name"]').last();
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
		const lastRow = assetManager.locator('ul[aria-label="Characters"] [role="option"]').last();
		const lastLabel = await lastRow.getAttribute('aria-label');
		const deleteBtn = lastRow.locator('button[title^="Delete"]');
		await deleteBtn.click();

		if (lastLabel) {
			await expect(
				assetManager
					.locator('ul[aria-label="Characters"] [role="option"]')
					.filter({ hasText: lastLabel })
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
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = page.locator('[data-testid="add-environment"]');

		const initialCount = await assetManager
			.locator('ul[aria-label="Environments"] [role="option"]')
			.count();
		await addBtn.click();

		await expect(assetManager.locator('ul[aria-label="Environments"] [role="option"]')).toHaveCount(
			initialCount + 1,
			{
				timeout: T.ui
			}
		);
	});

	test('add audio asset creates new entry', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = page.locator('[data-testid="add-audio"]');

		await addBtn.waitFor({ timeout: T.ui });
		await addBtn.scrollIntoViewIfNeeded();
		const initialCount = await assetManager
			.locator('ul[aria-label="Audio assets"] [role="option"]')
			.count();
		// Use dispatchEvent to bypass Svelte 5 event delegation quirk with onpointerdown+onclick
		await addBtn.dispatchEvent('click');

		await expect(assetManager.locator('ul[aria-label="Audio assets"] [role="option"]')).toHaveCount(
			initialCount + 1,
			{
				timeout: T.ui
			}
		);
	});

	test('selecting a character marks the row as selected', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// Ensure there is at least one character
		const chars = assetManager.locator('ul[aria-label="Characters"] li[role="option"]');
		if ((await chars.count()) === 0) {
			await page.locator('[data-testid="add-character"]').click();
			await expect(chars).toHaveCount(1, { timeout: T.ui });
		}

		await chars.first().click();

		// The clicked row should be marked as selected
		await expect(chars.first()).toHaveAttribute('aria-selected', 'true', { timeout: T.ui });
	});
});
