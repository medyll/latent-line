import { test, expect } from '@playwright/test';

test.describe('S14-02: Undo & raccourcis clavier - create/delete undo/redo', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		// ensure stores and AM rendered
		await page.locator('[data-testid="am-debug-visible"]').waitFor({ timeout: 20000 });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 20000 });
		// ensure Add timeline event button loaded
		await page.locator('button[aria-label="Add timeline event"]').waitFor({ timeout: 20000 });
	});

	test('create -> delete -> undo -> redo an event', async ({ page }) => {
		// ensure window has focus so global keydown handler receives events
		await page.focus('body');

		const events = page.locator('[data-testid^="timeline-event-"]');
		const initialCount = await events.count();

		const addBtn = page.locator('button[aria-label="Add timeline event"]');
		await addBtn.click();

		// wait for new event to appear
		await expect(events).toHaveCount(initialCount + 1, { timeout: 10000 });

		// select the newly created event (last)
		const newEvent = events.nth(initialCount);
		await newEvent.waitFor({ timeout: 10000 });
		await newEvent.click();

		// delete via UI (click Delete button) and accept confirmation
		const dataTest = await newEvent.getAttribute('data-testid');
		const timeMatch = dataTest ? dataTest.replace('timeline-event-', '') : null;
		if (timeMatch === null) throw new Error('Could not determine new event time from data-testid');
		// Accept the confirm dialog that deleteEvent triggers
		page.once('dialog', async (dialog) => {
			await dialog.accept();
		});
		const deleteBtn = page.locator(`button[aria-label="Delete frame ${timeMatch}"]`);
		await deleteBtn.click();
		// allow DOM to settle
		await page.waitForTimeout(200);

		// expect event removed
		await expect(events).toHaveCount(initialCount, { timeout: 10000 });

		const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

		// Undo (Ctrl/Cmd+Z)
		await page.keyboard.press(`${mod}+z`);
		await expect(events).toHaveCount(initialCount + 1, { timeout: 10000 });

		// Redo (Ctrl/Cmd+Y) - fallback to Ctrl/Cmd+Shift+Z if Y isn't used
		await page.keyboard.press(`${mod}+y`);
		try {
			await expect(events).toHaveCount(initialCount, { timeout: 5000 });
		} catch {
			// try alternative redo binding
			await page.keyboard.press(`${mod}+Shift+z`);
			await expect(events).toHaveCount(initialCount, { timeout: 10000 });
		}
	});
});
