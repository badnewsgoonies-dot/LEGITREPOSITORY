/**
 * S6: XP Gems, Level-Up Draft & Pickups
 * Enemies drop XP; proximity magnet; level-up triggers draft
 */

import type { RNG } from '../core/rng';
import { nextFloat } from '../core/rng';
import type { Enemy, Pickup, Player } from '../types/game';

let nextPickupId = 50000;

export const MAGNET_SPEED = 300; // pixels per second
export const MAGNET_RANGE = 80; // base pickup range from player stats

/**
 * XP curve - XP needed for each level
 */
export function xpForLevel(level: number): number {
  return Math.floor(5 * Math.pow(level, 1.5));
}

/**
 * Create XP pickup at enemy position
 */
export function createXPPickup(enemy: Enemy, rng: RNG): readonly [Pickup, RNG] {
  // Slight randomization for visual spread
  const [offsetX, r1] = nextFloat(rng);
  const [offsetY, r2] = nextFloat(r1);

  const pickup: Pickup = {
    id: nextPickupId++,
    type: 'pickup',
    pickupType: 'xp',
    x: enemy.x + (offsetX - 0.5) * 40,
    y: enemy.y + (offsetY - 0.5) * 40,
    vx: 0,
    vy: 0,
    hp: 1,
    maxHp: 1,
    radius: 8,
    value: enemy.xpValue,
    magnetSpeed: 0,
  };

  return [pickup, r2] as const;
}

/**
 * Step pickups - apply magnet pull toward player
 */
export function stepPickups(
  dt: number,
  pickups: Pickup[],
  player: Player
): void {
  const magnetRange = player.stats.pickup;

  for (const pickup of pickups) {
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Within magnet range?
    if (dist <= magnetRange && dist > 0) {
      // Accelerate toward player
      const speed = MAGNET_SPEED;
      pickup.vx = (dx / dist) * speed;
      pickup.vy = (dy / dist) * speed;

      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
    }
  }
}

/**
 * Collect XP pickup and check for level up
 */
export function collectXP(
  player: Player,
  pickup: Pickup
): { player: Player; leveledUp: boolean } {
  if (pickup.pickupType !== 'xp') {
    return { player, leveledUp: false };
  }

  const newXP = player.xp + pickup.value;
  let level = player.level;
  let xpToNext = player.xpToNext;
  let leveledUp = false;

  // Check for level up
  if (newXP >= xpToNext) {
    level += 1;
    xpToNext = xpForLevel(level);
    leveledUp = true;
  }

  return {
    player: {
      ...player,
      xp: newXP,
      level,
      xpToNext,
    },
    leveledUp,
  };
}
