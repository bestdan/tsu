import { findDartPackageRoot } from './find-dart-package-root.js';
export function isDartPackage(cwd = process.cwd()) {
    return findDartPackageRoot(cwd) !== null;
}
//# sourceMappingURL=is-dart-package.js.map