/**
 * XP System - handles XP gem spawning, magnet pull, and collection
 *
 * Features:
 * - Spawn XP gems at enemy death positions
 * - Proximity magnet (gems move toward player within range)
 * - Collection on contact
 * - Level-up triggers
 */

import type { WorldState, XPGem, Vec2 } from '../types';

import { playSound } from '../core/audio';
import { spawnParticleBurst } from '../systems/particles';


// Constants
const BASE_XP_VALUE = 5;
const GEM_RADIUS = 4;
const BASE_MAGNET_RANGE = 80;
const MAGNET_SPEED = 200; // pixels per second

let gemIdCounter = 0;

/**
 * Calculate XP required for next level (exponential curve)
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(10 + level * 5 + level * level * 2);
}

/**
 * Spawn an XP gem at a position
 */
export function spawnXPGem(
  pos: Vec2,
  baseValue: number,
  magnetRange: number
): XPGem {
  return {
    id: `xp_${gemIdCounter++}`,
    pos: { ...pos },
    value: baseValue,
    radius: GEM_RADIUS,
    magnetRange,
  };
}

/**
 * Spawn XP gems for killed enemies
 */
export function spawnXPFromKills(
  world: WorldState,
  killedEnemies: Array<{ pos: Vec2; isElite: boolean }>
): void {
  // Calculate magnet range: base * character magnet stat + upgrade bonus
  const upgradeBonus = world.upgrades.find((u) => u.type === 'xp_magnet')?.value ?? 0;
  const magnetRange = BASE_MAGNET_RANGE * world.player.magnet + upgradeBonus;

  for (const enemy of killedEnemies) {
    const value = enemy.isElite ? BASE_XP_VALUE * 3 : BASE_XP_VALUE;
    const gem = spawnXPGem(enemy.pos, value, magnetRange);
    world.xpGems.push(gem);
  }
}

/**
 * Apply magnet force to XP gems near player
 */
export function magnetXPGems(world: WorldState, dt: number): void {
  const playerPos = world.player.pos;

  for (const gem of world.xpGems) {
    const dx = playerPos.x - gem.pos.x;
    const dy = playerPos.y - gem.pos.y;
    const distSq = dx * dx + dy * dy;
    const rangeSq = gem.magnetRange * gem.magnetRange;

    if (distSq < rangeSq && distSq > 0.1) {
      // Apply magnet force
      const dist = Math.sqrt(distSq);
      const speed = MAGNET_SPEED * dt;
      const moveAmount = Math.min(speed, dist);

      gem.pos.x += (dx / dist) * moveAmount;
      gem.pos.y += (dy / dist) * moveAmount;
    }
  }
}

/**
 * Check for XP gem collection and apply XP
 */
export function collectXPGems(world: WorldState): boolean {
  const playerPos = world.player.pos;
  const playerRadius = world.player.radius;
  let leveledUp = false;

  // Check collisions with player
  for (let i = world.xpGems.length - 1; i >= 0; i--) {
    const gem = world.xpGems[i];
    const dx = playerPos.x - gem.pos.x;
    const dy = playerPos.y - gem.pos.y;
    const distSq = dx * dx + dy * dy;
    const radiusSumSq = (playerRadius + gem.radius) * (playerRadius + gem.radius);

    if (distSq < radiusSumSq) {

      // Spawn pickup particles
      spawnParticleBurst(world.particlesPool, 'pickup', gem.pos, 6);

      // Collect gem (apply growth multiplier from character)
      const xpGained = Math.floor(gem.value * world.player.growth);
      world.player.xp += xpGained;
      world.stats.xpCollected += xpGained;
      world.xpGems.splice(i, 1);


      // Play pickup sound
      playSound('pickup', 0.4);


      // Check for level up
      while (world.player.xp >= world.player.xpToNext) {
        world.player.xp -= world.player.xpToNext;
        world.player.level++;
        world.player.xpToNext = calculateXPForLevel(world.player.level);
        leveledUp = true;


        // Spawn levelup particles
        spawnParticleBurst(world.particlesPool, 'levelup', world.player.pos, 20);

        // Play levelup sound
        playSound('levelup', 0.7);

      }
    }
  }

  return leveledUp;
}

/**
 * Main XP system step
 *
 * @returns true if player leveled up
 */
export function stepXP(world: WorldState): boolean {
  // Apply magnet pull
  magnetXPGems(world, world.dt);

  // Collect gems and check for level-up
  const leveledUp = collectXPGems(world);

  return leveledUp;
}
