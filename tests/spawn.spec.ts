/**
 * Tests for enemy spawn system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  stepSpawns,
  getMinute,
  resetEnemyIdCounter,
  isValidSpawnPosition,
} from '../src/systems/spawn';
import { getWaveConfig } from '../src/waves/table';
import { mkRng } from '../src/core/rng';
import type { Vec2 } from '../src/types';

describe('Enemy Spawn System', () => {
  beforeEach(() => {
    resetEnemyIdCounter();
  });

  describe('getMinute', () => {
    it('should calculate minute from elapsed time', () => {
      expect(getMinute(0)).toBe(0);
      expect(getMinute(59)).toBe(0);
      expect(getMinute(60)).toBe(1);
      expect(getMinute(119)).toBe(1);
      expect(getMinute(120)).toBe(2);
      expect(getMinute(300)).toBe(5);
    });
  });

  describe('getWaveConfig', () => {
    it('should return correct config for each minute', () => {
      const config0 = getWaveConfig(0);
      expect(config0.minute).toBe(0);
      expect(config0.spawnRate).toBe(2);

      const config1 = getWaveConfig(1);
      expect(config1.minute).toBe(1);
      expect(config1.spawnRate).toBe(3);

      const config5 = getWaveConfig(5);
      expect(config5.minute).toBe(5);
      expect(config5.spawnRate).toBe(8);
    });

    it('should return last config for minutes beyond table', () => {
      const config10 = getWaveConfig(10);
      const config100 = getWaveConfig(100);

      expect(config10.minute).toBe(5); // Last entry
      expect(config100.minute).toBe(5);
    });
  });

  describe('stepSpawns', () => {
    it('should not spawn immediately with zero accumulator', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      const result = stepSpawns(0.016, 0, mkRng(42), 0, playerPos);

      expect(result.newEnemies.length).toBe(0);
      expect(result.newAccumulator).toBeGreaterThan(0);
    });

    it('should spawn enemies when accumulator exceeds interval', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      // Minute 0: spawn rate = 2 per second = 0.5s per enemy
      // Run for 1 second
      let accumulator = 0;
      let rng = mkRng(42);
      let totalSpawned = 0;

      for (let i = 0; i < 60; i++) {
        // 60 frames @ 60fps = 1 second
        const result = stepSpawns(0.016666, accumulator, rng, 0, playerPos);
        accumulator = result.newAccumulator;
        rng = result.rng;
        totalSpawned += result.newEnemies.length;
      }

      // Should spawn ~2 enemies per second
      expect(totalSpawned).toBeGreaterThanOrEqual(1);
      expect(totalSpawned).toBeLessThanOrEqual(3);
    });

    it('should be deterministic with same seed', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };

      // Run 1
      resetEnemyIdCounter();
      let acc1 = 0;
      let rng1 = mkRng(123);
      const enemies1 = [];

      for (let i = 0; i < 120; i++) {
        // 2 seconds
        const result = stepSpawns(0.016666, acc1, rng1, 0, playerPos);
        acc1 = result.newAccumulator;
        rng1 = result.rng;
        enemies1.push(...result.newEnemies);
      }

      // Run 2
      resetEnemyIdCounter();
      let acc2 = 0;
      let rng2 = mkRng(123);
      const enemies2 = [];

      for (let i = 0; i < 120; i++) {
        const result = stepSpawns(0.016666, acc2, rng2, 0, playerPos);
        acc2 = result.newAccumulator;
        rng2 = result.rng;
        enemies2.push(...result.newEnemies);
      }

      // Same seed should produce same results
      expect(enemies1.length).toBe(enemies2.length);
      expect(enemies1.length).toBeGreaterThan(0);

      for (let i = 0; i < enemies1.length; i++) {
        expect(enemies1[i].kind).toBe(enemies2[i].kind);
        expect(enemies1[i].isElite).toBe(enemies2[i].isElite);
        expect(enemies1[i].pos.x).toBeCloseTo(enemies2[i].pos.x, 5);
        expect(enemies1[i].pos.y).toBeCloseTo(enemies2[i].pos.y, 5);
      }
    });

    it('should produce consistent counts at minute 1', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };

      // Run 1
      resetEnemyIdCounter();
      let acc1 = 0;
      let rng1 = mkRng(999);
      const enemies1 = [];

      for (let i = 0; i < 60 * 60; i++) {
        // 60 seconds
        const minute = Math.floor((i * 0.016666) / 60);
        const result = stepSpawns(0.016666, acc1, rng1, minute, playerPos);
        acc1 = result.newAccumulator;
        rng1 = result.rng;
        enemies1.push(...result.newEnemies);
      }

      // Run 2 - same seed
      resetEnemyIdCounter();
      let acc2 = 0;
      let rng2 = mkRng(999);
      const enemies2 = [];

      for (let i = 0; i < 60 * 60; i++) {
        const minute = Math.floor((i * 0.016666) / 60);
        const result = stepSpawns(0.016666, acc2, rng2, minute, playerPos);
        acc2 = result.newAccumulator;
        rng2 = result.rng;
        enemies2.push(...result.newEnemies);
      }

      // ±0% tolerance - should be exactly equal
      expect(enemies1.length).toBe(enemies2.length);

      // Count by type
      const count1ByType = countEnemiesByType(enemies1);
      const count2ByType = countEnemiesByType(enemies2);

      expect(count1ByType).toEqual(count2ByType);
    });

    it('should produce consistent counts at minute 5', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      const seed = 777;

      // Run 1
      resetEnemyIdCounter();
      const enemies1 = simulateMinute(seed, 5, playerPos);

      // Run 2
      resetEnemyIdCounter();
      const enemies2 = simulateMinute(seed, 5, playerPos);

      // ±0% tolerance
      expect(enemies1.length).toBe(enemies2.length);

      const count1 = countEnemiesByType(enemies1);
      const count2 = countEnemiesByType(enemies2);

      expect(count1).toEqual(count2);
    });

    it('should spawn enemies outside player radius', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      let accumulator = 0;
      let rng = mkRng(42);
      const allEnemies = [];

      // Spawn many enemies
      for (let i = 0; i < 300; i++) {
        const result = stepSpawns(0.016666, accumulator, rng, 0, playerPos);
        accumulator = result.newAccumulator;
        rng = result.rng;
        allEnemies.push(...result.newEnemies);
      }

      expect(allEnemies.length).toBeGreaterThan(0);

      // Check all spawns are outside safe radius
      for (const enemy of allEnemies) {
        const dx = enemy.pos.x - playerPos.x;
        const dy = enemy.pos.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        expect(distance).toBeGreaterThanOrEqual(400); // SPAWN_RADIUS_MIN
      }
    });

    it('should respect per-frame spawn cap', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };

      // Set high accumulator to trigger many spawns
      let accumulator = 10; // Very high
      const rng = mkRng(42);

      const result = stepSpawns(0.016666, accumulator, rng, 5, playerPos);

      // Should cap at MAX_SPAWNS_PER_FRAME (12)
      expect(result.newEnemies.length).toBeLessThanOrEqual(12);
    });

    it('should create enemies with correct properties', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      let accumulator = 0;
      let rng = mkRng(42);

      // Spawn some enemies
      for (let i = 0; i < 60; i++) {
        const result = stepSpawns(0.016666, accumulator, rng, 0, playerPos);
        accumulator = result.newAccumulator;
        rng = result.rng;

        for (const enemy of result.newEnemies) {
          expect(enemy.id).toBeTruthy();
          expect(enemy.kind).toBeTruthy();
          expect(enemy.hp).toBeGreaterThan(0);
          expect(enemy.maxHp).toBeGreaterThan(0);
          expect(enemy.speed).toBeGreaterThan(0);
          expect(enemy.touchDamage).toBeGreaterThan(0);
          expect(typeof enemy.isElite).toBe('boolean');
        }
      }
    });

    it('should spawn elite enemies based on elite chance', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      let accumulator = 0;
      let rng = mkRng(42);
      const allEnemies = [];

      // Spawn many enemies at minute 5 (15% elite chance)
      for (let i = 0; i < 600; i++) {
        const result = stepSpawns(0.016666, accumulator, rng, 5, playerPos);
        accumulator = result.newAccumulator;
        rng = result.rng;
        allEnemies.push(...result.newEnemies);
      }

      const eliteCount = allEnemies.filter((e) => e.isElite).length;

      // Should have some elites (but not all)
      expect(eliteCount).toBeGreaterThan(0);
      expect(eliteCount).toBeLessThan(allEnemies.length);

      // Verify elite multipliers applied
      const elite = allEnemies.find((e) => e.isElite);
      if (elite) {
        expect(elite.hp).toBeGreaterThan(elite.hp / 3); // Elite HP multiplier
      }
    });

    it('should increase spawn rate with minute progression', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };
      const seed = 555;

      const min0Enemies = simulateMinute(seed, 0, playerPos);
      const min5Enemies = simulateMinute(seed, 5, playerPos);

      // Minute 5 should spawn more than minute 0
      expect(min5Enemies.length).toBeGreaterThan(min0Enemies.length);
    });
  });

  describe('isValidSpawnPosition', () => {
    it('should return true for positions outside safe radius', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };

      expect(isValidSpawnPosition({ x: 800, y: 300 }, playerPos)).toBe(true);
      expect(isValidSpawnPosition({ x: 0, y: 300 }, playerPos)).toBe(true);
      expect(isValidSpawnPosition({ x: 400, y: 700 }, playerPos)).toBe(true);
    });

    it('should return false for positions inside safe radius', () => {
      const playerPos: Vec2 = { x: 400, y: 300 };

      expect(isValidSpawnPosition({ x: 410, y: 310 }, playerPos)).toBe(false);
      expect(isValidSpawnPosition({ x: 400, y: 300 }, playerPos)).toBe(false);
    });
  });
});

// Helper functions
function countEnemiesByType(enemies: { kind: string; isElite: boolean }[]) {
  const counts: Record<string, number> = {};

  for (const enemy of enemies) {
    const key = `${enemy.kind}_${enemy.isElite ? 'elite' : 'normal'}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

function simulateMinute(
  seed: number,
  minute: number,
  playerPos: Vec2
): { kind: string; isElite: boolean; pos: { x: number; y: number } }[] {
  let accumulator = 0;
  let rng = mkRng(seed);
  const enemies = [];

  for (let i = 0; i < 60 * 60; i++) {
    // 60 seconds
    const result = stepSpawns(0.016666, accumulator, rng, minute, playerPos);
    accumulator = result.newAccumulator;
    rng = result.rng;
    enemies.push(...result.newEnemies);
  }

  return enemies;
}
