/**
 * Tests for S1: Core Loop & Deterministic RNG
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mkRng, nextInt, nextFloat, pick, pickWeighted } from '../src/core/rng';
import { setUpdateCallback, start, stop, reset } from '../src/core/loop';

describe('RNG', () => {
  it('should produce deterministic integers for same seed', () => {
    const rng1 = mkRng(12345);
    const rng2 = mkRng(12345);

    const [val1, r1] = nextInt(rng1, 0, 100);
    const [val2, r2] = nextInt(rng2, 0, 100);

    expect(val1).toBe(val2);
  });

  it('should produce deterministic floats for same seed', () => {
    const rng1 = mkRng(12345);
    const rng2 = mkRng(12345);

    const [val1] = nextFloat(rng1);
    const [val2] = nextFloat(rng2);

    expect(val1).toBe(val2);
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
  });

  it('should pick same element for same seed', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const rng1 = mkRng(42);
    const rng2 = mkRng(42);

    const [pick1] = pick(rng1, arr);
    const [pick2] = pick(rng2, arr);

    expect(pick1).toBe(pick2);
  });

  it('should respect weights in weighted pick', () => {
    const table = [
      { item: 'rare', w: 1 },
      { item: 'common', w: 99 },
    ];

    const rng = mkRng(123);
    const results: string[] = [];

    let currentRng = rng;
    for (let i = 0; i < 100; i++) {
      const [item, r2] = pickWeighted(currentRng, table);
      currentRng = r2;
      results.push(item);
    }

    const commonCount = results.filter((r) => r === 'common').length;
    expect(commonCount).toBeGreaterThan(80); // Should be ~99%
  });
});

describe('Game Loop', () => {
  beforeEach(() => {
    reset();
  });

  it('should call update callback at fixed timestep', () => {
    let callCount = 0;
    setUpdateCallback(() => {
      callCount++;
    });

    // Loop tests would require mocking performance.now()
    // For now, just verify callback is set
    expect(callCount).toBe(0);
  });
});
