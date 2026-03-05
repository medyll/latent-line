import { expect, test } from '@playwright/test';

test.describe('/timeline route interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/timeline');
		// Wait for AssetManager to render
		await page.locator('[aria-label="Asset Manager"]').waitFor();
	});

	test('clicking a character row highlights it and shows Character in PropertiesPanel', async ({
		page
	}) => {
		const assetManager = page.locator('[aria-label="Asset Manager"]');
		// Get the first character option
		const firstCharRow = assetManager.locator('[role="option"]').first();
		await firstCharRow.click();

		// Row should be aria-selected
		await expect(firstCharRow).toHaveAttribute('aria-selected', 'true');

		// Row should have selection background
		await expect(firstCharRow).toHaveClass(/bg-blue-100/);

		// PropertiesPanel should show "Character"
		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.getByText('Character', { exact: false })).toBeVisible();
	});

	test('clicking a timeline event card shows its label in PropertiesPanel', async ({ page }) => {
		// Click the first timeline event card
		const firstEventCard = page.locator('[aria-label^="Timeline event"]').first();
		const label = await firstEventCard.getAttribute('aria-label');
		const eventLabel = label?.replace('Timeline event ', '') ?? 'Event 1';

		await firstEventCard.click();

		// Card should be aria-selected
		await expect(firstEventCard).toHaveAttribute('aria-selected', 'true');

		// PropertiesPanel should show the event label
		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.getByText(eventLabel, { exact: false })).toBeVisible();
	});

	test('clicking same timeline event again clears selection and shows empty state', async ({
		page
	}) => {
		const firstEventCard = page.locator('[aria-label^="Timeline event"]').first();

		// Select
		await firstEventCard.click();
		await expect(firstEventCard).toHaveAttribute('aria-selected', 'true');

		// Deselect
		await firstEventCard.click();
		await expect(firstEventCard).toHaveAttribute('aria-selected', 'false');

		// PropertiesPanel should show empty state
		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.locator('[aria-label="No selection"]')).toBeVisible();
	});
});
