import { test, expect } from '@playwright/test';

test('selecting a timeline event shows properties in the panel', async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' });

	// Wait for app UI to stabilize
	const amDebug = page.locator('[data-testid="am-debug-visible"]');
	await amDebug.waitFor({ timeout: 20000 });
	await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

	// Initially no selection
	const noSel = page.locator('[aria-label="No selection"]');
	await expect(noSel).toBeVisible({ timeout: 5000 });

	// Use a stable event locator and wait before interacting
	const event = page.getByTitle('Event 1');
	await event.waitFor({ timeout: 10000 });
	await event.click({ timeout: 5000 });

	// Properties panel should show the selected event label
	const props = page.locator('[aria-label="Properties Panel"]');
	await props.waitFor({ timeout: 10000 });
	await expect(props).toContainText('Event 1', { timeout: 5000 });
});
