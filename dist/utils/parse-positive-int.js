import { InvalidArgumentError } from 'commander';
export function parsePositiveInt(value) {
    if (!/^\d+$/.test(value) || Number(value) <= 0) {
        throw new InvalidArgumentError('Must be a positive integer.');
    }
    return Number(value);
}
