import { InvalidArgumentError } from 'commander';

/**
 * Commander argument parser that accepts only a positive whole number.
 * Rejects values like `abc`, `-1`, `0` and `10ms` instead of letting parseInt coerce them.
 */
export function parsePositiveInt(value: string): number {
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new InvalidArgumentError('Must be a positive integer.');
  }
  return Number(value);
}
