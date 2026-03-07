/* eslint-disable @typescript-eslint/no-require-imports */
if (process.env.VITEST) {
	// when running tests, skip loading Tailwind (may not be installed in test env)
	module.exports = {
		plugins: {
			autoprefixer: {}
		}
	};
} else {
	// Use the new PostCSS integration for Tailwind (plugin moved to @tailwindcss/postcss)
	const tailwindPostcss = require('@tailwindcss/postcss');
	module.exports = {
		plugins: {
			[tailwindPostcss.postcssPlugin || '@tailwindcss/postcss']: tailwindPostcss,
			autoprefixer: {}
		}
	};
}
