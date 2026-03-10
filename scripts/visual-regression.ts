import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

interface RegressionResult {
	component: string;
	baseline: string;
	current: string;
	diff: string;
	pixelsDiff: number;
	totalPixels: number;
	percentDiff: number;
	passed: boolean;
}

async function readPNG(filePath: string): Promise<PNG | null> {
	try {
		const buffer = fs.readFileSync(filePath);
		return PNG.sync.read(buffer);
	} catch (error) {
		console.error(`Failed to read PNG: ${filePath}`, error);
		return null;
	}
}

async function compareScreenshots(
	baselineDir: string,
	currentDir: string,
	diffDir: string,
	threshold: number = 0.02 // 2% default
): Promise<RegressionResult[]> {
	const results: RegressionResult[] = [];

	// Get list of baseline images
	const baselineFiles = fs.readdirSync(baselineDir).filter((f) => f.endsWith('.png'));

	for (const file of baselineFiles) {
		const baselinePath = path.join(baselineDir, file);
		const currentPath = path.join(currentDir, file);
		const diffPath = path.join(diffDir, file);

		// Check if current screenshot exists
		if (!fs.existsSync(currentPath)) {
			console.warn(`Missing current screenshot: ${file}`);
			results.push({
				component: path.basename(file, '.png'),
				baseline: baselinePath,
				current: currentPath,
				diff: diffPath,
				pixelsDiff: -1,
				totalPixels: 0,
				percentDiff: -1,
				passed: false
			});
			continue;
		}

		const baseline = await readPNG(baselinePath);
		const current = await readPNG(currentPath);

		if (!baseline || !current) {
			results.push({
				component: path.basename(file, '.png'),
				baseline: baselinePath,
				current: currentPath,
				diff: diffPath,
				pixelsDiff: -1,
				totalPixels: 0,
				percentDiff: -1,
				passed: false
			});
			continue;
		}

		// Check dimensions match
		if (baseline.width !== current.width || baseline.height !== current.height) {
			console.warn(
				`Dimension mismatch for ${file}: baseline ${baseline.width}x${baseline.height} vs current ${current.width}x${current.height}`
			);
			results.push({
				component: path.basename(file, '.png'),
				baseline: baselinePath,
				current: currentPath,
				diff: diffPath,
				pixelsDiff: -1,
				totalPixels: baseline.width * baseline.height,
				percentDiff: 100,
				passed: false
			});
			continue;
		}

		// Create diff image
		const { width, height } = baseline;
		const diff = new PNG({ width, height });

		const pixelsDiff = pixelmatch(baseline.data, current.data, diff.data, width, height, {
			threshold: 0.1
		});

		const totalPixels = width * height;
		const percentDiff = (pixelsDiff / totalPixels) * 100;
		const passed = percentDiff <= threshold * 100;

		// Write diff image
		fs.mkdirSync(diffDir, { recursive: true });
		fs.writeFileSync(diffPath, PNG.sync.write(diff));

		results.push({
			component: path.basename(file, '.png'),
			baseline: baselinePath,
			current: currentPath,
			diff: diffPath,
			pixelsDiff,
			totalPixels,
			percentDiff,
			passed
		});

		const status = passed ? '✓' : '✗';
		console.log(`${status} ${file}: ${pixelsDiff} pixels changed (${percentDiff.toFixed(2)}%)`);
	}

	return results;
}

