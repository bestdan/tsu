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
        statements: 97,
        branches: 91,
        functions: 100,
        lines: 97,
      },
    },
  },
});
