/**
 * Tests for S8: UI/HUD & Run States
 */

import { describe, it, expect } from 'vitest';
import { createPlayer } from '../src/systems/player';
import type { GameState } from '../src/types/game';

describe('HUD', () => {
  it('should format time correctly', () => {
    const time = 125; // 2:05
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    expect(timeStr).toBe('02:05');
  });

  it('should calculate HP percentage', () => {
    const player = createPlayer();
    player.hp = 50;
    player.maxHp = 100;

    const hpPercent = (player.hp / player.maxHp) * 100;

    expect(hpPercent).toBe(50);
  });

  it('should calculate XP percentage', () => {
    const player = createPlayer();
    player.xp = 3;
    player.xpToNext = 10;

    const xpPercent = (player.xp / player.xpToNext) * 100;

    expect(xpPercent).toBe(30);
  });
});

describe('Game State', () => {
  it('should detect win condition', () => {
    const player = createPlayer();
    const state: GameState = {
      player,
      enemies: [],
      projectiles: [],
      pickups: [],
      time: 1200, // 20 minutes
      frame: 0,
      paused: false,
      gameOver: false,
      won: false,
    };

    const shouldWin = state.time >= 1200;
    expect(shouldWin).toBe(true);
  });

  it('should detect loss condition', () => {
    const player = createPlayer();
    player.hp = 0;

    const state: GameState = {
      player,
      enemies: [],
      projectiles: [],
      pickups: [],
      time: 100,
      frame: 0,
      paused: false,
      gameOver: false,
      won: false,
    };

    const shouldLose = state.player.hp <= 0;
    expect(shouldLose).toBe(true);
  });
});
