/**
 * Deterministic RNG using pure-rand's xoroshiro128+
 *
 * CRITICAL: All RNG operations return a NEW RNG state.
 * pure-rand generators are immutable.
 *
 * Usage:
 *   let rng = mkRng(12345);
 *   const [value, newRng] = nextFloat(rng);
 *   rng = newRng; // MUST update to new state
 */

import { xoroshiro128plus } from 'pure-rand';
import type { RNG } from '../types';

/**
 * Create a new deterministic RNG from a seed.
 * @param seed - Integer seed for reproducibility
 * @returns RNG state
 */
export function mkRng(seed: number): RNG {
  return {
    generator: xoroshiro128plus(seed),
  };
}

/**
 * Generate a random float in [0, 1) and return updated RNG.
 * @param rng - Current RNG state
 * @returns [value, newRng] tuple
 */
export function nextFloat(rng: RNG): [number, RNG] {
  // pure-rand's unsafeUniformDoubleDistribution gives [0, 1)
  const { generator } = rng;
  const value = generator.unsafeNext() >>> 0; // ensure unsigned 32-bit
  const normalized = value / 0x100000000; // divide by 2^32

  return [
    normalized,
    { generator: generator.jump ? generator.jump() : generator },
  ];
}

/**
 * Generate a random integer in [min, max] and return updated RNG.
 * @param rng - Current RNG state
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns [value, newRng] tuple
 */
export function nextInt(rng: RNG, min: number, max: number): [number, RNG] {
  const [value, newRng] = nextFloat(rng);
  const range = max - min + 1;
  return [Math.floor(value * range) + min, newRng];
}

/**
 * Generate a random float in [min, max) and return updated RNG.
 * @param rng - Current RNG state
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns [value, newRng] tuple
 */
export function nextRange(rng: RNG, min: number, max: number): [number, RNG] {
  const [value, newRng] = nextFloat(rng);
  return [min + value * (max - min), newRng];
}

/**
 * Choose a random element from an array and return updated RNG.
 * @param rng - Current RNG state
 * @param array - Array to choose from
 * @returns [element, newRng] tuple
 * @throws Error if array is empty
 */
export function choose<T>(rng: RNG, array: T[]): [T, RNG] {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  const [index, newRng] = nextInt(rng, 0, array.length - 1);
  return [array[index], newRng];
}

/**
 * Return true with given probability and updated RNG.
 * @param rng - Current RNG state
 * @param probability - Probability in [0, 1]
 * @returns [boolean, newRng] tuple
 */
export function chance(rng: RNG, probability: number): [boolean, RNG] {
  const [value, newRng] = nextFloat(rng);
  return [value < probability, newRng];
}

/**
 * Shuffle an array in-place (Fisher-Yates) and return updated RNG.
 * WARNING: This mutates the input array!
 * @param rng - Current RNG state
 * @param array - Array to shuffle
 * @returns [shuffledArray, newRng] tuple
 */
export function shuffle<T>(rng: RNG, array: T[]): [T[], RNG] {
  let currentRng = rng;
  const arr = [...array]; // copy to avoid mutation

  for (let i = arr.length - 1; i > 0; i--) {
    const [j, newRng] = nextInt(currentRng, 0, i);
    currentRng = newRng;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return [arr, currentRng];
}
