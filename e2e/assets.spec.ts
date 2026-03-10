import { test, expect } from '@playwright/test';

test.describe('AssetManager CRUD', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/timeline');
		await page.locator('[aria-label="Asset Manager"]').waitFor();
	});

	test('add character creates new row with default name', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = assetManager.locator('[aria-label="Add character"]');

		const initialCount = await assetManager.locator('[aria-label^="Character "]').count();
		await addBtn.click();

		const rows = assetManager.locator('[aria-label^="Character "]');
		await expect(rows).toHaveCount(initialCount + 1);
		await expect(rows.last()).toContainText('New Character');
	});

	test('edit character name updates the displayed name', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// First add a character so we have a fresh one
		await assetManager.locator('[aria-label="Add character"]').click();

		// The edit form should be open (toggleEdit is called on addCharacter)
		const nameInput = assetManager.locator('[aria-label="Character name"]').last();
		await expect(nameInput).toBeVisible();

		await nameInput.fill('Hero');
		// Trigger input event via tab/blur
		await nameInput.press('Tab');

		// The character row should now show "Hero"
		await expect(assetManager.locator('[aria-label^="Character Hero"]')).toBeVisible();
	});

	test('delete character removes it from the list', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');

		// Add a character first
		await assetManager.locator('[aria-label="Add character"]').click();
		const rows = assetManager.locator('[aria-label^="Character "]');
		const countBefore = await rows.count();

		// Delete the last character using its delete button
		const lastRow = assetManager.locator('[aria-label^="Character "]').last();
		const deleteBtn = lastRow.locator('button[title^="Delete"]');
		await deleteBtn.click();

		await expect(rows).toHaveCount(countBefore - 1);
	});

	test('add environment creates new entry', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = assetManager.locator('[aria-label="Add environment"]');

		const initialCount = await assetManager.locator('[aria-label^="Environment "]').count();
		await addBtn.click();

		const envRows = assetManager.locator('[aria-label^="Environment "]');
		await expect(envRows).toHaveCount(initialCount + 1);
	});

	test('add audio asset creates new entry', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const addBtn = assetManager.locator('[aria-label="Add audio"]');

		const initialCount = await assetManager.locator('[aria-label^="Audio "]').count();
		await addBtn.click();

		const audioRows = assetManager.locator('[aria-label^="Audio "]');
		await expect(audioRows).toHaveCount(initialCount + 1);
	});

	test('selecting a character shows Character in PropertiesPanel', async ({ page }) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		const firstChar = assetManager.locator('[aria-label^="Character "]').first();
		await firstChar.click();

		await expect(firstChar).toHaveAttribute('aria-selected', 'true');

		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.getByText('Character', { exact: false })).toBeVisible();
	});
});
