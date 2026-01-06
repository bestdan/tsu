import { isCommandInstalled } from '../../utils/shell.js';
import { logIfVerbose } from '../../utils/logger.js';
const EXTERNAL_DEPENDENCIES = [
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
    {
        command: 'coach',
        name: 'Coach',
        description: 'Required for git codeowners check',
        installUrl: 'https://github.com/spotify/coach',
    },
];
export function checkExternals(options = {}) {
    const verbose = options.verbose || false;
    logIfVerbose(verbose, '🔍 Checking external dependencies...');
    let allInstalled = true;
    for (const dep of EXTERNAL_DEPENDENCIES) {
        const installed = isCommandInstalled(dep.command);
        if (!installed) {
            allInstalled = false;
        }
        if (verbose) {
            if (installed) {
                console.error(`✓ ${dep.name} (${dep.command}) - installed`);
            }
            else {
                console.error(`✗ ${dep.name} (${dep.command}) - not installed`);
                console.error(`  Install: ${dep.installUrl}`);
            }
        }
        console.log(`${dep.command}: ${installed ? 'installed' : 'not_installed'}`);
    }
    if (verbose) {
        console.error('');
        if (allInstalled) {
            console.error('✓ All external dependencies are installed');
        }
        else {
            console.error('⚠️  Some external dependencies are not installed');
        }
    }
    process.exit(allInstalled ? 0 : 1);
}
