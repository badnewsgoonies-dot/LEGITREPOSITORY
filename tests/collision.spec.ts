/**
 * Tests for S5: Collision, Damage & Knockback
 */

import { describe, it, expect } from 'vitest';
import { overlaps, circleOverlap, resolveCollisions } from '../src/systems/collision';
import { createPlayer } from '../src/systems/player';
import type { Rect, Enemy, Projectile } from '../src/types/game';

describe('Collision Detection', () => {
  it('should detect AABB overlap', () => {
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 5, y: 5, w: 10, h: 10 };

    expect(overlaps(a, b)).toBe(true);
  });

  it('should detect no AABB overlap', () => {
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 20, y: 20, w: 10, h: 10 };

    expect(overlaps(a, b)).toBe(false);
  });

  it('should detect circle overlap', () => {
    expect(circleOverlap(0, 0, 10, 5, 5, 10)).toBe(true);
  });

  it('should detect no circle overlap', () => {
    expect(circleOverlap(0, 0, 10, 50, 50, 10)).toBe(false);
  });
});

describe('Collision Resolution', () => {
  it('should damage player when hit by enemy', () => {
    const player = createPlayer();
    const enemy: Enemy = {
      id: 1,
      type: 'enemy',
      x: player.x,
      y: player.y,
      vx: 0,
      vy: 0,
      hp: 10,
      maxHp: 10,
      radius: 12,
      speed: 100,
      damage: 20,
      xpValue: 1,
      enemyType: 'bat',
      knockbackResist: 0,
    };

    const result = resolveCollisions(player, [enemy], [], []);

    expect(result.player.hp).toBeLessThan(player.hp);
    expect(result.events.length).toBeGreaterThan(0);
  });

  it('should damage enemy when hit by projectile', () => {
    const player = createPlayer();
    const enemy: Enemy = {
      id: 1,
      type: 'enemy',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      hp: 20,
      maxHp: 20,
      radius: 12,
      speed: 100,
      damage: 5,
      xpValue: 1,
      enemyType: 'bat',
      knockbackResist: 0,
    };

    const projectile: Projectile = {
      id: 1,
      type: 'projectile',
      x: 100,
      y: 100,
      vx: 100,
      vy: 0,
      hp: 1,
      maxHp: 1,
      radius: 8,
      damage: 5,
      ttl: 2,
      piercing: 1,
      hitIds: new Set(),
      weaponId: 'test',
    };

    const result = resolveCollisions(player, [enemy], [projectile], []);

    expect(result.enemies[0].hp).toBe(15);
    expect(result.enemies.length).toBe(1);
  });

  it('should remove dead enemies', () => {
    const player = createPlayer();
    const enemy: Enemy = {
      id: 1,
      type: 'enemy',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      hp: 5,
      maxHp: 10,
      radius: 12,
      speed: 100,
      damage: 5,
      xpValue: 1,
      enemyType: 'bat',
      knockbackResist: 0,
    };

    const projectile: Projectile = {
      id: 1,
      type: 'projectile',
      x: 100,
      y: 100,
      vx: 100,
      vy: 0,
      hp: 1,
      maxHp: 1,
      radius: 8,
      damage: 15,
      ttl: 2,
      piercing: 1,
      hitIds: new Set(),
      weaponId: 'test',
    };

    const result = resolveCollisions(player, [enemy], [projectile], []);

    expect(result.enemies.length).toBe(0);
  });
});
