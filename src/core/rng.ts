/**
 * S1: Core Loop & Deterministic RNG
 * Seeded RNG wrapper using pure-rand's xoroshiro128+
 * NO Math.random() allowed in core systems!
 */

import * as prand from 'pure-rand';

export type RNG = prand.RandomGenerator;

/**
 * Create a new seeded RNG instance
 */
export function mkRng(seed: number): RNG {
  return prand.xoroshiro128plus(seed);
}

/**
 * Generate next integer in range [min, max)
 * Returns [value, nextRng]
 */
export function nextInt(rng: RNG, min: number, max: number): readonly [number, RNG] {
  return prand.uniformIntDistribution(min, max - 1, rng);
}

/**
 * Generate next float in range [0, 1)
 * Returns [value, nextRng]
 */
export function nextFloat(rng: RNG): readonly [number, RNG] {
  const [n, r2] = rng.next();
  // Convert to [0, 1) range
  const value = (n >>> 0) / 0x100000000;
  return [value, r2] as const;
}

/**
 * Pick random element from array
 * Returns [element, nextRng]
 */
export function pick<T>(rng: RNG, array: T[]): readonly [T, RNG] {
  const [idx, r2] = nextInt(rng, 0, array.length);
  return [array[idx], r2] as const;
}

/**
 * Weighted random selection
 * Returns [item, nextRng]
 */
export function pickWeighted<T>(
  rng: RNG,
  table: Array<{ item: T; w: number }>
): readonly [T, RNG] {
  const total = table.reduce((s, t) => s + t.w, 0);
  const [n, r2] = nextFloat(rng);
  let roll = n * total;

  for (const t of table) {
    if ((roll -= t.w) <= 0) {
      return [t.item, r2] as const;
    }
  }

  return [table[table.length - 1].item, r2] as const;
}
