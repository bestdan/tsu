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
        // Note: These thresholds are set to account for code that integrates with external tools
        // (DCM, dart format, melos, Claude CLI) which cannot be fully tested without those tools installed.
        // Specific files with lower coverage are documented in COVERAGE.md with v8 ignore comments
        // marking the untestable external tool integration code.
        statements: 76,
        branches: 69,
        functions: 79,
        lines: 76,
      },
    },
  },
});
