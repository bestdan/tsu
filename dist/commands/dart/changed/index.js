import { isGitRepo } from '../../git/utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { displayChangedFiles } from '../../../utils/command-helpers.js';
export function dartChanged(options = {}) {
    if (!isGitRepo()) {
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    if (!isDartPackage()) {
        console.error('Error: Not in a Dart package');
        process.exit(1);
    }
    displayChangedFiles({
        ...options,
        filter: (file) => file.endsWith('.dart'),
        typePrefix: 'Dart',
    });
}
