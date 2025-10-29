/**
 * Tests for S3: Weapons & Projectiles
 */

import { describe, it, expect } from 'vitest';
import { stepWeapons, stepProjectiles } from '../src/systems/weapons';
import { createPlayer } from '../src/systems/player';
import { mkRng } from '../src/core/rng';
import type { Weapon } from '../src/types/game';

describe('Weapons', () => {
  it('should fire weapon when cooldown is ready', () => {
    const player = createPlayer();
    const weapon: Weapon = {
      id: 'test',
      name: 'Test',
      level: 1,
      cooldown: 1.0,
      currentCd: 0,
      damage: 10,
      behavior: {
        type: 'projectile',
        speed: 300,
        ttl: 2,
        count: 1,
        spread: 0,
        piercing: 1,
      },
    };
    player.weapons.push(weapon);

    const rng = mkRng(42);
    const result = stepWeapons(0.016, rng, player, []);

    expect(result.projectiles.length).toBeGreaterThan(0);
  });

  it('should respect cooldown', () => {
    const player = createPlayer();
    const weapon: Weapon = {
      id: 'test',
      name: 'Test',
      level: 1,
      cooldown: 1.0,
      currentCd: 0.5, // Still cooling down
      damage: 10,
      behavior: {
        type: 'projectile',
        speed: 300,
        ttl: 2,
        count: 1,
        spread: 0,
        piercing: 1,
      },
    };
    player.weapons.push(weapon);

    const rng = mkRng(42);
    const result = stepWeapons(0.016, rng, player, []);

    expect(result.projectiles.length).toBe(0);
  });

  it('should produce deterministic projectile angles for same seed', () => {
    const player = createPlayer();
    const weapon: Weapon = {
      id: 'test',
      name: 'Test',
      level: 1,
      cooldown: 1.0,
      currentCd: 0,
      damage: 10,
      behavior: {
        type: 'projectile',
        speed: 300,
        ttl: 2,
        count: 3,
        spread: Math.PI / 4,
        piercing: 1,
      },
    };
    player.weapons.push(weapon);

    const rng1 = mkRng(12345);
    const result1 = stepWeapons(0.016, rng1, player, []);

    player.weapons[0].currentCd = 0; // Reset cooldown

    const rng2 = mkRng(12345);
    const result2 = stepWeapons(0.016, rng2, player, []);

    expect(result1.projectiles[0].vx).toBe(result2.projectiles[0].vx);
    expect(result1.projectiles[0].vy).toBe(result2.projectiles[0].vy);
  });
});

describe('Projectiles', () => {
  it('should update projectile position', () => {
    const projectiles = [
      {
        id: 1,
        type: 'projectile' as const,
        x: 100,
        y: 100,
        vx: 100,
        vy: 0,
        hp: 1,
        maxHp: 1,
        radius: 8,
        damage: 10,
        ttl: 2,
        piercing: 1,
        hitIds: new Set<number>(),
        weaponId: 'test',
      },
    ];

    const updated = stepProjectiles(1.0, projectiles);

    expect(updated[0].x).toBe(200);
    expect(updated[0].y).toBe(100);
  });

  it('should remove expired projectiles', () => {
    const projectiles = [
      {
        id: 1,
        type: 'projectile' as const,
        x: 100,
        y: 100,
        vx: 100,
        vy: 0,
        hp: 1,
        maxHp: 1,
        radius: 8,
        damage: 10,
        ttl: 0.5,
        piercing: 1,
        hitIds: new Set<number>(),
        weaponId: 'test',
      },
    ];

    const updated = stepProjectiles(1.0, projectiles);

    expect(updated.length).toBe(0);
  });
});
