/**
 * Tests for draft/upgrade system
 */

import { describe, it, expect } from 'vitest';
import {
  createUpgradePool,
  rollDraft,
  createDraft,
  applyUpgrade,
  getTotalUpgradeValue,
  getUpgradeMultiplier,
} from '../src/systems/draft';
import { mkRng } from '../src/core/rng';
import { initWorld } from '../src/state/world';

describe('Draft System', () => {
  describe('createUpgradePool', () => {
    it('should create pool with multiple upgrades', () => {
      const pool = createUpgradePool();

      expect(pool.length).toBeGreaterThan(0);
      expect(pool[0]).toHaveProperty('id');
      expect(pool[0]).toHaveProperty('type');
      expect(pool[0]).toHaveProperty('rarity');
    });

    it('should have various rarities', () => {
      const pool = createUpgradePool();

      const rarities = pool.map((u) => u.rarity);
      expect(rarities).toContain('common');
      expect(rarities).toContain('rare');
    });
  });

  describe('rollDraft', () => {
    it('should be deterministic with same seed', () => {
      const pool = createUpgradePool();
      const rng1 = mkRng(12345);
      const rng2 = mkRng(12345);

      const [draft1] = rollDraft(rng1, pool, 3);
      const [draft2] = rollDraft(rng2, pool, 3);

      expect(draft1.map((u) => u.id)).toEqual(draft2.map((u) => u.id));
    });

    it('should return requested number of upgrades', () => {
      const pool = createUpgradePool();
      const rng = mkRng(42);

      const [draft] = rollDraft(rng, pool, 3);

      expect(draft.length).toBe(3);
    });

    it('should not return duplicates', () => {
      const pool = createUpgradePool();
      const rng = mkRng(42);

      const [draft] = rollDraft(rng, pool, 3);

      const ids = draft.map((u) => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should filter out maxed upgrades', () => {
      const pool = createUpgradePool();
      // Max out all upgrades
      pool.forEach((u) => {
        u.currentLevel = u.maxLevel;
      });

      const rng = mkRng(42);
      const [draft] = rollDraft(rng, pool, 3);

      expect(draft.length).toBe(0); // No available upgrades
    });
  });

  describe('createDraft', () => {
    it('should create draft choice with 3 upgrades', () => {
      const pool = createUpgradePool();
      const rng = mkRng(42);

      const [draft] = createDraft(rng, pool);

      expect(draft.upgrades.length).toBe(3);
      expect(draft).toHaveProperty('rerollsAvailable');
      expect(draft).toHaveProperty('banishesAvailable');
    });
  });

  describe('applyUpgrade', () => {
    it('should add upgrade to world upgrades list', () => {
      const world = initWorld(42);
      const upgrade = world.upgradePool[0];

      applyUpgrade(upgrade, world);

      expect(world.upgrades.length).toBe(1);
      expect(world.upgrades[0].id).toBe(upgrade.id);
      expect(world.upgrades[0].currentLevel).toBe(1);
    });

    it('should increment level for existing upgrade', () => {
      const world = initWorld(42);
      const upgrade = world.upgradePool[0];

      applyUpgrade(upgrade, world);
      applyUpgrade(upgrade, world);

      expect(world.upgrades.length).toBe(1); // Still one upgrade
      expect(world.upgrades[0].currentLevel).toBe(2); // Level increased
    });

    it('should update pool to reflect level', () => {
      const world = initWorld(42);
      const upgrade = world.upgradePool[0];
      const initialLevel = upgrade.currentLevel;

      applyUpgrade(upgrade, world);

      expect(world.upgradePool[0].currentLevel).toBe(initialLevel + 1);
    });

    it('should apply HP upgrade immediately', () => {
      const world = initWorld(42);
      const hpUpgrade = world.upgradePool.find((u) => u.type === 'player_hp');

      if (hpUpgrade) {
        const initialHp = world.player.hp;
        const initialMaxHp = world.player.maxHp;

        applyUpgrade(hpUpgrade, world);

        expect(world.player.maxHp).toBeGreaterThan(initialMaxHp);
        expect(world.player.hp).toBeGreaterThan(initialHp);
      }
    });
  });

  describe('getTotalUpgradeValue', () => {
    it('should sum upgrade values', () => {
      const upgrades = [
        {
          id: '1',
          type: 'weapon_damage' as const,
          name: 'Test',
          description: 'Test',
          rarity: 'common' as const,
          value: 0.2,
          maxLevel: 5,
          currentLevel: 1,
        },
        {
          id: '2',
          type: 'weapon_damage' as const,
          name: 'Test 2',
          description: 'Test 2',
          rarity: 'common' as const,
          value: 0.15,
          maxLevel: 5,
          currentLevel: 2,
        },
      ];

      const total = getTotalUpgradeValue(upgrades, 'weapon_damage');

      // 0.2 * 1 + 0.15 * 2 = 0.5
      expect(total).toBeCloseTo(0.5);
    });

    it('should return 0 for upgrades not present', () => {
      const upgrades: any[] = [];

      const total = getTotalUpgradeValue(upgrades, 'weapon_damage');

      expect(total).toBe(0);
    });
  });

  describe('getUpgradeMultiplier', () => {
    it('should return 1 + total percent', () => {
      const upgrades = [
        {
          id: '1',
          type: 'weapon_damage' as const,
          name: 'Test',
          description: 'Test',
          rarity: 'common' as const,
          value: 0.2,
          maxLevel: 5,
          currentLevel: 1,
        },
      ];

      const multiplier = getUpgradeMultiplier(upgrades, 'weapon_damage');

      expect(multiplier).toBeCloseTo(1.2); // 1 + 0.2
    });

    it('should return 1.0 with no upgrades', () => {
      const upgrades: any[] = [];

      const multiplier = getUpgradeMultiplier(upgrades, 'weapon_damage');

      expect(multiplier).toBe(1.0);
    });
  });
});
