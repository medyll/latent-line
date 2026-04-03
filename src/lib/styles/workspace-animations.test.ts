import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('S32-03: Micro-animations & Transitions', () => {
	it('workspace.css contains animation definitions', () => {
		const css = readFileSync(
			join(process.cwd(), 'src/lib/styles/workspace.css'),
			'utf-8'
		);
		expect(css).toContain('@keyframes');
		expect(css).toContain('panelSlideIn');
		expect(css).toContain('panelSlideOut');
		expect(css).toContain('fadeIn');
		expect(css).toContain('slideUp');
	});

	it('includes prefers-reduced-motion media query', () => {
		const css = readFileSync(
			join(process.cwd(), 'src/lib/styles/workspace.css'),
			'utf-8'
		);
		expect(css).toContain('prefers-reduced-motion');
	});

	it('defines transition utility classes', () => {
		const css = readFileSync(
			join(process.cwd(), 'src/lib/styles/workspace.css'),
			'utf-8'
		);
		expect(css).toContain('.card-hover');
		expect(css).toContain('.btn-press');
		expect(css).toContain('.fade-in');
		expect(css).toContain('.slide-up');
	});
});
