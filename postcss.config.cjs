if (process.env.VITEST) {
  // when running tests, skip loading Tailwind (may not be installed in test env)
  module.exports = {
    plugins: {
      autoprefixer: {},
    },
  };
} else {
  module.exports = {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
}
