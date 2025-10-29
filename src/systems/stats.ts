/**
 * S7: Stats & Scaling
 * Apply stat growth per minute and per upgrade
 */

import type { Enemy, PlayerStats } from '../types/game';
import { ENEMY_DEFS } from './spawn';

/**
 * Scale enemy stats based on game time (minute)
 */
export function scaleEnemyStats(enemyType: string, minute: number): {
  hp: number;
  damage: number;
} {
  const def = ENEMY_DEFS[enemyType];
  if (!def) {
    return { hp: 10, damage: 5 };
  }

  // HP scales 10% per minute
  const hpScale = 1 + minute * 0.1;

  // Damage scales 8% per minute
  const damageScale = 1 + minute * 0.08;

  return {
    hp: def.hp * hpScale,
    damage: def.damage * damageScale,
  };
}

/**
 * Scale player stats (base stats from upgrades)
 * Returns effective stats after all modifiers
 */
export function scalePlayerStats(base: PlayerStats): PlayerStats {
  // Stats are already scaled by upgrades
  // This function can add time-based scaling if needed
  return { ...base };
}

/**
 * Calculate damage reduction from armor
 * Formula: reduction = armor / (armor + 2)
 * 0 armor = 0%, 2 armor = 50%, 4 armor = 67%, etc.
 */
export function damageReduction(armor: number): number {
  return armor / (armor + 2);
}

/**
 * Calculate effective cooldown with haste
 * cooldown stat is reduction: 0 = base, 0.1 = 10% faster
 */
export function effectiveCooldown(baseCd: number, cdReduction: number): number {
  return baseCd / (1 + cdReduction);
}

/**
 * Apply knockback to enemy (respects knockback resist)
 */
export function applyKnockback(
  enemy: Enemy,
  kbx: number,
  kby: number
): void {
  const resist = enemy.knockbackResist;
  enemy.vx += kbx * (1 - resist);
  enemy.vy += kby * (1 - resist);
}
