/**
 * Tests for object pool
 */

import { describe, it, expect } from 'vitest';
import { makePool, makePoolWithReset } from '../src/util/pool';

describe('Object Pool', () => {
  it('should create pool with specified size', () => {
    const pool = makePool(() => ({ value: 0 }), 10);

    expect(pool.size()).toBe(10);
    expect(pool.available()).toBe(10);
  });

  it('should take and return objects', () => {
    const pool = makePool(() => ({ value: 0 }), 5);

    const obj1 = pool.take();
    expect(obj1).not.toBeNull();
    expect(pool.available()).toBe(4);

    const obj2 = pool.take();
    expect(obj2).not.toBeNull();
    expect(pool.available()).toBe(3);

    pool.put(obj1!);
    expect(pool.available()).toBe(4);

    pool.put(obj2!);
    expect(pool.available()).toBe(5);
  });

  it('should return null when exhausted', () => {
    const pool = makePool(() => ({ value: 0 }), 2);

    const obj1 = pool.take();
    const obj2 = pool.take();
    const obj3 = pool.take();

    expect(obj1).not.toBeNull();
    expect(obj2).not.toBeNull();
    expect(obj3).toBeNull();
    expect(pool.available()).toBe(0);
  });

  it('should not exceed max size when putting', () => {
    const pool = makePool(() => ({ value: 0 }), 2);

    const extra = { value: 99 };
    pool.put(extra);
    pool.put(extra);
    pool.put(extra);

    expect(pool.available()).toBe(2); // Still at max
  });

  it('should reuse objects', () => {
    const pool = makePool(() => ({ value: 0 }), 5);

    const obj1 = pool.take();
    expect(obj1).not.toBeNull();
    obj1!.value = 42;

    pool.put(obj1!);
    const obj2 = pool.take();

    expect(obj2).toBe(obj1); // Same object
    expect(obj2!.value).toBe(42); // State preserved
  });

  it('should handle reset function', () => {
    let resetCount = 0;
    const pool = makePoolWithReset(
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0;
        resetCount++;
      },
      5
    );

    const obj1 = pool.take();
    expect(resetCount).toBe(1); // Reset called on take

    obj1!.value = 100;
    pool.put(obj1!);

    const obj2 = pool.take();
    expect(resetCount).toBe(2);
    expect(obj2!.value).toBe(0); // Reset to 0
  });

  it('should work with default size', () => {
    const pool = makePool(() => ({ value: 0 }));

    expect(pool.size()).toBe(512); // Default
    expect(pool.available()).toBe(512);
  });

  it('should handle rapid take/put cycles', () => {
    const pool = makePool(() => ({ id: Math.random() }), 10);

    for (let i = 0; i < 100; i++) {
      const items = [];
      for (let j = 0; j < 5; j++) {
        items.push(pool.take());
      }
      expect(pool.available()).toBe(5);

      for (const item of items) {
        if (item) pool.put(item);
      }
      expect(pool.available()).toBe(10);
    }
  });

  it('should maintain size after exhaustion and return', () => {
    const pool = makePool(() => ({ value: 0 }), 3);

    const items = [];
    items.push(pool.take());
    items.push(pool.take());
    items.push(pool.take());
    items.push(pool.take()); // null

    expect(pool.available()).toBe(0);

    items.forEach((item) => {
      if (item) pool.put(item);
    });

    expect(pool.available()).toBe(3);
    expect(pool.size()).toBe(3);
  });
});
