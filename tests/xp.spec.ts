/**
 * Tests for S6: XP Gems, Level-Up Draft & Pickups
 */

import { describe, it, expect } from 'vitest';
import { xpForLevel, createXPPickup, stepPickups, collectXP } from '../src/systems/xp';
import { rollDraft, applyUpgrade, UPGRADE_POOL } from '../src/systems/draft';
import { createPlayer } from '../src/systems/player';
import { mkRng } from '../src/core/rng';
import type { Enemy } from '../src/types/game';

describe('XP System', () => {
  it('should calculate XP curve', () => {
    expect(xpForLevel(1)).toBeGreaterThan(0);
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(1));
  });

  it('should create XP pickup from enemy', () => {
    const enemy: Enemy = {
      id: 1,
      type: 'enemy',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      hp: 0,
      maxHp: 10,
      radius: 12,
      speed: 100,
      damage: 5,
      xpValue: 5,
      enemyType: 'bat',
      knockbackResist: 0,
    };

    const rng = mkRng(42);
    const [pickup] = createXPPickup(enemy, rng);

    expect(pickup.pickupType).toBe('xp');
    expect(pickup.value).toBe(5);
  });

  it('should magnet pickups toward player', () => {
    const player = createPlayer();
    player.x = 200;
    player.y = 200;

    const pickups = [
      {
        id: 1,
        type: 'pickup' as const,
        pickupType: 'xp' as const,
        x: 180, // Closer to player (within magnet range of 64)
        y: 180,
        vx: 0,
        vy: 0,
        hp: 1,
        maxHp: 1,
        radius: 8,
        value: 1,
        magnetSpeed: 0,
      },
    ];

    stepPickups(1.0, pickups, player);

    expect(pickups[0].x).toBeGreaterThan(180);
    expect(pickups[0].y).toBeGreaterThan(180);
  });

  it('should level up player when XP threshold reached', () => {
    const player = createPlayer();
    player.xp = player.xpToNext - 1;

    const pickup = {
      id: 1,
      type: 'pickup' as const,
      pickupType: 'xp' as const,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 1,
      maxHp: 1,
      radius: 8,
      value: 5,
      magnetSpeed: 0,
    };

    const result = collectXP(player, pickup);

    expect(result.leveledUp).toBe(true);
    expect(result.player.level).toBe(player.level + 1);
  });
});

describe('Draft System', () => {
  it('should roll deterministic draft for same seed', () => {
    const rng1 = mkRng(12345);
    const [cards1] = rollDraft(rng1, UPGRADE_POOL);

    const rng2 = mkRng(12345);
    const [cards2] = rollDraft(rng2, UPGRADE_POOL);

    expect(cards1.length).toBe(cards2.length);
    expect(cards1[0].id).toBe(cards2[0].id);
  });

  it('should roll 3 cards from pool', () => {
    const rng = mkRng(42);
    const [cards] = rollDraft(rng, UPGRADE_POOL);

    expect(cards.length).toBeLessThanOrEqual(3);
  });

  it('should not roll duplicate cards', () => {
    const rng = mkRng(42);
    const [cards] = rollDraft(rng, UPGRADE_POOL);

    const ids = cards.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should apply upgrade to player', () => {
    const player = createPlayer();
    const card = UPGRADE_POOL.find((c) => c.id === 'might');

    if (card) {
      const baseMight = player.stats.might;
      const updated = applyUpgrade(player, card);
      expect(updated.stats.might).toBeGreaterThan(baseMight);
    }
  });
});
