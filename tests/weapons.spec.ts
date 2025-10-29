/**
 * Tests for weapons system
 */

import { describe, it, expect } from 'vitest';
import { stepWeapons, createWeapon } from '../src/systems/weapons';
import { makePool } from '../src/util/pool';
import { createProjectileFactory } from '../src/systems/projectiles';
import { mkRng } from '../src/core/rng';
import type { Weapon } from '../src/types';

describe('Weapons System', () => {
  describe('createWeapon', () => {
    it('should create weapon with default values', () => {
      const weapon = createWeapon('test');

      expect(weapon.id).toBe('test');
      expect(weapon.type).toBe('basic');
      expect(weapon.damage).toBe(10);
      expect(weapon.cooldown).toBe(0.5);
      expect(weapon.cooldownTimer).toBe(0);
      expect(weapon.projectileSpeed).toBe(300);
      expect(weapon.projectileCount).toBe(1);
      expect(weapon.spreadAngle).toBe(0);
      expect(weapon.ttl).toBe(2.0);
    });

    it('should apply overrides', () => {
      const weapon = createWeapon('custom', {
        damage: 50,
        cooldown: 1.0,
        projectileCount: 3,
      });

      expect(weapon.id).toBe('custom');
      expect(weapon.damage).toBe(50);
      expect(weapon.cooldown).toBe(1.0);
      expect(weapon.projectileCount).toBe(3);
      expect(weapon.type).toBe('basic'); // Still default
    });
  });

  describe('stepWeapons', () => {
    it('should update cooldown timers', () => {
      const weapon = createWeapon('test', { cooldownTimer: 1.0 });
      const pool = makePool(createProjectileFactory(), 10);
      const rng = mkRng(42);

      stepWeapons(0.1, [weapon], rng, pool, { x: 0, y: 0 }, { x: 1, y: 0 });

      expect(weapon.cooldownTimer).toBeCloseTo(0.9, 5);
    });

    it('should fire when cooldown reaches zero', () => {
      const weapon = createWeapon('test', {
        cooldownTimer: 0.05,
        cooldown: 0.5,
        projectileCount: 1,
      });
      const pool = makePool(createProjectileFactory(), 10);
      const rng = mkRng(42);

      const result = stepWeapons(
        0.1,
        [weapon],
        rng,
        pool,
        { x: 100, y: 200 },
        { x: 1, y: 0 }
      );

      expect(result.newProjectiles.length).toBe(1);
      expect(weapon.cooldownTimer).toBeCloseTo(0.5, 5); // Reset to cooldown
    });

    it('should not fire when cooldown is positive', () => {
      const weapon = createWeapon('test', {
        cooldownTimer: 0.5,
        projectileCount: 1,
      });
      const pool = makePool(createProjectileFactory(), 10);
      const rng = mkRng(42);

      const result = stepWeapons(
        0.1,
        [weapon],
        rng,
        pool,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      expect(result.newProjectiles.length).toBe(0);
    });

    it('should fire multiple projectiles per shot', () => {
      const weapon = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 5,
        spreadAngle: 30,
      });
      const pool = makePool(createProjectileFactory(), 20);
      const rng = mkRng(42);

      const result = stepWeapons(
        0.1,
        [weapon],
        rng,
        pool,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      expect(result.newProjectiles.length).toBe(5);
    });

    it('should produce deterministic projectile angles with same seed', () => {
      const weapon1 = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 3,
        spreadAngle: 45,
      });
      const weapon2 = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 3,
        spreadAngle: 45,
      });

      const pool1 = makePool(createProjectileFactory(), 20);
      const pool2 = makePool(createProjectileFactory(), 20);

      const rng1 = mkRng(12345);
      const rng2 = mkRng(12345);

      const result1 = stepWeapons(
        0.1,
        [weapon1],
        rng1,
        pool1,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      const result2 = stepWeapons(
        0.1,
        [weapon2],
        rng2,
        pool2,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      expect(result1.newProjectiles.length).toBe(3);
      expect(result2.newProjectiles.length).toBe(3);

      // Compare directions (should be identical with same seed)
      for (let i = 0; i < 3; i++) {
        expect(result1.newProjectiles[i].dir.x).toBeCloseTo(
          result2.newProjectiles[i].dir.x,
          10
        );
        expect(result1.newProjectiles[i].dir.y).toBeCloseTo(
          result2.newProjectiles[i].dir.y,
          10
        );
      }
    });

    it('should produce different angles with different seeds', () => {
      const weapon1 = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 3,
        spreadAngle: 45,
      });
      const weapon2 = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 3,
        spreadAngle: 45,
      });

      const pool1 = makePool(createProjectileFactory(), 20);
      const pool2 = makePool(createProjectileFactory(), 20);

      const rng1 = mkRng(111);
      const rng2 = mkRng(999);

      const result1 = stepWeapons(
        0.1,
        [weapon1],
        rng1,
        pool1,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      const result2 = stepWeapons(
        0.1,
        [weapon2],
        rng2,
        pool2,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      // At least one direction should differ
      let hasDifference = false;
      for (let i = 0; i < 3; i++) {
        if (
          Math.abs(result1.newProjectiles[i].dir.x - result2.newProjectiles[i].dir.x) >
            0.001 ||
          Math.abs(result1.newProjectiles[i].dir.y - result2.newProjectiles[i].dir.y) >
            0.001
        ) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });

    it('should handle pool exhaustion gracefully', () => {
      const weapon = createWeapon('test', {
        cooldownTimer: 0,
        projectileCount: 10,
      });
      const pool = makePool(createProjectileFactory(), 5); // Only 5 available
      const rng = mkRng(42);

      const result = stepWeapons(
        0.1,
        [weapon],
        rng,
        pool,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      expect(result.newProjectiles.length).toBe(5); // Only 5 created
    });

    it('should initialize projectile properties correctly', () => {
      const weapon = createWeapon('test', {
        cooldownTimer: 0,
        damage: 25,
        projectileSpeed: 400,
        ttl: 3.0,
        projectileCount: 1,
      });
      const pool = makePool(createProjectileFactory(), 10);
      const rng = mkRng(42);
      const pos = { x: 100, y: 200 };
      const dir = { x: 0.707, y: 0.707 };

      const result = stepWeapons(0.1, [weapon], rng, pool, pos, dir);

      const proj = result.newProjectiles[0];
      expect(proj.active).toBe(true);
      expect(proj.pos.x).toBe(100);
      expect(proj.pos.y).toBe(200);
      expect(proj.speed).toBe(400);
      expect(proj.damage).toBe(25);
      expect(proj.ttl).toBe(3.0);
      expect(proj.ownerId).toBe('test');
    });

    it('should handle multiple weapons', () => {
      const weapon1 = createWeapon('w1', { cooldownTimer: 0 });
      const weapon2 = createWeapon('w2', { cooldownTimer: 0 });
      const weapon3 = createWeapon('w3', { cooldownTimer: 0.5 }); // Not ready

      const pool = makePool(createProjectileFactory(), 20);
      const rng = mkRng(42);

      const result = stepWeapons(
        0.1,
        [weapon1, weapon2, weapon3],
        rng,
        pool,
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      );

      expect(result.newProjectiles.length).toBe(2); // Only w1 and w2 fired
    });

    it('should adhere to cooldown timing within 1 tick', () => {
      const weapon = createWeapon('test', {
        cooldown: 0.5,
        cooldownTimer: 0.5,
      });
      const pool = makePool(createProjectileFactory(), 20);
      let rng = mkRng(42);

      const dt = 0.016666; // ~60fps

      // Should fire after ~30 ticks (0.5s / 0.016666)
      let fireCount = 0;
      for (let i = 0; i < 35; i++) {
        const result = stepWeapons(
          dt,
          [weapon],
          rng,
          pool,
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        );
        rng = result.rng;
        if (result.newProjectiles.length > 0) {
          fireCount++;
        }
      }

      // Should fire once in first 0.5s, once more shortly after
      expect(fireCount).toBeGreaterThanOrEqual(1);
      expect(fireCount).toBeLessThanOrEqual(2);
    });
  });
});
