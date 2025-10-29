/**
 * Stats & Scaling System
 *
 * Applies upgrades and minute-based scaling to player and enemy stats
 */

import type { Upgrade, WorldState, Enemy } from '../types';
import { getUpgradeMultiplier, getTotalUpgradeValue } from './draft';

/**
 * Get scaled weapon damage based on upgrades
 */
export function getScaledWeaponDamage(
  baseDamage: number,
  upgrades: Upgrade[]
): number {
  const multiplier = getUpgradeMultiplier(upgrades, 'weapon_damage');
  return Math.floor(baseDamage * multiplier);
}

/**
 * Get scaled weapon cooldown based on upgrades
 */
export function getScaledWeaponCooldown(
  baseCooldown: number,
  upgrades: Upgrade[]
): number {
  const reduction = getUpgradeMultiplier(upgrades, 'weapon_cooldown');
  return baseCooldown / reduction;
}

/**
 * Get scaled projectile count based on upgrades
 */
export function getScaledProjectileCount(
  baseCount: number,
  upgrades: Upgrade[]
): number {
  const bonus = getTotalUpgradeValue(upgrades, 'weapon_count');
  return baseCount + bonus;
}

/**
 * Get scaled player speed based on upgrades
 */
export function getScaledPlayerSpeed(
  baseSpeed: number,
  upgrades: Upgrade[]
): number {
  const multiplier = getUpgradeMultiplier(upgrades, 'player_speed');
  return baseSpeed * multiplier;
}

/**
 * Apply player regeneration (HP per second)
 */
export function applyPlayerRegen(world: WorldState): void {
  const regenRate = getTotalUpgradeValue(world.upgrades, 'player_regen');

  if (regenRate > 0 && world.player.hp < world.player.maxHp) {
    world.player.hp = Math.min(
      world.player.maxHp,
      world.player.hp + regenRate * world.dt
    );
  }
}

/**
 * Get enemy stat scaling based on minute (difficulty curve)
 */
export function getEnemyStatMultiplier(minute: number): {
  hp: number;
  damage: number;
  speed: number;
} {
  // Exponential scaling curve
  const factor = 1 + minute * 0.1;

  return {
    hp: Math.pow(factor, 1.2), // HP scales faster
    damage: Math.pow(factor, 0.8), // Damage scales slower
    speed: Math.pow(factor, 0.5), // Speed scales slowest
  };
}

/**
 * Apply scaling to enemy stats based on minute
 */
export function scaleEnemyStats(enemy: Enemy, minute: number): void {
  const multipliers = getEnemyStatMultiplier(minute);

  enemy.hp = Math.floor(enemy.hp * multipliers.hp);
  enemy.maxHp = Math.floor(enemy.maxHp * multipliers.hp);
  enemy.touchDamage = Math.floor(enemy.touchDamage * multipliers.damage);
  enemy.speed = enemy.speed * multipliers.speed;
}

/**
 * Update all weapon stats based on current upgrades
 */
export function updateWeaponStats(world: WorldState): void {
  for (const weapon of world.weapons) {
    // Store original values if not already stored
    if (!(weapon as any).baseDamage) {
      (weapon as any).baseDamage = weapon.damage;
    }
    if (!(weapon as any).baseCooldown) {
      (weapon as any).baseCooldown = weapon.cooldown;
    }
    if (!(weapon as any).baseProjectileCount) {
      (weapon as any).baseProjectileCount = weapon.projectileCount;
    }

    // Apply upgrades
    weapon.damage = getScaledWeaponDamage(
      (weapon as any).baseDamage,
      world.upgrades
    );
    weapon.cooldown = getScaledWeaponCooldown(
      (weapon as any).baseCooldown,
      world.upgrades
    );
    weapon.projectileCount = getScaledProjectileCount(
      (weapon as any).baseProjectileCount,
      world.upgrades
    );
  }
}
