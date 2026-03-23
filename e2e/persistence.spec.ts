import { test, expect } from '@playwright/test';

test('model persists to localStorage after adding a character (S12-01)', async ({ page }) => {
  await page.goto('/app', { waitUntil: 'networkidle' });

  // Wait for app to fully initialize
  await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 20000 });

  // Clear any pre-existing saved state
  await page.evaluate(() => localStorage.removeItem('latent-line:model'));

  // Add a character to mutate the model
  await page.locator('[data-testid="add-character"]').click();
  await page.locator('ul[aria-label="Characters"] [role="option"]').waitFor({ timeout: 10000 });

  // Wait for auto-save ($effect runs after state change)
  await page.waitForTimeout(300);

  // Verify localStorage was written with a valid model
  const saved = await page.evaluate(() => localStorage.getItem('latent-line:model'));
  expect(saved).not.toBeNull();
  const parsed = JSON.parse(saved as string);
  expect(parsed).toHaveProperty('assets');
  expect(parsed).toHaveProperty('timeline');

  // Reload — model should survive page reload
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 20000 });

  const savedAfterReload = await page.evaluate(() => localStorage.getItem('latent-line:model'));
  expect(savedAfterReload).not.toBeNull();
  const reloaded = JSON.parse(savedAfterReload as string);
  // Character added before reload should still be there
  expect(reloaded.assets?.characters?.length ?? 0).toBeGreaterThan(0);
});
