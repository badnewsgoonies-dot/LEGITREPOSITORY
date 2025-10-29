/**
 * Tests for XP system
 */

import { describe, it, expect } from 'vitest';
import {
  calculateXPForLevel,
  spawnXPGem,
  spawnXPFromKills,
  magnetXPGems,
  collectXPGems,
  stepXP,
} from '../src/systems/xp';
import { initWorld } from '../src/state/world';

describe('XP System', () => {
  describe('calculateXPForLevel', () => {
    it('should return increasing XP requirements', () => {
      const level1 = calculateXPForLevel(1);
      const level2 = calculateXPForLevel(2);
      const level3 = calculateXPForLevel(3);

      expect(level2).toBeGreaterThan(level1);
      expect(level3).toBeGreaterThan(level2);
    });

    it('should use exponential curve', () => {
      const xp1 = calculateXPForLevel(1);
      const xp5 = calculateXPForLevel(5);
      const xp10 = calculateXPForLevel(10);

      // Exponential growth
      expect(xp10 - xp5).toBeGreaterThan(xp5 - xp1);
    });
  });

  describe('spawnXPGem', () => {
    it('should create gem at position', () => {
      const gem = spawnXPGem({ x: 100, y: 200 }, 5, 80);

      expect(gem.pos.x).toBe(100);
      expect(gem.pos.y).toBe(200);
      expect(gem.value).toBe(5);
      expect(gem.magnetRange).toBe(80);
    });

    it('should have unique IDs', () => {
      const gem1 = spawnXPGem({ x: 0, y: 0 }, 5, 80);
      const gem2 = spawnXPGem({ x: 0, y: 0 }, 5, 80);

      expect(gem1.id).not.toBe(gem2.id);
    });
  });

  describe('spawnXPFromKills', () => {
    it('should spawn gems for killed enemies', () => {
      const world = initWorld(42);
      const kills = [
        { pos: { x: 100, y: 100 }, isElite: false },
        { pos: { x: 200, y: 200 }, isElite: false },
      ];

      spawnXPFromKills(world, kills);

      expect(world.xpGems.length).toBe(2);
    });

    it('should spawn higher value gems for elites', () => {
      const world = initWorld(42);
      const kills = [
        { pos: { x: 100, y: 100 }, isElite: false },
        { pos: { x: 200, y: 200 }, isElite: true },
      ];

      spawnXPFromKills(world, kills);

      const normalGem = world.xpGems[0];
      const eliteGem = world.xpGems[1];

      expect(eliteGem.value).toBeGreaterThan(normalGem.value);
    });
  });

  describe('magnetXPGems', () => {
    it('should pull gems toward player within range', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };

      const gem = spawnXPGem({ x: 450, y: 300 }, 5, 100);
      world.xpGems.push(gem);

      const initialX = gem.pos.x;

      magnetXPGems(world, world.dt);

      expect(gem.pos.x).toBeLessThan(initialX); // Moved toward player
    });

    it('should not pull gems outside magnet range', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };

      const gem = spawnXPGem({ x: 600, y: 300 }, 5, 50); // Far away, small range
      world.xpGems.push(gem);

      const initialX = gem.pos.x;

      magnetXPGems(world, world.dt);

      expect(gem.pos.x).toBe(initialX); // Should not move
    });
  });

  describe('collectXPGems', () => {
    it('should collect gems on contact', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };
      world.player.xp = 0;

      const gem = spawnXPGem({ x: 400, y: 300 }, 5, 80); // Same position
      world.xpGems.push(gem);

      collectXPGems(world);

      expect(world.xpGems.length).toBe(0); // Gem collected
      expect(world.player.xp).toBe(5); // XP added
    });

    it('should trigger level-up when XP threshold reached', () => {
      const world = initWorld(42);
      world.player.xp = 0;
      world.player.level = 1;
      world.player.xpToNext = 10;

      const gem = spawnXPGem(world.player.pos, 15, 80); // More than needed
      world.xpGems.push(gem);

      const leveledUp = collectXPGems(world);

      expect(leveledUp).toBe(true);
      expect(world.player.level).toBe(2);
      expect(world.player.xp).toBe(5); // Overflow
    });

    it('should not level up if below threshold', () => {
      const world = initWorld(42);
      world.player.xp = 0;
      world.player.level = 1;
      world.player.xpToNext = 10;

      const gem = spawnXPGem(world.player.pos, 5, 80); // Less than needed
      world.xpGems.push(gem);

      const leveledUp = collectXPGems(world);

      expect(leveledUp).toBe(false);
      expect(world.player.level).toBe(1);
      expect(world.player.xp).toBe(5);
    });
  });

  describe('stepXP', () => {
    it('should integrate magnet and collection', () => {
      const world = initWorld(42);
      world.player.pos = { x: 400, y: 300 };
      world.player.xp = 0;

      // Add gem near player
      const gem = spawnXPGem({ x: 420, y: 300 }, 5, 100);
      world.xpGems.push(gem);

      // Run multiple frames to let magnet pull it in
      for (let i = 0; i < 10; i++) {
        stepXP(world);
      }

      // Gem should eventually be collected
      expect(world.xpGems.length).toBe(0);
      expect(world.player.xp).toBe(5);
    });
  });
});
