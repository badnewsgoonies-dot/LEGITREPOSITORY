/**
 * Object pool for efficient memory management
 *
 * Pools pre-allocate objects and reuse them instead of creating/destroying.
 * This reduces GC pressure and improves performance for frequently
 * created/destroyed objects like projectiles.
 */

import type { Pool } from '../types';

/**
 * Create an object pool with a factory function.
 *
 * @param factory - Function that creates new instances
 * @param size - Maximum pool size (default 512)
 * @returns Pool interface with take/put methods
 */
export function makePool<T>(factory: () => T, size = 512): Pool<T> {
  const free: T[] = Array.from({ length: size }, factory);
  const used: T[] = [];
  const total = size;

  return {
    /**
     * Take an object from the pool.
     * Returns null if pool is exhausted.
     */
    take: (): T | null => {
      const item = free.pop() ?? null;
      if (item !== null) {
        used.push(item);
      }
      return item;
    },

    /**
     * Return an object to the pool.
     */
    put: (o: T): void => {
      const idx = used.indexOf(o);
      if (idx !== -1) {
        used.splice(idx, 1);
        free.push(o);
      }
    },

    /**
     * Get total pool size.
     */
    size: (): number => {
      return total;
    },

    /**
     * Get number of available objects.
     */
    available: (): number => {
      return free.length;
    },
  };
}

/**
 * Helper to create a pool with a reset function.
 * The reset function is called before returning items from take().
 *
 * @param factory - Function that creates new instances
 * @param reset - Function to reset object state
 * @param size - Maximum pool size
 * @returns Pool interface
 */
export function makePoolWithReset<T>(
  factory: () => T,
  reset: (item: T) => void,
  size = 512
): Pool<T> {
  const pool = makePool(factory, size);

  return {
    take: (): T | null => {
      const item = pool.take();
      if (item !== null) {
        reset(item);
      }
      return item;
    },
    put: pool.put,
    size: pool.size,
    available: pool.available,
  };
}
