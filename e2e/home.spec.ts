import { test, expect } from '@playwright/test';

test('home page loads and navigates to timeline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=LatentLine Demo Home')).toBeVisible();
  await page.click('text=Timeline');
  await expect(page).toHaveURL(/\/timeline/);
});
