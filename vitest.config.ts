import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['dist/**', 'node_modules/**'],
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
        // Re-export barrel files (only contain export statements, no executable code)
        'src/commands/dart/utils/dart.ts',
        'src/commands/git/utils/git.ts',
        // External tool integration (requires Claude CLI or git operations tested via integration)
        'src/commands/git/utils/claude/**',
        'src/commands/git/utils/commit/get-git-status.ts',
        'src/commands/git/utils/repo/get-remote-branch.ts',
      ],
      thresholds: {
        // Updated thresholds after using logIfVerbose helper and /* v8 ignore next -- @preserve */
        // These reflect coverage with external tool integration code properly marked as ignored.
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
