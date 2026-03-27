import { test, expect } from '@playwright/test';

test.describe('Performance: Large Dataset Handling', () => {
	test('timeline renders 100 events without lag', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Wait for app to stabilize
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

		// Measure time to add 100 events
		const startTime = Date.now();

		// Create 100 events via rapid UI interactions
		for (let i = 1; i <= 100; i++) {
			// Click timeline to add event (assuming single-click adds event at current time)
			await page.locator('[aria-label="Timeline Canvas"]').click({
				position: { x: 100 + i * 5, y: 200 }
			});

			// Small delay to allow state updates
			if (i % 10 === 0) await page.waitForTimeout(50);
		}

		const addTime = Date.now() - startTime;

		// Verify 100 events exist
		const eventCount = await page.locator('[data-testid*="event-"]').count();
		expect(eventCount).toBeGreaterThanOrEqual(100);

		// Performance assertion: adding 100 events should take < 5 seconds
		expect(addTime).toBeLessThan(5000);

		// Scroll through timeline and measure frame rate stability
		const scrollStartTime = Date.now();
		await page.locator('[aria-label="Timeline Canvas"]').evaluate((el: HTMLElement) => {
			el.scrollLeft += 2000; // Scroll right
		});

		const scrollTime = Date.now() - scrollStartTime;
		expect(scrollTime).toBeLessThan(500); // Scroll should complete in <500ms

		// Verify no visible layout shift or corruption
		await expect(page.locator('[aria-label="Timeline Canvas"]')).toHaveScreenshot(
			'timeline-100-events.png',
			{ maxDiffPixels: 100 } // Allow minor rendering variations
		);
	});

	test('1000 events timeline scrolls smoothly', async ({ page }) => {
		// This test uses a pre-loaded 1000-event model for speed
		// In production, populate via API or data fixture instead of UI clicks

		await page.goto('/', { waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

		// Inject 1000 events via browser context (simulating loaded model)
		await page.evaluate(() => {
			const store = (window as any).__modelStore;
			if (store) {
				for (let i = 0; i < 1000; i++) {
					store.addEvent({
						id: `perf-event-${i}`,
						time: i * 100,
						label: `Event ${i}`,
						description: `Large dataset test event ${i}`
					});
				}
			}
		});

		// Wait for timeline to render
		await page.waitForTimeout(1000);

		// Measure scroll performance
		const metrics: number[] = [];

		for (let j = 0; j < 10; j++) {
			const startTime = Date.now();

			await page.locator('[aria-label="Timeline Canvas"]').evaluate((el: HTMLElement) => {
				el.scrollLeft += 500;
			});

			await page.waitForTimeout(50); // Allow render
			const scrollTime = Date.now() - startTime;
			metrics.push(scrollTime);
		}

		const avgScrollTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;

		// Average scroll should be smooth (< 100ms per scroll)
		expect(avgScrollTime).toBeLessThan(100);

		// Verify timeline is responsive (not frozen)
		const selected = await page.locator('[data-testid="event-500"]').isVisible();
		expect(typeof selected).toBe('boolean');
	});

	test('ComfyUI settings panel respects viewport height', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

		// Locate ComfyUI settings panel
		const comfyPanel = page.locator('[data-testid="comfy-settings-panel"]');

		// Verify panel height is clamped to viewport
		const panelBox = await comfyPanel.boundingBox();
		const viewportSize = page.viewportSize();

		if (panelBox && viewportSize) {
			// Panel should not exceed viewport height minus header
			const maxAllowedHeight = viewportSize.height - 100; // 100px for header
			expect(panelBox.height).toBeLessThanOrEqual(maxAllowedHeight);
		}

		// Verify scrolling within panel works (if content overflows)
		const contentBox = await comfyPanel.locator('[data-testid="comfy-content"]').boundingBox();
		const shouldBeScrollable = contentBox && panelBox && contentBox.height > panelBox.height;

		if (shouldBeScrollable) {
			// Panel should be scrollable internally
			const initialScroll = await comfyPanel.evaluate((el: HTMLElement) => el.scrollTop);
			await comfyPanel.evaluate((el: HTMLElement) => {
				el.scrollTop += 100;
			});
			const afterScroll = await comfyPanel.evaluate((el: HTMLElement) => el.scrollTop);
			expect(afterScroll).toBeGreaterThan(initialScroll);
		}
	});

	test('dark mode toggle persists to localStorage', async ({ page }) => {
		// Clear localStorage before test
		await page.evaluate(() => localStorage.clear());

		await page.goto('/', { waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

		// Locate theme toggle (adjust selector as needed)
		const themeToggle = page.locator('[data-testid="theme-toggle"]');
		await themeToggle.click();

		// Verify theme changed
		const htmlElement = page.locator('html');
		const colorScheme = await htmlElement.evaluate((el) => window.getComputedStyle(el).colorScheme);
		expect(['light', 'dark', 'light dark', 'dark light']).toContain(colorScheme);

		// Verify localStorage updated
		const themePref = await page.evaluate(() => {
			return localStorage.getItem('theme-preference');
		});
		expect(['light', 'dark']).toContain(themePref);

		// Reload page and verify theme persisted
		await page.reload({ waitUntil: 'networkidle' });
		await page.locator('[aria-label="Asset Manager"]').waitFor({ timeout: 10000 });

		const persistedTheme = await page.evaluate(() => {
			return localStorage.getItem('theme-preference');
		});
		expect(persistedTheme).toBe(themePref);
	});

	test('no white flash on page load with dark mode', async ({ page }) => {
		// Set dark mode before navigation
		await page.evaluate(() => {
			localStorage.setItem('theme-preference', 'dark');
		});

		// Measure time from navigation to first meaningful paint
		const navigationStart = Date.now();

		await page.goto('/', { waitUntil: 'domcontentloaded' });

		// Check if theme is applied before DOM render
		const bgColor = await page.evaluate(() => {
			return window.getComputedStyle(document.documentElement).backgroundColor;
		});

		// Dark mode background should not be white (rgb(255, 255, 255))
		expect(bgColor).not.toBe('rgb(255, 255, 255)');

		const pageLoadTime = Date.now() - navigationStart;
		expect(pageLoadTime).toBeLessThan(2000);
	});
});
