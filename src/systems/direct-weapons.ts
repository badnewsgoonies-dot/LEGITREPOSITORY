/**
 * Direct Weapons System - handles non-projectile weapons
 *
 * Aura: Continuous damage around player
 * Melee: Arc-based melee attacks
 * Lightning: Chain lightning between enemies
 */

import type { Weapon, Enemy, Vec2, Contact } from '../types';

/**
 * Process aura weapons (garlic)
 * Damages all enemies within radius
 */
export function processAuraWeapons(
  weapons: Weapon[],
  enemies: Enemy[],
  playerPos: Vec2,
  dt: number
): Contact[] {
  const contacts: Contact[] = [];

  for (const weapon of weapons) {
    if (weapon.behavior !== 'aura' || !weapon.auraRadius) continue;

    // Update cooldown
    weapon.cooldownTimer -= dt;
    if (weapon.cooldownTimer > 0) continue;

    // Reset cooldown
    weapon.cooldownTimer = weapon.cooldown;

    // Damage all enemies in radius
    for (const enemy of enemies) {
      const dx = enemy.pos.x - playerPos.x;
      const dy = enemy.pos.y - playerPos.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = weapon.auraRadius * weapon.auraRadius;

      if (distSq < radiusSq) {
        contacts.push({
          type: 'projectile-enemy',
          entityA: weapon.id,
          entityB: enemy.id,
          damage: weapon.damage,
        });
      }
    }
  }

  return contacts;
}

/**
 * Process melee weapons (whip)
 * Creates arc attack in front of player
 */
export function processMeleeWeapons(
  weapons: Weapon[],
  enemies: Enemy[],
  playerPos: Vec2,
  facingDir: Vec2,
  dt: number
): Contact[] {
  const contacts: Contact[] = [];

  for (const weapon of weapons) {
    if (weapon.behavior !== 'melee' || !weapon.meleeArc || !weapon.meleeRange) continue;

    // Update cooldown
    weapon.cooldownTimer -= dt;
    if (weapon.cooldownTimer > 0) continue;

    // Reset cooldown
    weapon.cooldownTimer = weapon.cooldown;

    // Calculate arc angle
    const facingAngle = Math.atan2(facingDir.y, facingDir.x);
    const arcRadians = (weapon.meleeArc * Math.PI) / 180;
    const halfArc = arcRadians / 2;

    // Check all enemies in arc
    for (const enemy of enemies) {
      const dx = enemy.pos.x - playerPos.x;
      const dy = enemy.pos.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check distance
      if (dist > weapon.meleeRange) continue;

      // Check angle
      const enemyAngle = Math.atan2(dy, dx);
      let angleDiff = enemyAngle - facingAngle;

      // Normalize angle to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) <= halfArc) {
        contacts.push({
          type: 'projectile-enemy',
          entityA: weapon.id,
          entityB: enemy.id,
          damage: weapon.damage,
        });
      }
    }
  }

  return contacts;
}

/**
 * Process lightning weapons
 * Chain lightning between enemies
 */
export function processLightningWeapons(
  weapons: Weapon[],
  enemies: Enemy[],
  playerPos: Vec2,
  dt: number
): Contact[] {
  const contacts: Contact[] = [];

  for (const weapon of weapons) {
    if (weapon.behavior !== 'lightning' || !weapon.chainCount || !weapon.chainRange) continue;

    // Update cooldown
    weapon.cooldownTimer -= dt;
    if (weapon.cooldownTimer > 0) continue;

    // Reset cooldown
    weapon.cooldownTimer = weapon.cooldown;

    if (enemies.length === 0) continue;

    // Start from nearest enemy to player
    let currentPos = playerPos;
    const hitEnemies = new Set<string>();
    let chainsRemaining = weapon.chainCount;

    while (chainsRemaining > 0 && hitEnemies.size < enemies.length) {
      // Find nearest unhit enemy within range
      let nearestEnemy: Enemy | null = null;
      let nearestDist = weapon.chainRange;

      for (const enemy of enemies) {
        if (hitEnemies.has(enemy.id)) continue;

        const dx = enemy.pos.x - currentPos.x;
        const dy = enemy.pos.y - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      if (!nearestEnemy) break;

      // Hit this enemy
      hitEnemies.add(nearestEnemy.id);
      contacts.push({
        type: 'projectile-enemy',
        entityA: weapon.id,
        entityB: nearestEnemy.id,
        damage: weapon.damage,
      });

      // Continue chain from this enemy
      currentPos = nearestEnemy.pos;
      chainsRemaining--;
    }
  }

  return contacts;
}

/**
 * Process all direct weapons and return contacts
 */
export function processDirectWeapons(
  weapons: Weapon[],
  enemies: Enemy[],
  playerPos: Vec2,
  facingDir: Vec2,
  dt: number
): Contact[] {
  const contacts: Contact[] = [];

  // Process each weapon type
  contacts.push(...processAuraWeapons(weapons, enemies, playerPos, dt));
  contacts.push(...processMeleeWeapons(weapons, enemies, playerPos, facingDir, dt));
  contacts.push(...processLightningWeapons(weapons, enemies, playerPos, dt));

  return contacts;
}
