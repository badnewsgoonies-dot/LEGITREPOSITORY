/**
 * Tests for deterministic RNG
 */

import { describe, it, expect } from 'vitest';
import { mkRng, nextFloat, nextInt, nextRange, choose, chance, shuffle } from '../src/core/rng';

describe('Deterministic RNG', () => {
  it('should produce same sequence from same seed', () => {
    // Run 1
    let rng1 = mkRng(123);
    const [val1a, rng1b] = nextFloat(rng1);
    const [val1c, _] = nextFloat(rng1b);

    // Run 2
    let rng2 = mkRng(123);
    const [val2a, rng2b] = nextFloat(rng2);
    const [val2c, __] = nextFloat(rng2b);

    expect(val1a).toBe(val2a);
    expect(val1c).toBe(val2c);
  });

  it('should produce different values from different seeds', () => {
    const [val1] = nextFloat(mkRng(123));
    const [val2] = nextFloat(mkRng(456));

    expect(val1).not.toBe(val2);
  });

  it('should produce values in [0, 1) range', () => {
    let rng = mkRng(42);
    for (let i = 0; i < 100; i++) {
      const [value, newRng] = nextFloat(rng);
      rng = newRng;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should produce deterministic integers in range', () => {
    let rng1 = mkRng(999);
    let rng2 = mkRng(999);

    for (let i = 0; i < 20; i++) {
      const [val1, newRng1] = nextInt(rng1, 1, 10);
      const [val2, newRng2] = nextInt(rng2, 1, 10);
      rng1 = newRng1;
      rng2 = newRng2;

      expect(val1).toBe(val2);
      expect(val1).toBeGreaterThanOrEqual(1);
      expect(val1).toBeLessThanOrEqual(10);
    }
  });

  it('should produce deterministic floats in range', () => {
    let rng1 = mkRng(777);
    let rng2 = mkRng(777);

    for (let i = 0; i < 20; i++) {
      const [val1, newRng1] = nextRange(rng1, 10.5, 20.5);
      const [val2, newRng2] = nextRange(rng2, 10.5, 20.5);
      rng1 = newRng1;
      rng2 = newRng2;

      expect(val1).toBe(val2);
      expect(val1).toBeGreaterThanOrEqual(10.5);
      expect(val1).toBeLessThan(20.5);
    }
  });

  it('should choose deterministically from array', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const [item1] = choose(mkRng(555), items);
    const [item2] = choose(mkRng(555), items);

    expect(item1).toBe(item2);
    expect(items).toContain(item1);
  });

  it('should throw on empty array', () => {
    expect(() => choose(mkRng(0), [])).toThrow('Cannot choose from empty array');
  });

  it('should produce deterministic chance results', () => {
    let rng1 = mkRng(333);
    let rng2 = mkRng(333);

    for (let i = 0; i < 10; i++) {
      const [result1, newRng1] = chance(rng1, 0.5);
      const [result2, newRng2] = chance(rng2, 0.5);
      rng1 = newRng1;
      rng2 = newRng2;

      expect(result1).toBe(result2);
    }
  });

  it('should shuffle deterministically', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [shuffled1] = shuffle(mkRng(111), arr);
    const [shuffled2] = shuffle(mkRng(111), arr);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1.sort((a, b) => a - b)).toEqual(arr); // same elements
  });

  it('should not mutate original array', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(mkRng(222), original);

    expect(original).toEqual(copy);
  });
});
