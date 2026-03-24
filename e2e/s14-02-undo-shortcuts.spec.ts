import { test, expect } from '@playwright/test';

test.describe('S14-02: Undo & raccourcis clavier (skeleton)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timeline', { waitUntil: 'networkidle' });
    // ensure stores and AM rendered
    await page.locator('[data-testid="am-debug-visible"]').waitFor({ timeout: 20000 });
    await page.locator('[aria-label="Asset Manager"]').waitFor();
    // ensure timeline events rendered
    await page.locator('[data-testid^="timeline-event-"]').first().waitFor({ timeout: 20000 });
  });

  test('skeleton: verify undo/shortcuts (TODO - implement)', async ({ page }) => {
    // Implement minimal assertions: ensure timeline loads and first event is visible
    // TODO: extend to create/delete/undo/redo and keyboard shortcut interactions

    // navigation is handled in beforeEach

    // Ensure app rendered
    const firstEvent = page.locator('[data-testid^="timeline-event-"]').first();
    await firstEvent.waitFor({ timeout: 10000 });
    await expect(firstEvent).toBeVisible({ timeout: 10000 });

    // TODO: add steps: create an event, perform delete, press keyboard shortcuts, assert undo/redo behavior
  });
});
