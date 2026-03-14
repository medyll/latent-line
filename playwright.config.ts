import { defineConfig } from '@playwright/test';

export default defineConfig({
	timeout: 60000,
	retries: 1,
	use: {
		// Align with local Vite default port (5173) and app path
		baseURL: 'http://localhost:5173'
	},
	testDir: 'e2e',
	// Auto-start the dev server for CI/dev so tests don't depend on a separate manual step
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: true
	},
	// Isolate snapshots by OS so Linux CI baselines don't conflict with Windows dev baselines
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}-{platform}{ext}'
});
