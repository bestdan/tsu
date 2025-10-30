import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist', 'node_modules', '**/*.test.ts', '**/*.config.*'],
      thresholds: {
        statements: 77,
        branches: 65,
        functions: 77,
        lines: 77,
      },
    },
  },
});
