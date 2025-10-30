// Test if we can programmatically set all config
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      exclude: [
        '**/*.generateCommitMessage',
        '**/*.generatePRDescription'
      ]
    }
  }
});
