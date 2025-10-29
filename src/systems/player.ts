/**
 * S2: Player Controller & Movement
 * WASD/analog movement with diagonal normalization
 * I-frames on hit, arena clamping
 */

import type { Player, InputState } from '../types/game';

export const ARENA_WIDTH = 1920;
export const ARENA_HEIGHT = 1080;
export const PLAYER_BASE_SPEED = 180; // pixels per second
export const IFRAME_DURATION = 1.0; // seconds

/**
 * Create initial player state
 */
export function createPlayer(): Player {
  return {
    id: 0,
    type: 'player',
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    radius: 16,
    speed: PLAYER_BASE_SPEED,
    iframes: 0,
    level: 1,
    xp: 0,
    xpToNext: 5,
    facing: { x: 1, y: 0 },
    weapons: [],
    stats: {
      maxHp: 100,
      speed: PLAYER_BASE_SPEED,
      pickup: 64,
      might: 1.0,
      area: 1.0,
      cooldown: 0,
      duration: 1.0,
      armor: 0,
      recovery: 0,
    },
  };
}

/**
 * Update player position and state
 * Returns updated player
 */
export function stepPlayer(
  input: InputState,
  dt: number,
  player: Player
): Player {
  // Update i-frames
  const iframes = Math.max(0, player.iframes - dt);

  // Calculate movement vector
  let vx = 0;
  let vy = 0;

  if (input.up) vy -= 1;
  if (input.down) vy += 1;
  if (input.left) vx -= 1;
  if (input.right) vx += 1;

  // Normalize diagonal movement (prevent √2 speed boost)
  const magnitude = Math.sqrt(vx * vx + vy * vy);
  if (magnitude > 0) {
    vx /= magnitude;
    vy /= magnitude;
  }

  // Apply speed
  const speed = player.stats.speed;
  vx *= speed;
  vy *= speed;

  // Update position
  let x = player.x + vx * dt;
  let y = player.y + vy * dt;

  // Clamp to arena (with radius buffer)
  x = Math.max(player.radius, Math.min(ARENA_WIDTH - player.radius, x));
  y = Math.max(player.radius, Math.min(ARENA_HEIGHT - player.radius, y));

  // Update facing direction (only if moving)
  let facing = player.facing;
  if (magnitude > 0) {
    facing = { x: vx / speed, y: vy / speed };
  }

  // Apply recovery (HP regen)
  const hp = Math.min(player.maxHp, player.hp + player.stats.recovery * dt);

  return {
    ...player,
    x,
    y,
    vx,
    vy,
    facing,
    iframes,
    hp,
  };
}

/**
 * Apply damage to player (respects i-frames)
 * Returns [updatedPlayer, damageDealt]
 */
export function damagePlayer(
  player: Player,
  rawDamage: number
): readonly [Player, number] {
  // No damage during i-frames
  if (player.iframes > 0) {
    return [player, 0] as const;
  }

  // Apply armor (0 = no reduction, 1 = 50% reduction, 2 = 67% reduction, etc.)
  const reduction = player.stats.armor / (player.stats.armor + 2);
  const damage = Math.max(1, rawDamage * (1 - reduction));

  const hp = Math.max(0, player.hp - damage);
  const iframes = IFRAME_DURATION;

  return [
    {
      ...player,
      hp,
      iframes,
    },
    damage,
  ] as const;
}

/**
 * Heal player (cannot exceed max HP)
 */
export function healPlayer(player: Player, amount: number): Player {
  return {
    ...player,
    hp: Math.min(player.maxHp, player.hp + amount),
  };
}
