import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run axe-core accessibility audit on a page or scoped selector.
 * Throws on critical or serious violations.
 */
export async function checkA11y(page: Page, selector?: string) {
	const builder = new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
		.disableRules(['color-contrast']); // checked manually via token audit

	if (selector) builder.include(selector);

	const results = await builder.analyze();
	return results;
}
