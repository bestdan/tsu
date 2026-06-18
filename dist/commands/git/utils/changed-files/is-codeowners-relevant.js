import { basename } from 'node:path';
const OWNERSHIP_FILE_NAMES = new Set(['OWNERSHIP', 'CODEOWNERS']);
export function isCodeownersRelevant(entries) {
    return entries.some((entry) => entry.status === 'A' || entry.status === 'R' || OWNERSHIP_FILE_NAMES.has(basename(entry.path)));
}
