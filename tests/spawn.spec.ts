/**
 * Tests for S4: Enemy Spawner & Waves
 */

import { describe, it, expect } from 'vitest';
import { stepSpawns, createSpawnState, stepEnemies, ENEMY_DEFS } from '../src/systems/spawn';
import { createPlayer } from '../src/systems/player';
import { mkRng } from '../src/core/rng';

describe('Spawner', () => {
  it('should spawn enemies based on time', () => {
    const player = createPlayer();
    const state = createSpawnState();
    const rng = mkRng(42);

    const result = stepSpawns(1.0, rng, 0, player, state);

    expect(result.enemies.length).toBeGreaterThan(0);
  });

  it('should produce deterministic spawns for same seed', () => {
    const player = createPlayer();
    const state1 = createSpawnState();
    const state2 = createSpawnState();

    const rng1 = mkRng(12345);
    const result1 = stepSpawns(1.0, rng1, 0, player, state1);

    const rng2 = mkRng(12345);
    const result2 = stepSpawns(1.0, rng2, 0, player, state2);

    expect(result1.enemies.length).toBe(result2.enemies.length);
    expect(result1.enemies[0].enemyType).toBe(result2.enemies[0].enemyType);
  });

  it('should increase spawn rate over time', () => {
    const player = createPlayer();
    const state1 = createSpawnState();
    const state2 = createSpawnState();

    const rng1 = mkRng(42);
    const result1 = stepSpawns(2.0, rng1, 0, player, state1);

    const rng2 = mkRng(42);
    const result2 = stepSpawns(2.0, rng2, 600, player, state2);

    expect(result2.enemies.length).toBeGreaterThan(result1.enemies.length);
  });

  it('should scale enemy stats by minute', () => {
    const player = createPlayer();
    const state = createSpawnState();
    const rng = mkRng(42);

    const result = stepSpawns(1.0, rng, 600, player, state); // 10 minutes

    if (result.enemies.length > 0) {
      const enemy = result.enemies[0];
      const baseDef = ENEMY_DEFS[enemy.enemyType];
      expect(enemy.hp).toBeGreaterThan(baseDef.hp);
    }
  });
});

describe('Enemy Movement', () => {
  it('should move enemies toward player', () => {
    const player = createPlayer();
    player.x = 500;
    player.y = 500;

    const enemies = [
      {
        id: 1,
        type: 'enemy' as const,
        x: 400,
        y: 400,
        vx: 0,
        vy: 0,
        hp: 10,
        maxHp: 10,
        radius: 12,
        speed: 100,
        damage: 5,
        xpValue: 1,
        enemyType: 'bat',
        knockbackResist: 0,
      },
    ];

    stepEnemies(1.0, enemies, player);

    expect(enemies[0].x).toBeGreaterThan(400);
    expect(enemies[0].y).toBeGreaterThan(400);
  });
});
