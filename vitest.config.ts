import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'node',
		globals: false,
		include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
		exclude: ['**/*.browser.spec.ts', 'e2e/**', 'node_modules/**', 'dist/**', '.svelte-kit/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/lib/**/*.ts'],
			exclude: ['src/lib/components/ui/**', '**/*.test.ts', '**/*.spec.ts']
		}
	}
});
