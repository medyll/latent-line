import { test, expect } from '@playwright/test';

test('selecting a timeline event shows properties in the panel', async ({ page }) => {
  await page.goto('/timeline');

  // Initially no selection
  await expect(page.locator('[aria-label="No selection"]')).toBeVisible();

  const event = page.locator('[title="Event 1"]');
  await expect(event).toBeVisible();
  await event.click();

  // Properties panel should show the selected event label
  const props = page.locator('[aria-label="Properties Panel"]');
  await expect(props).toContainText('Event 1');
});
