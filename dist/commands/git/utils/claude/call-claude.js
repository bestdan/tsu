import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
export function callClaude(options) {
    const { prompt, input, cwd = process.cwd(), postProcess } = options;
    try {
        const result = execSync('claude -p', {
            cwd: resolve(cwd),
            input: `${prompt}\n\n${input}`,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
        });
        const output = result.trim();
        return postProcess ? postProcess(output) : output;
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error('Claude CLI not found. Please install it from https://github.com/anthropics/claude-cli');
        }
        throw error;
    }
}
//# sourceMappingURL=call-claude.js.map