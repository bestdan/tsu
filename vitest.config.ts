import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist',
        'node_modules',
        '**/*.test.ts',
        '**/*.config.*',
        'src/__fixtures__/**',
        'src/gcaim.sh',
      ],
      thresholds: {
        // Updated thresholds after using logIfVerbose helper and /* v8 ignore next -- @preserve */
        // These reflect coverage with external tool integration code properly marked as ignored.
        // Current actual coverage after adding dcm-parse: statements: 93.18%, branches: 89%, functions: 95%, lines: 93.06%
        statements: 93,
        branches: 89,
        functions: 98,
        lines: 93,
      },
    },
  },
});
