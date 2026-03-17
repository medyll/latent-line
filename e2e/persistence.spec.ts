import { test, expect } from '@playwright/test';

test('model persists to localStorage after inserting event (S12-01)', async ({ page }) => {
  // Ensure a clean start
  await page.goto('/demo-model');

  // Wait for the S12-01 section and the insert button
  const insertBtn = page.getByRole('button', { name: 'Insert sample timeline event' });
  await expect(insertBtn).toBeVisible();

  // Read initial saved model if any
  const before = await page.evaluate(() => localStorage.getItem('latent-line:model'));

  // Click the button to insert an event
  await insertBtn.click();

  // Wait for the events counter to update
  const eventsLabel = page.locator('text=Events:');
  await expect(eventsLabel).toBeVisible();

  // Ensure localStorage was written and contains a timeline array with at least one element
  const saved = await page.evaluate(() => localStorage.getItem('latent-line:model'));
  expect(saved).not.toBeNull();
  const parsed = JSON.parse(saved as string);
  expect(parsed).toHaveProperty('timeline');
  expect(Array.isArray(parsed.timeline)).toBe(true);
  expect(parsed.timeline.length).toBeGreaterThan(0);

  // Reload and confirm the saved timeline is still present after hydration
  await page.reload();
  const savedAfterReload = await page.evaluate(() => localStorage.getItem('latent-line:model'));
  expect(savedAfterReload).toBe(saved);
});
