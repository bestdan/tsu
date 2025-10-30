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
        statements: 82,
        branches: 71,
        functions: 90,
        lines: 82,
      },
    },
  },
});
