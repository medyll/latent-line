import { expect, test } from '@playwright/test';

test.describe('verified experimental baseline', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await expect(page.getByLabel('Asset Manager')).toBeVisible();
	});

	test('character CRUD persists after reload', async ({ page }) => {
		const characters = page.locator('ul[aria-label="Characters"] [role="option"]');
		const initialCount = await characters.count();

		await page.getByTestId('add-character').click();
		await expect(characters).toHaveCount(initialCount + 1);

		const created = characters.last();
		const name = created.getByLabel('Character name');
		await name.fill('Baseline Hero');
		await name.press('Tab');
		await expect(created).toContainText('Baseline Hero');

		await expect
			.poll(async () => {
				const saved = await page.evaluate(() => localStorage.getItem('latent-line:model'));
				return saved
					? JSON.parse(saved).assets.characters.some((item: any) => item.name === 'Baseline Hero')
					: false;
			})
			.toBe(true);

		await page.reload({ waitUntil: 'networkidle' });
		await expect(page.getByLabel('Asset Manager').getByText('Baseline Hero')).toBeVisible();

		const reloaded = page
			.locator('ul[aria-label="Characters"] [role="option"]')
			.filter({ hasText: 'Baseline Hero' });
		await reloaded.getByTitle(/^Delete/).click();
		await expect(reloaded).toHaveCount(0);
	});

	test('creates and edits a timeline shot', async ({ page }) => {
		const cards = page.locator('.shot-card');
		const initialCount = await cards.count();

		await page.getByRole('button', { name: 'Add shot', exact: true }).click();
		await expect(page.getByRole('heading', { name: 'Edit Shot' })).toBeVisible();
		await page.getByLabel('Notes').fill('Baseline shot');
		await page.getByRole('button', { name: 'Save', exact: true }).click();

		await expect(cards).toHaveCount(initialCount + 1);
		await expect(cards.last()).toContainText('Frame');
	});

	test('exports YAML and opens the import workflow', async ({ page }) => {
		await page.getByRole('button', { name: 'Exporter' }).click();
		const exportDialog = page.getByRole('dialog', { name: 'Export' });
		await expect(exportDialog).toBeVisible();
		await exportDialog.getByRole('tab', { name: 'YAML' }).click();

		const downloadPromise = page.waitForEvent('download');
		await exportDialog.getByRole('button', { name: 'Télécharger' }).click();
		const download = await downloadPromise;
		await expect(download.suggestedFilename()).toMatch(/\.yaml$/);

		await page.getByRole('button', { name: 'Exporter' }).click();
		await page.getByTitle('Import JSON').click();
		await expect(page.getByRole('dialog', { name: 'Import Timeline' })).toBeVisible();
	});

	test('opens the screening route with the current model', async ({ page }) => {
		const popupPromise = page.waitForEvent('popup');
		await page.getByRole('link', { name: 'Screening' }).last().click();
		const screening = await popupPromise;
		await screening.waitForLoadState('domcontentloaded');
		await expect(screening).toHaveURL(/\/present\?model=/);
		await expect(screening.locator('body')).not.toContainText('404');
	});
});
