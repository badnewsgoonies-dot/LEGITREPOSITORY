/**
 * Tests for S2: Player Controller & Movement
 */

import { describe, it, expect } from 'vitest';
import { createPlayer, stepPlayer, damagePlayer, healPlayer, ARENA_WIDTH, ARENA_HEIGHT } from '../src/systems/player';
import type { InputState } from '../src/types/game';

describe('Player', () => {
  it('should create player with initial state', () => {
    const player = createPlayer();

    expect(player.x).toBe(ARENA_WIDTH / 2);
    expect(player.y).toBe(ARENA_HEIGHT / 2);
    expect(player.hp).toBe(100);
    expect(player.level).toBe(1);
  });

  it('should move player with WASD input', () => {
    const player = createPlayer();
    const input: InputState = {
      up: false,
      down: false,
      left: false,
      right: true,
      pause: false,
    };

    const updated = stepPlayer(input, 1.0, player);

    expect(updated.x).toBeGreaterThan(player.x);
  });

  it('should normalize diagonal movement', () => {
    const player = createPlayer();
    const input: InputState = {
      up: true,
      down: false,
      left: false,
      right: true,
      pause: false,
    };

    const updated = stepPlayer(input, 1.0, player);

    // Diagonal speed should equal horizontal/vertical speed
    const dist = Math.sqrt(
      Math.pow(updated.x - player.x, 2) + Math.pow(updated.y - player.y, 2)
    );
    expect(dist).toBeCloseTo(player.stats.speed * 1.0, 0);
  });

  it('should clamp player to arena bounds', () => {
    let player = createPlayer();
    player.x = ARENA_WIDTH - 10;

    const input: InputState = {
      up: false,
      down: false,
      left: false,
      right: true,
      pause: false,
    };

    player = stepPlayer(input, 10.0, player);

    expect(player.x).toBeLessThanOrEqual(ARENA_WIDTH - player.radius);
  });

  it('should apply damage and trigger i-frames', () => {
    const player = createPlayer();
    const [damaged, dealt] = damagePlayer(player, 20);

    expect(damaged.hp).toBe(80);
    expect(dealt).toBe(20);
    expect(damaged.iframes).toBeGreaterThan(0);
  });

  it('should block damage during i-frames', () => {
    let player = createPlayer();
    const [damaged] = damagePlayer(player, 20);

    const [damaged2, dealt2] = damagePlayer(damaged, 20);

    expect(damaged2.hp).toBe(damaged.hp);
    expect(dealt2).toBe(0);
  });

  it('should heal player up to max HP', () => {
    let player = createPlayer();
    player.hp = 50;

    player = healPlayer(player, 100);

    expect(player.hp).toBe(player.maxHp);
  });
});
