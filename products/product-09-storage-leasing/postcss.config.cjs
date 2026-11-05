// Mantine's PostCSS preset provides CSS custom-property helpers (e.g.
// light-dark(), the --mantine-* variables) and the mantineBreakpoint mixin.
// Kept as CommonJS because Vite loads postcss.config via require().
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
  },
};