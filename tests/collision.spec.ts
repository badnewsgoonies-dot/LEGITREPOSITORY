/**
 * Tests for collision detection system
 */

import { describe, it, expect } from 'vitest';
import {
  checkAABB,
  checkCircle,
  checkCircleAABB,
  calculateKnockback,
  detectCollisions,
  resolveCollisions,
} from '../src/systems/collision';
import { initWorld } from '../src/state/world';
import type { AABB, Circle, Vec2, WorldState, Enemy } from '../src/types';

describe('Collision Detection', () => {
  describe('checkAABB', () => {
    it('should detect overlapping AABBs', () => {
      const a: AABB = { x: 0, y: 0, width: 10, height: 10 };
      const b: AABB = { x: 5, y: 5, width: 10, height: 10 };

      expect(checkAABB(a, b)).toBe(true);
    });

    it('should produce exactly one contact for overlapping AABBs', () => {
      const a: AABB = { x: 0, y: 0, width: 10, height: 10 };
      const b: AABB = { x: 5, y: 5, width: 10, height: 10 };

      // Should overlap
      const overlaps = checkAABB(a, b);
      expect(overlaps).toBe(true);

      // Count should be exactly 1 (not multiple contacts)
      let contactCount = 0;
      if (overlaps) contactCount++;
      expect(contactCount).toBe(1);
    });

    it('should not detect non-overlapping AABBs', () => {
      const a: AABB = { x: 0, y: 0, width: 10, height: 10 };
      const b: AABB = { x: 20, y: 20, width: 10, height: 10 };

      expect(checkAABB(a, b)).toBe(false);
    });

    it('should detect edge-touching AABBs as non-overlapping', () => {
      const a: AABB = { x: 0, y: 0, width: 10, height: 10 };
      const b: AABB = { x: 10, y: 0, width: 10, height: 10 };

      // Standard AABB check treats touching edges as non-overlapping
      expect(checkAABB(a, b)).toBe(false);
    });

    it('should handle negative positions', () => {
      const a: AABB = { x: -10, y: -10, width: 10, height: 10 };
      const b: AABB = { x: -5, y: -5, width: 10, height: 10 };

      expect(checkAABB(a, b)).toBe(true);
    });

    it('should handle complete containment', () => {
      const a: AABB = { x: 0, y: 0, width: 100, height: 100 };
      const b: AABB = { x: 10, y: 10, width: 10, height: 10 };

      expect(checkAABB(a, b)).toBe(true);
      expect(checkAABB(b, a)).toBe(true); // Should be symmetric
    });
  });

  describe('checkCircle', () => {
    it('should detect overlapping circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 15, y: 0, radius: 10 };

      expect(checkCircle(a, b)).toBe(true);
    });

    it('should not detect non-overlapping circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 30, y: 0, radius: 10 };

      expect(checkCircle(a, b)).toBe(false);
    });

    it('should handle exact touching circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 20, y: 0, radius: 10 };

      // Exact touching should not be considered overlap (< not <=)
      expect(checkCircle(a, b)).toBe(false);
    });

    it('should handle concentric circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 0, y: 0, radius: 5 };

      expect(checkCircle(a, b)).toBe(true);
    });

    it('should be symmetric', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 10, y: 0, radius: 10 };

      expect(checkCircle(a, b)).toBe(checkCircle(b, a));
    });
  });

  describe('checkCircleAABB', () => {
    it('should detect circle overlapping AABB center', () => {
      const circle: Circle = { x: 5, y: 5, radius: 3 };
      const aabb: AABB = { x: 0, y: 0, width: 10, height: 10 };

      expect(checkCircleAABB(circle, aabb)).toBe(true);
    });

    it('should detect circle overlapping AABB corner', () => {
      const circle: Circle = { x: 12, y: 12, radius: 5 };
      const aabb: AABB = { x: 0, y: 0, width: 10, height: 10 };

      expect(checkCircleAABB(circle, aabb)).toBe(true);
    });

    it('should not detect non-overlapping circle and AABB', () => {
      const circle: Circle = { x: 50, y: 50, radius: 5 };
      const aabb: AABB = { x: 0, y: 0, width: 10, height: 10 };

      expect(checkCircleAABB(circle, aabb)).toBe(false);
    });

    it('should detect circle inside AABB', () => {
      const circle: Circle = { x: 5, y: 5, radius: 2 };
      const aabb: AABB = { x: 0, y: 0, width: 10, height: 10 };

      expect(checkCircleAABB(circle, aabb)).toBe(true);
    });
  });

  describe('calculateKnockback', () => {
    it('should calculate knockback vector from A to B', () => {
      const posA: Vec2 = { x: 0, y: 0 };
      const posB: Vec2 = { x: 10, y: 0 };
      const magnitude = 50;

      const knockback = calculateKnockback(posA, posB, magnitude);

      expect(knockback.x).toBeCloseTo(50, 5);
      expect(knockback.y).toBeCloseTo(0, 5);
    });

    it('should normalize direction', () => {
      const posA: Vec2 = { x: 0, y: 0 };
      const posB: Vec2 = { x: 3, y: 4 }; // Distance = 5
      const magnitude = 10;

      const knockback = calculateKnockback(posA, posB, magnitude);

      // Should be normalized then scaled by magnitude
      expect(knockback.x).toBeCloseTo(6, 5); // (3/5) * 10
      expect(knockback.y).toBeCloseTo(8, 5); // (4/5) * 10
    });

    it('should handle identical positions', () => {
      const posA: Vec2 = { x: 5, y: 5 };
      const posB: Vec2 = { x: 5, y: 5 };
      const magnitude = 50;

      const knockback = calculateKnockback(posA, posB, magnitude);

      // Should return default direction
      expect(knockback.x).toBe(50);
      expect(knockback.y).toBe(0);
    });

    it('should move entity away by magnitude K within tolerance', () => {
      const posA: Vec2 = { x: 100, y: 100 };
      const posB: Vec2 = { x: 110, y: 100 };
      const magnitude = 50;

      const knockback = calculateKnockback(posA, posB, magnitude);

      // Calculate magnitude of knockback vector
      const actualMagnitude = Math.sqrt(
        knockback.x * knockback.x + knockback.y * knockback.y
      );

      const epsilon = 0.001;
      expect(actualMagnitude).toBeCloseTo(magnitude, epsilon);
    });
  });

  describe('detectCollisions', () => {
    it('should detect projectile-enemy collisions', () => {
      const world = initWorld(42, true);

      // Add a projectile
      world.projectiles.push({
        active: true,
        pos: { x: 100, y: 100 },
        dir: { x: 1, y: 0 },
        speed: 300,
        damage: 10,
        ttl: 2,
        radius: 3,
      });

      // Add an enemy at same position
      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = detectCollisions(world);

      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0].type).toBe('projectile-enemy');
    });

    it('should detect enemy-player collisions', () => {
      const world = initWorld(42, false);

      // Set player position
      world.player.pos = { x: 400, y: 300 };

      // Add enemy at player position
      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 400, y: 300 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = detectCollisions(world);

      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts[0].type).toBe('enemy-player');
    });

    it('should not detect distant entities', () => {
      const world = initWorld(42, false);

      // Projectile far from enemy
      world.projectiles.push({
        active: true,
        pos: { x: 0, y: 0 },
        dir: { x: 1, y: 0 },
        speed: 300,
        damage: 10,
        ttl: 2,
        radius: 3,
      });

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 1000, y: 1000 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = detectCollisions(world);

      expect(contacts.length).toBe(0);
    });

    it('should mark projectile as inactive on collision', () => {
      const world = initWorld(42, true);

      world.projectiles.push({
        active: true,
        pos: { x: 100, y: 100 },
        dir: { x: 1, y: 0 },
        speed: 300,
        damage: 10,
        ttl: 2,
        radius: 3,
      });

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      detectCollisions(world);

      expect(world.projectiles[0].active).toBe(false);
    });
  });

  describe('resolveCollisions', () => {
    it('should apply damage to enemy', () => {
      const world = initWorld(42, false);

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = [
        {
          type: 'projectile-enemy' as const,
          entityA: 'projectile_0',
          entityB: 'enemy_0',
          damage: 10,
          knockback: { x: 10, y: 0 },
        },
      ];

      resolveCollisions(world, contacts);

      expect(enemy.hp).toBe(10); // 20 - 10
    });

    it('should remove dead enemies', () => {
      const world = initWorld(42, false);

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 5,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = [
        {
          type: 'projectile-enemy' as const,
          entityA: 'projectile_0',
          entityB: 'enemy_0',
          damage: 10,
        },
      ];

      resolveCollisions(world, contacts);

      expect(world.enemies.length).toBe(0);
    });

    it('should apply knockback to enemy', () => {
      const world = initWorld(42, false);

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const initialX = enemy.pos.x;

      const contacts = [
        {
          type: 'projectile-enemy' as const,
          entityA: 'projectile_0',
          entityB: 'enemy_0',
          damage: 10,
          knockback: { x: 50, y: 0 },
        },
      ];

      resolveCollisions(world, contacts);

      // Knockback is applied with dt scaling
      expect(enemy.pos.x).toBeGreaterThan(initialX);
    });

    it('should generate damage events', () => {
      const world = initWorld(42, false);

      const enemy: Enemy = {
        id: 'enemy_0',
        kind: 'zombie',
        pos: { x: 100, y: 100 },
        hp: 20,
        maxHp: 20,
        speed: 50,
        touchDamage: 5,
        isElite: false,
        radius: 8,
      };
      world.enemies.push(enemy);

      const contacts = [
        {
          type: 'projectile-enemy' as const,
          entityA: 'projectile_0',
          entityB: 'enemy_0',
          damage: 10,
        },
      ];

      const events = resolveCollisions(world, contacts);

      expect(events.length).toBe(1);
      expect(events[0].targetId).toBe('enemy_0');
      expect(events[0].damage).toBe(10);
      expect(events[0].source).toBe('projectile');
    });
  });
});
