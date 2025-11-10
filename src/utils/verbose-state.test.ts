import { describe, it, expect, beforeEach } from 'vitest';
import { setVerbose, isVerbose, resetVerbose } from './verbose-state.js';

describe('verbose-state', () => {
  beforeEach(() => {
    // Reset state before each test
    resetVerbose();
  });

  describe('setVerbose', () => {
    it('should set verbose mode to true', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });

    it('should set verbose mode to false', () => {
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });

    it('should update verbose mode when called multiple times', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);

      setVerbose(false);
      expect(isVerbose()).toBe(false);

      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });
  });

  describe('isVerbose', () => {
    it('should return false by default', () => {
      expect(isVerbose()).toBe(false);
    });

    it('should return true after setting verbose to true', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });

    it('should return false after setting verbose to false', () => {
      setVerbose(false);
      expect(isVerbose()).toBe(false);
    });
  });

  describe('resetVerbose', () => {
    it('should reset verbose mode to false', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);

      resetVerbose();
      expect(isVerbose()).toBe(false);
    });

    it('should have no effect when already false', () => {
      setVerbose(false);
      resetVerbose();
      expect(isVerbose()).toBe(false);
    });
  });
});
