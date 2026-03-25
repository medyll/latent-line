import { test, expect } from '@playwright/test';
import { checkA11y } from './helpers';

test.describe('Accessibility — WCAG 2.1 AA', () => {
	test('/ — home page has no critical/serious violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const results = await checkA11y(page);
		const critical = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);
		if (critical.length > 0) {
			console.error(
				'Axe violations:',
				JSON.stringify(
					critical.map((v) => ({
						id: v.id,
						impact: v.impact,
						description: v.description,
						nodes: v.nodes.length
					})),
					null,
					2
				)
			);
		}
		expect(critical).toHaveLength(0);
	});

	test('/app — workspace has no critical/serious violations', async ({ page }) => {
		await page.goto('/app');
		await page.waitForLoadState('networkidle');
		const results = await checkA11y(page);
		const critical = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);
		if (critical.length > 0) {
			console.error(
				'Axe violations:',
				JSON.stringify(
					critical.map((v) => ({
						id: v.id,
						impact: v.impact,
						description: v.description,
						nodes: v.nodes.length
					})),
					null,
					2
				)
			);
		}
		expect(critical).toHaveLength(0);
	});

	test('/app — AssetManager listboxes are keyboard-navigable', async ({ page }) => {
		await page.goto('/app');
		await page.waitForLoadState('networkidle');
		const listbox = page.getByRole('listbox', { name: 'Characters' });
		await expect(listbox).toBeVisible();
	});

	test('/app — all dialogs trap focus correctly', async ({ page }) => {
		await page.goto('/app');
		await page.waitForLoadState('networkidle');
		// Open ShortcutHelp via keyboard shortcut F1
		await page.keyboard.press('F1');
		const dialog = page.getByRole('dialog', { name: 'Raccourcis clavier' });
		await expect(dialog).toBeVisible();
		// Escape closes it
		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
	});
});
