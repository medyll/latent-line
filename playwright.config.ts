import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e',
	// Isolate snapshots by OS so Linux CI baselines don't conflict with Windows dev baselines
	snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}-{platform}{ext}'
});