function generateHTMLReport(results: RegressionResult[], outputPath: string): void {
	const passedCount = results.filter((r) => r.passed).length;
	const totalCount = results.length;
	const percentPassed = ((passedCount / totalCount) * 100).toFixed(0);

	const rows = results
		.map(
			(r) => `
		<tr class="${r.passed ? 'passed' : 'failed'}">
			<td>${r.component}</td>
			<td>${r.pixelsDiff === -1 ? 'N/A' : r.pixelsDiff}</td>
			<td>${r.percentDiff === -1 ? 'N/A' : r.percentDiff.toFixed(2)}%</td>
			<td>${r.passed ? '✓ PASS' : '✗ FAIL'}</td>
			<td>
				${r.pixelsDiff >= 0 ? `<img src="${r.baseline}" alt="baseline" class="screenshot"> <img src="${r.current}" alt="current" class="screenshot"> <img src="${r.diff}" alt="diff" class="screenshot">` : 'N/A'}
			</td>
		</tr>
	`
		)
		.join('');

	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Visual Regression Report</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			background: #f5f5f5;
			padding: 20px;
		}
		.container {
			max-width: 1400px;
			margin: 0 auto;
			background: white;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			padding: 30px;
		}
		h1 {
			color: #333;
			margin-bottom: 10px;
		}
		.summary {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 20px;
			margin-bottom: 30px;
		}
		.stat {
			background: #f9f9f9;
			padding: 20px;
			border-radius: 6px;
			border-left: 4px solid #0066cc;
		}
		.stat.passed {
			border-left-color: #22c55e;
		}
		.stat.failed {
			border-left-color: #ef4444;
		}
		.stat-label {
			font-size: 12px;
			color: #666;
			text-transform: uppercase;
			margin-bottom: 8px;
			letter-spacing: 0.5px;
		}
		.stat-value {
			font-size: 28px;
			font-weight: 600;
			color: #333;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 20px;
		}
		th {
			background: #f9f9f9;
			padding: 12px;
			text-align: left;
			font-weight: 600;
			color: #333;
			border-bottom: 2px solid #e5e5e5;
		}
		td {
			padding: 12px;
			border-bottom: 1px solid #e5e5e5;
		}
		tr.passed {
			background-color: #f0fdf4;
		}
		tr.failed {
			background-color: #fef2f2;
		}
		tr:hover {
			background-color: #f9f9f9;
		}
		.screenshot {
			max-width: 200px;
			height: auto;
			border: 1px solid #ddd;
			border-radius: 4px;
			margin: 5px;
		}
		.meta {
			color: #666;
			font-size: 12px;
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #e5e5e5;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Visual Regression Report</h1>
		<p style="color: #666; margin-bottom: 30px;">Generated at ${new Date().toISOString()}</p>

		<div class="summary">
			<div class="stat passed">
				<div class="stat-label">Tests Passed</div>
				<div class="stat-value">${passedCount}/${totalCount}</div>
			</div>
			<div class="stat failed">
				<div class="stat-label">Tests Failed</div>
				<div class="stat-value">${totalCount - passedCount}</div>
			</div>
			<div class="stat">
				<div class="stat-label">Pass Rate</div>
				<div class="stat-value">${percentPassed}%</div>
			</div>
			<div class="stat">
				<div class="stat-label">Total Components</div>
				<div class="stat-value">${totalCount}</div>
			</div>
		</div>

		<table>
			<thead>
				<tr>
					<th>Component</th>
					<th>Pixels Changed</th>
					<th>% Difference</th>
					<th>Status</th>
					<th>Comparison</th>
				</tr>
			</thead>
			<tbody>
				${rows}
			</tbody>
		</table>

		<div class="meta">
			<p><strong>Threshold:</strong> 2% pixel difference allowed</p>
			<p><strong>Tool:</strong> pixelmatch v7.1.0</p>
			<p><strong>Baseline Directory:</strong> .github/screenshots/baseline/</p>
		</div>
	</div>
</body>
</html>
	`;

	fs.writeFileSync(outputPath, html);
	console.log(`Report written to: ${outputPath}`);
}

async function main() {
	const command = process.argv[2];
	const baselineDir = path.join(projectRoot, '.github', 'screenshots', 'baseline');
	const currentDir = path.join(projectRoot, '.github', 'screenshots', 'current');
	const diffDir = path.join(projectRoot, '.github', 'screenshots', 'diffs');
	const reportPath = path.join(projectRoot, '.github', 'screenshots', 'regression-report.html');

	if (command === 'update') {
		// Copy current to baseline (update mode)
		if (!fs.existsSync(currentDir)) {
			console.error(`Current screenshots directory not found: ${currentDir}`);
			process.exit(1);
		}

		console.log('Updating baseline screenshots...');
		const files = fs.readdirSync(currentDir).filter((f) => f.endsWith('.png'));

		for (const file of files) {
			const src = path.join(currentDir, file);
			const dst = path.join(baselineDir, file);
			fs.copyFileSync(src, dst);
			console.log(`Updated baseline: ${file}`);
		}

		console.log('Baseline update complete.');
	} else {
		// Compare mode (default)
		console.log('Running visual regression tests...');

		if (!fs.existsSync(baselineDir)) {
			console.error(`Baseline directory not found: ${baselineDir}`);
			console.error('Please run TST-001 to capture baseline screenshots first.');
			process.exit(1);
		}

		const results = await compareScreenshots(baselineDir, currentDir, diffDir, 0.02);

		// Generate HTML report
		generateHTMLReport(results, reportPath);

		// Check if all tests passed
		const allPassed = results.every((r) => r.passed);

		if (allPassed) {
			console.log('\n✓ All visual regression tests passed!');
			process.exit(0);
		} else {
			const failedCount = results.filter((r) => !r.passed).length;
			console.error(`\n✗ ${failedCount} test(s) failed. See report: ${reportPath}`);
			process.exit(1);
		}
	}
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
