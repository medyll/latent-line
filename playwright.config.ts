import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	testMatch: [
		/baseline\.spec\.ts/,
		/accessibility\.spec\.ts/,
		/assets\.spec\.ts/,
		/event-editing\.spec\.ts/,
		/persistence\.spec\.ts/,
		/timeline-creation\.spec\.ts/
	],
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:5167',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'node node_modules/vite/bin/vite.js dev --port 5167 --host 127.0.0.1',
		url: 'http://127.0.0.1:5167',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}-{platform}{ext}'
});
