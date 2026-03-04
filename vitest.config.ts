import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: false,
		include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
		exclude: ['**/*.browser.spec.ts', 'e2e/**', 'node_modules/**', 'dist/**', '.svelte-kit/**']
	}
});
