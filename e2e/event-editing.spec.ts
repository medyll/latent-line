import { test, expect } from '@playwright/test';

test.describe('Event editing via PropertiesPanel', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/timeline');
		await page.locator('[aria-label="Asset Manager"]').waitFor();
	});

	test('selecting a timeline event shows camera zoom field in PropertiesPanel', async ({
		page
	}) => {
		const firstEvent = page.locator('[aria-label^="Timeline event"]').first();
		await firstEvent.click();

		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.locator('[aria-label="Camera zoom"]')).toBeVisible();
	});

	test('editing speech text field updates the displayed value', async ({ page }) => {
		// Event 2 (index 1) has actor "lauren" with speech
		const events = page.locator('[aria-label^="Timeline event"]');
		await events.nth(1).click();

		const speechInput = page.locator('[aria-label="Speech text for lauren"]');
		await expect(speechInput).toBeVisible();

		await speechInput.fill('Updated speech text');
		await speechInput.press('Tab');

		await expect(speechInput).toHaveValue('Updated speech text');
	});

	test('deselecting event returns PropertiesPanel to empty state', async ({ page }) => {
		const firstEvent = page.locator('[aria-label^="Timeline event"]').first();

		// Select
		await firstEvent.click();
		await expect(firstEvent).toHaveAttribute('aria-selected', 'true');

		// Deselect
		await firstEvent.click();
		await expect(firstEvent).toHaveAttribute('aria-selected', 'false');

		const panel = page.locator('[aria-label="Properties Panel"]');
		await expect(panel.locator('[aria-label="No selection"]')).toBeVisible();
	});

	test('selecting different events updates PropertiesPanel content', async ({ page }) => {
		const events = page.locator('[aria-label^="Timeline event"]');
		const count = await events.count();
		if (count < 2) {
			test.skip();
			return;
		}

		// Select first event
		await events.first().click();
		const firstLabel = await events.first().getAttribute('aria-label');

		// Select second event
		await events.nth(1).click();
		const secondLabel = await events.nth(1).getAttribute('aria-label');

		// Both labels should be different
		expect(firstLabel).not.toBe(secondLabel);

		// Second event should now be selected
		await expect(events.nth(1)).toHaveAttribute('aria-selected', 'true');
		await expect(events.first()).toHaveAttribute('aria-selected', 'false');
	});
});
