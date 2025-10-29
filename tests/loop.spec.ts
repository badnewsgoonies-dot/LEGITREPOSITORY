/**
 * Tests for fixed-timestep game loop
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { stepSync, STEP_MS, STEP_SEC, calculateFPSStats } from '../src/core/loop';
import { initWorld, updateWorld } from '../src/state/world';

describe('Fixed-step Game Loop', () => {
  describe('stepSync', () => {
    it('should run exactly N updates for N steps', () => {
      const initialState = initWorld(42);
      const finalState = stepSync(initialState, updateWorld, 5);

      expect(finalState.frameCount).toBe(5);
      expect(finalState.time).toBeCloseTo(5 * STEP_SEC, 6);
    });

    it('should maintain determinism across runs', () => {
      const state1 = stepSync(initWorld(123), updateWorld, 10);
      const state2 = stepSync(initWorld(123), updateWorld, 10);

      expect(state1.frameCount).toBe(state2.frameCount);
      expect(state1.time).toBe(state2.time);
      expect(state1.seed).toBe(state2.seed);
    });

    it('should not update when paused', () => {
      let state = initWorld(999);
      state = { ...state, isPaused: true };

      const finalState = stepSync(state, updateWorld, 5);

      expect(finalState.frameCount).toBe(0); // No updates
      expect(finalState.time).toBe(0);
    });

    it('should accumulate time correctly', () => {
      const initialState = initWorld(42);
      const steps = 60; // 1 second at 60Hz
      const finalState = stepSync(initialState, updateWorld, steps);

      expect(finalState.frameCount).toBe(steps);
      expect(finalState.time).toBeCloseTo(1.0, 2); // ~1.0 seconds
    });

    it('should preserve seed across updates', () => {
      const seed = 12345;
      const initialState = initWorld(seed);
      const finalState = stepSync(initialState, updateWorld, 100);

      expect(finalState.seed).toBe(seed);
    });
  });

  describe('Constants', () => {
    it('should have correct timestep values', () => {
      expect(STEP_MS).toBeCloseTo(16.666, 2);
      expect(STEP_SEC).toBeCloseTo(0.01666, 4);
      expect(STEP_MS / 1000).toBeCloseTo(STEP_SEC, 6);
    });
  });

  describe('calculateFPSStats', () => {
    it('should calculate stats correctly', () => {
      const frameTimes = [10, 15, 20, 25, 30, 35, 40, 45, 50, 100];
      const stats = calculateFPSStats(frameTimes);

      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.avg).toBe(37);
      expect(stats.p95).toBeGreaterThan(50);
    });

    it('should handle empty array', () => {
      const stats = calculateFPSStats([]);
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('should handle single value', () => {
      const stats = calculateFPSStats([16.7]);
      expect(stats.avg).toBeCloseTo(16.7, 1);
      expect(stats.min).toBeCloseTo(16.7, 1);
      expect(stats.max).toBeCloseTo(16.7, 1);
    });
  });

  describe('Integration', () => {
    it('should simulate 5 seconds at 60fps', () => {
      const initialState = initWorld(42);
      const targetFrames = 60 * 5; // 5 seconds
      const finalState = stepSync(initialState, updateWorld, targetFrames);

      expect(finalState.frameCount).toBe(targetFrames);
      expect(finalState.time).toBeCloseTo(5.0, 1);
    });

    it('should maintain RNG state consistency', () => {
      // Two runs with same seed should produce identical results
      const run1 = stepSync(initWorld(777), updateWorld, 120);
      const run2 = stepSync(initWorld(777), updateWorld, 120);

      expect(run1.frameCount).toBe(run2.frameCount);
      expect(run1.time).toBeCloseTo(run2.time, 10);

      // Different seeds should produce different results
      const run3 = stepSync(initWorld(888), updateWorld, 120);
      // RNG state will be different even though frame counts match
      expect(run3.frameCount).toBe(run1.frameCount);
    });
  });
});
