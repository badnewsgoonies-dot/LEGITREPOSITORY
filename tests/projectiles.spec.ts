/**
 * Tests for projectiles system
 */

import { describe, it, expect } from 'vitest';
import {
  stepProjectiles,
  createProjectileFactory,
  countActiveProjectiles,
  clearProjectiles,
} from '../src/systems/projectiles';
import { makePool } from '../src/util/pool';
import type { Projectile } from '../src/types';

describe('Projectiles System', () => {
  describe('createProjectileFactory', () => {
    it('should create inactive projectiles', () => {
      const factory = createProjectileFactory();
      const proj = factory();

      expect(proj.active).toBe(false);
      expect(proj.pos).toEqual({ x: 0, y: 0 });
      expect(proj.dir).toEqual({ x: 1, y: 0 });
      expect(proj.speed).toBe(0);
      expect(proj.damage).toBe(0);
      expect(proj.ttl).toBe(0);
    });
  });

  describe('stepProjectiles', () => {
    it('should move projectiles based on direction and speed', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
      ];

      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles[0].pos.x).toBeCloseTo(10, 5); // 100 * 0.1
      expect(projectiles[0].pos.y).toBeCloseTo(0, 5);
    });

    it('should decrement TTL', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
      ];

      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles[0].ttl).toBeCloseTo(0.9, 5);
    });

    it('should remove expired projectiles and return to pool', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const initialAvailable = pool.available();

      // Take from pool (so it can be returned)
      const proj = pool.take();
      expect(proj).not.toBeNull();

      proj!.active = true;
      proj!.pos = { x: 0, y: 0 };
      proj!.dir = { x: 1, y: 0 };
      proj!.speed = 100;
      proj!.damage = 10;
      proj!.ttl = 0.05;

      const projectiles: Projectile[] = [proj!];

      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles.length).toBe(0); // Removed
      expect(pool.available()).toBe(initialAvailable); // Returned to pool
    });

    it('should handle multiple projectiles', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
        {
          active: true,
          pos: { x: 10, y: 10 },
          dir: { x: 0, y: 1 },
          speed: 200,
          damage: 20,
          ttl: 2.0,
        },
        {
          active: true,
          pos: { x: 20, y: 20 },
          dir: { x: -1, y: 0 },
          speed: 50,
          damage: 5,
          ttl: 0.05, // Will expire
        },
      ];

      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles.length).toBe(2); // One expired
      expect(projectiles[0].pos.x).toBeCloseTo(10, 5);
      expect(projectiles[1].pos.y).toBeCloseTo(30, 5);
    });

    it('should remove inactive projectiles', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [
        {
          active: false,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
      ];

      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles.length).toBe(0);
    });

    it('should handle diagonal movement', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const sqrt2 = Math.sqrt(2);
      const projectiles: Projectile[] = [
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1 / sqrt2, y: 1 / sqrt2 }, // 45 degrees
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
      ];

      stepProjectiles(0.1, projectiles, pool);

      // Distance traveled = 100 * 0.1 = 10
      // x and y should each be ~7.07
      expect(projectiles[0].pos.x).toBeCloseTo(7.07, 2);
      expect(projectiles[0].pos.y).toBeCloseTo(7.07, 2);
    });

    it('should handle empty array', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [];

      expect(() => stepProjectiles(0.1, projectiles, pool)).not.toThrow();
      expect(projectiles.length).toBe(0);
    });

    it('should return expired projectiles to pool and recover pool size', () => {
      const pool = makePool(createProjectileFactory(), 5);
      expect(pool.available()).toBe(5);

      // Take all from pool
      const projectiles: Projectile[] = [];
      for (let i = 0; i < 5; i++) {
        const proj = pool.take();
        if (proj) {
          proj.active = true;
          proj.ttl = 0.01; // Will expire quickly
          projectiles.push(proj);
        }
      }

      expect(pool.available()).toBe(0);
      expect(projectiles.length).toBe(5);

      // Step to expire all
      stepProjectiles(0.1, projectiles, pool);

      expect(projectiles.length).toBe(0);
      expect(pool.available()).toBe(5); // All returned
    });
  });

  describe('countActiveProjectiles', () => {
    it('should count only active projectiles', () => {
      const projectiles: Projectile[] = [
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
        {
          active: false,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
        {
          active: true,
          pos: { x: 0, y: 0 },
          dir: { x: 1, y: 0 },
          speed: 100,
          damage: 10,
          ttl: 1.0,
        },
      ];

      expect(countActiveProjectiles(projectiles)).toBe(2);
    });
  });

  describe('clearProjectiles', () => {
    it('should clear all projectiles and return to pool', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [];

      for (let i = 0; i < 5; i++) {
        const proj = pool.take();
        if (proj) {
          proj.active = true;
          projectiles.push(proj);
        }
      }

      expect(pool.available()).toBe(5);
      expect(projectiles.length).toBe(5);

      clearProjectiles(projectiles, pool);

      expect(projectiles.length).toBe(0);
      expect(pool.available()).toBe(10);
    });
  });

  describe('Integration', () => {
    it('should simulate full lifecycle', () => {
      const pool = makePool(createProjectileFactory(), 10);
      const projectiles: Projectile[] = [];

      // Spawn projectile
      const proj = pool.take();
      expect(proj).not.toBeNull();
      proj!.active = true;
      proj!.pos = { x: 0, y: 0 };
      proj!.dir = { x: 1, y: 0 };
      proj!.speed = 100;
      proj!.damage = 10;
      proj!.ttl = 0.5;
      projectiles.push(proj!);

      expect(pool.available()).toBe(9);

      // Update for 0.3s (still alive)
      for (let i = 0; i < 3; i++) {
        stepProjectiles(0.1, projectiles, pool);
      }

      expect(projectiles.length).toBe(1);
      expect(projectiles[0].pos.x).toBeCloseTo(30, 5);
      expect(projectiles[0].ttl).toBeCloseTo(0.2, 5);

      // Update for another 0.3s (should expire)
      for (let i = 0; i < 3; i++) {
        stepProjectiles(0.1, projectiles, pool);
      }

      expect(projectiles.length).toBe(0);
      expect(pool.available()).toBe(10); // Returned
    });
  });
});
