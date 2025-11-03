import { isCommandInstalled } from '../../utils/shell.js';
import { logIfVerbose } from '../../utils/logger.js';

export interface CheckExternalsOptions {
  verbose?: boolean;
}

/**
 * External dependencies that the tsutils package may use
 */
interface ExternalDependency {
  command: string;
  name: string;
  description: string;
  installUrl: string;
}

const EXTERNAL_DEPENDENCIES: ExternalDependency[] = [
  {
    command: 'dart',
    name: 'Dart SDK',
    description: 'Required for dart commands',
    installUrl: 'https://dart.dev',
  },
  {
    command: 'dcm',
    name: 'DCM',
    description: 'Required for dart hook dcm check',
    installUrl: 'https://dcm.dev',
  },
  {
    command: 'melos',
    name: 'Melos',
    description: 'Required for dart hook graphql check',
    installUrl: 'https://melos.invertase.dev',
  },
  {
    command: 'claude',
    name: 'Claude CLI',
    description: 'Required for git commit-msg and git pr-description',
    installUrl: 'https://github.com/anthropics/claude-cli',
  },
];

/**
 * Check if external dependencies are installed.
 * Outputs the status of each dependency to stdout in a parseable format.
 * In verbose mode, also outputs human-readable messages to stderr.
 */
export function checkExternals(options: CheckExternalsOptions = {}): void {
  const verbose = options.verbose || false;

  logIfVerbose(verbose, '🔍 Checking external dependencies...');

  const results: Array<{ command: string; installed: boolean }> = [];
  let allInstalled = true;

  for (const dep of EXTERNAL_DEPENDENCIES) {
    const installed = isCommandInstalled(dep.command);
    results.push({ command: dep.command, installed });

    if (!installed) {
      allInstalled = false;
    }

    if (verbose) {
      if (installed) {
        console.error(`✓ ${dep.name} (${dep.command}) - installed`);
      } else {
        console.error(`✗ ${dep.name} (${dep.command}) - not installed`);
        console.error(`  Install: ${dep.installUrl}`);
      }
    }
  }

  // Output parseable results to stdout
  for (const result of results) {
    console.log(`${result.command}: ${result.installed ? 'installed' : 'not_installed'}`);
  }

  if (verbose) {
    console.error('');
    if (allInstalled) {
      console.error('✓ All external dependencies are installed');
    } else {
      console.error('⚠️  Some external dependencies are not installed');
    }
  }

  process.exit(allInstalled ? 0 : 1);
}
