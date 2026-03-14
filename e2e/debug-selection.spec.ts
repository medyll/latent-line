import { test } from '@playwright/test';

test('debug selection', async ({ page }) => {
	await page.goto('/timeline');
	await page.locator('[aria-label="Asset Manager"]').waitFor();
	const firstEvent = page.locator('[data-testid^="timeline-event-"]').first();
	console.log('BEFORE aria-selected:', await firstEvent.getAttribute('aria-selected'));
	console.log('BEFORE __selectionStoreValue:', await page.evaluate(() => (window as any).__selectionStoreValue));
	// Use Playwright click (emulated user interaction)
	await firstEvent.click();
	await page.waitForTimeout(500);
	console.log('AFTER (playwright) aria-selected:', await firstEvent.getAttribute('aria-selected'));
	console.log('AFTER (playwright) __selectionStoreValue:', await page.evaluate(() => (window as any).__selectionStoreValue));

	// Now dispatch a synthetic DOM click from the page context and check again
	await page.evaluate(() => {
		const el = document.querySelector('[data-testid^="timeline-event-"]') as HTMLElement | null;
		if (el) el.click();
	});
	await page.waitForTimeout(500);
	console.log('AFTER (dom) aria-selected:', await firstEvent.getAttribute('aria-selected'));
	console.log('AFTER (dom) __selectionStoreValue:', await page.evaluate(() => (window as any).__selectionStoreValue));
});