/**
 * Tests for stats & scaling system
 */

import { describe, it, expect } from 'vitest';
import {
  getScaledWeaponDamage,
  getScaledWeaponCooldown,
  getScaledProjectileCount,
  getScaledPlayerSpeed,
  applyPlayerRegen,
  getEnemyStatMultiplier,
  updateWeaponStats,
} from '../src/systems/stats';
import { initWorld } from '../src/state/world';
import type { Upgrade } from '../src/types';

describe('Stats System', () => {
  describe('getScaledWeaponDamage', () => {
    it('should return base damage with no upgrades', () => {
      const scaled = getScaledWeaponDamage(10, []);

      expect(scaled).toBe(10);
    });

    it('should apply damage multiplier', () => {
      const upgrades: Upgrade[] = [
        {
          id: 'dmg1',
          type: 'weapon_damage',
          name: 'Power',
          description: '+20% damage',
          rarity: 'common',
          value: 0.2,
          maxLevel: 5,
          currentLevel: 1,
        },
      ];

      const scaled = getScaledWeaponDamage(10, upgrades);

      expect(scaled).toBe(12); // 10 * 1.2
    });

    it('should stack multiple upgrades', () => {
      const upgrades: Upgrade[] = [
        {
          id: 'dmg1',
          type: 'weapon_damage',
          name: 'Power',
          description: '+20% damage',
          rarity: 'common',
          value: 0.2,
          maxLevel: 5,
          currentLevel: 2, // Level 2
        },
      ];

      const scaled = getScaledWeaponDamage(10, upgrades);

      expect(scaled).toBe(14); // 10 * (1 + 0.2 * 2)
    });
  });

  describe('getScaledWeaponCooldown', () => {
    it('should return base cooldown with no upgrades', () => {
      const scaled = getScaledWeaponCooldown(1.0, []);

      expect(scaled).toBe(1.0);
    });

    it('should reduce cooldown', () => {
      const upgrades: Upgrade[] = [
        {
          id: 'cd1',
          type: 'weapon_cooldown',
          name: 'Rapid',
          description: '-10% cooldown',
          rarity: 'common',
          value: 0.1,
          maxLevel: 5,
          currentLevel: 1,
        },
      ];

      const scaled = getScaledWeaponCooldown(1.0, upgrades);

      expect(scaled).toBeCloseTo(0.909, 2); // 1.0 / 1.1
    });
  });

  describe('getScaledProjectileCount', () => {
    it('should return base count with no upgrades', () => {
      const scaled = getScaledProjectileCount(1, []);

      expect(scaled).toBe(1);
    });

    it('should add bonus projectiles', () => {
      const upgrades: Upgrade[] = [
        {
          id: 'count1',
          type: 'weapon_count',
          name: 'Multi',
          description: '+1 projectile',
          rarity: 'rare',
          value: 1,
          maxLevel: 3,
          currentLevel: 2,
        },
      ];

      const scaled = getScaledProjectileCount(1, upgrades);

      expect(scaled).toBe(3); // 1 + (1 * 2)
    });
  });

  describe('getScaledPlayerSpeed', () => {
    it('should return base speed with no upgrades', () => {
      const scaled = getScaledPlayerSpeed(100, []);

      expect(scaled).toBe(100);
    });

    it('should apply speed multiplier', () => {
      const upgrades: Upgrade[] = [
        {
          id: 'speed1',
          type: 'player_speed',
          name: 'Swift',
          description: '+15% speed',
          rarity: 'common',
          value: 0.15,
          maxLevel: 5,
          currentLevel: 1,
        },
      ];

      const scaled = getScaledPlayerSpeed(100, upgrades);

      expect(scaled).toBeCloseTo(115, 5); // 100 * 1.15
    });
  });

  describe('applyPlayerRegen', () => {
    it('should not heal if no regen upgrade', () => {
      const world = initWorld(42);
      world.player.hp = 50;
      world.player.maxHp = 100;

      applyPlayerRegen(world);

      expect(world.player.hp).toBe(50); // No change
    });

    it('should heal over time with regen', () => {
      const world = initWorld(42);
      world.player.hp = 50;
      world.player.maxHp = 100;

      // Add regen upgrade
      world.upgrades.push({
        id: 'regen1',
        type: 'player_regen',
        name: 'Regen',
        description: '+1 HP/s',
        rarity: 'rare',
        value: 1,
        maxLevel: 3,
        currentLevel: 1,
      });

      // Simulate 1 second (dt is typically 0.016s per frame)
      for (let i = 0; i < 60; i++) {
        applyPlayerRegen(world);
      }

      expect(world.player.hp).toBeGreaterThan(50);
      expect(world.player.hp).toBeLessThanOrEqual(51); // ~1 HP gained
    });

    it('should not heal above max HP', () => {
      const world = initWorld(42);
      world.player.hp = 99;
      world.player.maxHp = 100;

      world.upgrades.push({
        id: 'regen1',
        type: 'player_regen',
        name: 'Regen',
        description: '+1 HP/s',
        rarity: 'rare',
        value: 100, // High regen
        maxLevel: 3,
        currentLevel: 1,
      });

      applyPlayerRegen(world);

      expect(world.player.hp).toBe(100); // Capped at max
    });
  });

  describe('getEnemyStatMultiplier', () => {
    it('should return 1.0 multipliers at minute 0', () => {
      const mult = getEnemyStatMultiplier(0);

      expect(mult.hp).toBeCloseTo(1.0);
      expect(mult.damage).toBeCloseTo(1.0);
      expect(mult.speed).toBeCloseTo(1.0);
    });

    it('should scale up over time', () => {
      const mult0 = getEnemyStatMultiplier(0);
      const mult5 = getEnemyStatMultiplier(5);
      const mult10 = getEnemyStatMultiplier(10);

      expect(mult5.hp).toBeGreaterThan(mult0.hp);
      expect(mult10.hp).toBeGreaterThan(mult5.hp);
    });

    it('should scale HP faster than damage', () => {
      const mult = getEnemyStatMultiplier(10);

      expect(mult.hp).toBeGreaterThan(mult.damage);
    });
  });

  describe('updateWeaponStats', () => {
    it('should preserve base values', () => {
      const world = initWorld(42, true);
      const initialDamage = world.weapons[0].damage;

      updateWeaponStats(world);

      // Should store base value
      expect((world.weapons[0] as any).baseDamage).toBe(initialDamage);
    });

    it('should apply upgrades to weapon stats', () => {
      const world = initWorld(42, true);
      const initialDamage = world.weapons[0].damage;

      // Add damage upgrade
      world.upgrades.push({
        id: 'dmg1',
        type: 'weapon_damage',
        name: 'Power',
        description: '+20% damage',
        rarity: 'common',
        value: 0.2,
        maxLevel: 5,
        currentLevel: 1,
      });

      updateWeaponStats(world);

      expect(world.weapons[0].damage).toBeGreaterThan(initialDamage);
    });
  });
});
