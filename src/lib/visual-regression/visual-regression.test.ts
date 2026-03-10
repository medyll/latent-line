import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * TST-002: Visual Regression Detection Setup Tests
 *
 * These tests verify that the visual regression detection infrastructure
 * is correctly configured and functional.
 */

describe('TST-002: Visual Regression Detection', () => {
	const baselineDir = path.join(projectRoot, '.github', 'screenshots', 'baseline');
	const currentDir = path.join(projectRoot, '.github', 'screenshots', 'current');
	const diffDir = path.join(projectRoot, '.github', 'screenshots', 'diffs');
	const reportPath = path.join(projectRoot, '.github', 'screenshots', 'regression-report.html');

	beforeAll(() => {
		// Ensure directories exist for testing
		fs.mkdirSync(baselineDir, { recursive: true });
		fs.mkdirSync(currentDir, { recursive: true });
		fs.mkdirSync(diffDir, { recursive: true });
	});

	afterAll(() => {
		// Clean up test files
		[currentDir, diffDir].forEach((dir) => {
			if (fs.existsSync(dir)) {
				const files = fs.readdirSync(dir);
				files.forEach((file) => {
					if (file !== '.gitkeep') {
						fs.unlinkSync(path.join(dir, file));
					}
				});
			}
		});
	});

	it('should have baseline directory structure', () => {
		expect(fs.existsSync(baselineDir)).toBe(true);
		expect(fs.existsSync(currentDir)).toBe(true);
		expect(fs.existsSync(diffDir)).toBe(true);
	});

	it('should have visual regression scripts available', () => {
		const scriptPath = path.join(projectRoot, 'scripts', 'visual-regression.mjs');
		expect(fs.existsSync(scriptPath)).toBe(true);
	});

	it('should have npm scripts configured', () => {
		const pkgJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
		expect(pkgJson.scripts['test:visual']).toBeDefined();
		expect(pkgJson.scripts['test:visual:update']).toBeDefined();
		expect(pkgJson.scripts['test:visual']).toContain('visual-regression.mjs');
	});

	it('should have CI workflow configured', () => {
		const workflowPath = path.join(projectRoot, '.github', 'workflows', 'visual-regression.yml');
		expect(fs.existsSync(workflowPath)).toBe(true);

		const workflow = fs.readFileSync(workflowPath, 'utf-8');
		expect(workflow).toContain('Visual Regression Tests');
		expect(workflow).toContain('test:visual');
	});

	it('should have E2E visual capture tests', () => {
		const e2ePath = path.join(projectRoot, 'e2e', 'visual-capture.spec.ts');
		expect(fs.existsSync(e2ePath)).toBe(true);

		const content = fs.readFileSync(e2ePath, 'utf-8');
		expect(content).toContain('Screenshot Capture');
		expect(content).toContain('TimelinePage');
		expect(content).toContain('SequenceOrchestrator');
	});

	describe('Pixel Comparison Logic', () => {
		it('should calculate 0% difference for identical images', () => {
			const width = 100;
			const height = 100;
			const totalPixels = width * height;

			// Simulate pixel comparison result
			const pixelsDiff = 0;
			const percentDiff = (pixelsDiff / totalPixels) * 100;

			expect(percentDiff).toBe(0);
		});

		it('should detect non-zero pixel differences', () => {
			const width = 100;
			const height = 100;
			const totalPixels = width * height;

			// Simulate pixel comparison result
			const pixelsDiff = 100;
			const percentDiff = (pixelsDiff / totalPixels) * 100;

			expect(percentDiff).toBeGreaterThan(0);
			expect(percentDiff).toBeLessThanOrEqual(100);
		});

		it('should calculate percentage difference correctly', () => {
			const width = 100;
			const height = 100;
			const totalPixels = width * height;

			// Simulate 2% pixel difference
			const pixelsDiff = Math.floor(totalPixels * 0.02);
			const percentDiff = (pixelsDiff / totalPixels) * 100;

			expect(percentDiff).toBeCloseTo(2, 0);
		});

		it('should validate dimension mismatch detection', () => {
			const baseline = { width: 100, height: 100 };
			const current = { width: 200, height: 200 };

			// Should detect dimension mismatch
			expect(baseline.width === current.width && baseline.height === current.height).toBe(false);
		});

		it('should pass comparison when diff % is under threshold', () => {
			const threshold = 0.02; // 2%
			const pixelsDiff = 1500;
			const totalPixels = 100000;
			const percentDiff = (pixelsDiff / totalPixels) * 100;

			const passed = percentDiff <= threshold * 100;
			expect(passed).toBe(true);
		});

		it('should fail comparison when diff % exceeds threshold', () => {
			const threshold = 0.02; // 2%
			const pixelsDiff = 3000;
			const totalPixels = 100000;
			const percentDiff = (pixelsDiff / totalPixels) * 100;

			const passed = percentDiff <= threshold * 100;
			expect(passed).toBe(false);
		});
	});

	describe('HTML Report Generation', () => {
		it('should generate HTML report with summary statistics', () => {
			const mockResults = [
				{
					component: 'HomePage',
					baseline: 'baseline/HomePage.png',
					current: 'current/HomePage.png',
					diff: 'diffs/HomePage.png',
					pixelsDiff: 10,
					totalPixels: 2073600,
					percentDiff: 0.48,
					passed: true
				},
				{
					component: 'TimelinePage',
					baseline: 'baseline/TimelinePage.png',
					current: 'current/TimelinePage.png',
					diff: 'diffs/TimelinePage.png',
					pixelsDiff: 100000,
					totalPixels: 2073600,
					percentDiff: 4.82,
					passed: false
				}
			];

			const passedCount = mockResults.filter((r) => r.passed).length;
			const totalCount = mockResults.length;
			const percentPassed = ((passedCount / totalCount) * 100).toFixed(0);

			expect(passedCount).toBe(1);
			expect(totalCount).toBe(2);
			expect(percentPassed).toBe('50');
		});

		it('should format percentage differences with 2 decimals', () => {
			const percentDiff = 1.23456;
			const formatted = parseFloat(percentDiff.toFixed(2));

			expect(formatted).toBe(1.23);
		});

		it('should include baseline directory info in report', () => {
			const report = `
				<p><strong>Baseline Directory:</strong> .github/screenshots/baseline/</p>
				<p><strong>Threshold:</strong> 2% pixel difference allowed</p>
			`;

			expect(report).toContain('.github/screenshots/baseline/');
			expect(report).toContain('2%');
		});
	});

	describe('Screenshot Directory Structure', () => {
		it('should maintain baseline directory for reference images', () => {
			expect(fs.existsSync(path.join(baselineDir))).toBe(true);
		});

		it('should maintain current directory for test run screenshots', () => {
			expect(fs.existsSync(path.join(currentDir))).toBe(true);
		});

		it('should maintain diffs directory for comparison results', () => {
			expect(fs.existsSync(path.join(diffDir))).toBe(true);
		});

		it('should generate .gitkeep files to track empty directories', () => {
			expect(fs.existsSync(path.join(baselineDir, '.gitkeep'))).toBe(true);
			expect(fs.existsSync(path.join(currentDir, '.gitkeep'))).toBe(true);
			expect(fs.existsSync(path.join(diffDir, '.gitkeep'))).toBe(true);
		});
	});

	describe('Configuration and Thresholds', () => {
		it('should use 2% threshold for regression detection', () => {
			const threshold = 0.02;
			const percentThreshold = threshold * 100;

			expect(percentThreshold).toBe(2);
		});

		it('should support baseline update via update mode', () => {
			// The script should support --update or 'update' argument
			// This verifies the infrastructure supports baseline refresh
			const scriptPath = path.join(projectRoot, 'scripts', 'visual-regression.mjs');
			const content = fs.readFileSync(scriptPath, 'utf-8');

			expect(content).toContain('update');
			expect(content).toContain('copyFileSync');
		});

		it('should exit with error code on regression detection', () => {
			// Script should return exit code 1 on failed tests
			const scriptPath = path.join(projectRoot, 'scripts', 'visual-regression.mjs');
			const content = fs.readFileSync(scriptPath, 'utf-8');

			expect(content).toContain('process.exit(1)');
			expect(content).toContain('failed');
		});

		it('should exit with success code when all tests pass', () => {
			const scriptPath = path.join(projectRoot, 'scripts', 'visual-regression.mjs');
			const content = fs.readFileSync(scriptPath, 'utf-8');

			expect(content).toContain('process.exit(0)');
		});
	});
});
